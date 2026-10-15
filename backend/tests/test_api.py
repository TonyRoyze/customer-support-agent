import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import httpx
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main


@pytest.fixture(autouse=True)
def demo(monkeypatch):
    monkeypatch.setenv('DEMO_MODE', 'true')
    monkeypatch.setenv('FIRESTORE_ENABLED', 'false')
    monkeypatch.setenv('GITHUB_TOKEN', 'test-token')
    monkeypatch.setenv('GITHUB_REPOSITORY', 'test/issues')
    main._demo.clear()


client = TestClient(main.app)


def report(**fields):
    return client.post('/triage', data={'title': 'Export broken', 'description': 'Export shows an error', **fields})


def review(result):
    return {'report_id': result['report_id'], 'title': 'Reviewed export failure', 'summary': 'Edited summary', 'type': 'bug', 'reproduction_steps': ['Open Reports', 'Export']}


def github(monkeypatch, status=201):
    mock = MagicMock()
    mock.__enter__.return_value = mock
    mock.post.return_value = httpx.Response(status, json={'html_url': 'https://github.com/test/issues/issues/7', 'number': 7})
    monkeypatch.setattr(main.httpx, 'Client', lambda **kwargs: mock)
    return mock


def test_fallback_has_no_invented_steps_and_no_issue():
    response = report()
    assert response.status_code == 200
    data = response.json()
    assert data['source'] == 'fallback' and data['warning']
    assert data['reproduction_steps'] == []
    assert main._demo[data['report_id']]['status'] == 'review'


def test_reviewed_issue_and_duplicate(monkeypatch):
    data = report(expected_result='CSV downloads', actual_result='Error appears').json()
    mock = github(monkeypatch)
    payload = review(data)
    response = client.post('/issues', json=payload)
    assert response.status_code == 200
    assert response.json()['number'] == 7
    sent = mock.post.call_args.kwargs['json']
    assert sent['title'] == payload['title']
    for text in ['Edited summary', 'Open Reports', 'CSV downloads', 'Error appears', data['report_id']]:
        assert text in sent['body']
    assert client.post('/issues', json=payload).json() == response.json()
    assert mock.post.call_count == 1
    assert main._demo[data['report_id']]['reviewed']['summary'] == 'Edited summary'


@pytest.mark.parametrize('status', [401, 403, 404, 422])
def test_github_rejection_is_actionable_and_retryable(monkeypatch, status):
    data = report().json()
    github(monkeypatch, status)
    response = client.post('/issues', json=review(data))
    assert response.status_code == 502
    assert str(status) in response.json()['detail']
    assert main._demo[data['report_id']]['status'] == 'review'


def test_uncertain_write_is_not_retried(monkeypatch):
    data = report().json()
    mock = github(monkeypatch)
    mock.post.side_effect = httpx.ReadTimeout('timeout')
    assert client.post('/issues', json=review(data)).status_code == 502
    assert client.post('/issues', json=review(data)).status_code == 409
    assert mock.post.call_count == 1


def test_issue_success_survives_storage_failure(monkeypatch):
    data = report().json()
    github(monkeypatch)
    monkeypatch.setattr(main, 'update_report', MagicMock(side_effect=RuntimeError('offline')))
    response = client.post('/issues', json=review(data))
    assert response.status_code == 200
    assert response.json()['warning']
    assert response.json()['url'].startswith('https://github.com/')


def test_upload_limits_and_validation():
    assert report(title=' ').status_code == 422
    assert report(description=' ').status_code == 422
    assert client.post('/triage', data={'title': 'A', 'description': 'B'}, files={'screenshots': ('bad.svg', b'<svg/>', 'image/svg+xml')}).status_code == 422
    assert client.post('/issues', json={'report_id': '../bad'}).status_code == 422


def test_real_path_passes_image_and_rejects_invalid_model_json(monkeypatch):
    monkeypatch.setenv('DEMO_MODE', 'false')
    monkeypatch.setenv('GOOGLE_CLOUD_PROJECT', 'test-project')
    mock = MagicMock()
    mock.__enter__.return_value = mock
    mock.models.generate_content.return_value = SimpleNamespace(text='{"summary":"Observed error", "type":"bug", "reproduction_steps":[], "confidence":0.8}')
    monkeypatch.setattr(main.genai, 'Client', lambda **kwargs: mock)
    response = client.post('/triage', data={'title': 'A', 'description': 'B'}, files={'screenshots': ('screen.png', b'png-data', 'image/png')})
    assert response.status_code == 200
    assert response.json()['source'] == 'gemini'
    content = mock.models.generate_content.call_args.kwargs['contents']
    assert content.parts[1].inline_data.data == b'png-data'
    mock.models.generate_content.return_value.text = '{"summary":"Bad", "type":"invalid", "confidence":2}'
    assert report().status_code == 503
    monkeypatch.setenv('ALLOW_TRIAGE_FALLBACK', 'true')
    assert report().json()['source'] == 'fallback'


def test_firestore_write_failure_is_reported(monkeypatch):
    monkeypatch.setenv('FIRESTORE_ENABLED', 'true')
    monkeypatch.setattr(main, 'database', MagicMock(side_effect=RuntimeError('no database')))
    assert report().status_code == 503


def test_firestore_transaction_claim_and_existing_issue(monkeypatch):
    monkeypatch.setenv('FIRESTORE_ENABLED', 'true')
    db = MagicMock()
    ref = db.collection.return_value.document.return_value
    ref.get.return_value = SimpleNamespace(exists=True, to_dict=lambda: {'status': 'review'})
    monkeypatch.setattr(main, 'database', lambda: db)
    monkeypatch.setattr(main.firestore, 'transactional', lambda fn: fn)
    payload = main.ReviewedIssue(report_id='a' * 32, title='Reviewed', summary='Summary', type='other', reproduction_steps=[])
    record = main.claim_report(payload)
    assert record['status'] == 'creating'
    assert db.transaction.return_value.update.call_args.args[1]['reviewed']['title'] == 'Reviewed'
    ref.get.return_value = SimpleNamespace(exists=True, to_dict=lambda: {'status': 'created', 'issue': {'url': 'https://github.com/test/issues/issues/1', 'number': 1}})
    assert main.claim_report(payload)['issue']['number'] == 1


def test_vertex_sdk_serializes_schema_and_image_offline(monkeypatch):
    import json
    from google.oauth2.credentials import Credentials
    from google.genai import types

    monkeypatch.setenv('GOOGLE_CLOUD_PROJECT', 'test-project')
    original_client = main.genai.Client
    requests = []

    def respond(request):
        requests.append(request)
        return httpx.Response(200, json={'candidates': [{'content': {'role': 'model', 'parts': [{'text': '{"summary":"Reported error", "type":"bug", "reproduction_steps":[], "confidence":0.8}'}]}, 'finishReason': 'STOP'}]})

    def sdk_client(**kwargs):
        kwargs['credentials'] = Credentials(token='offline-test-token')
        kwargs['http_options'] = types.HttpOptions(api_version='v1', client_args={'transport': httpx.MockTransport(respond)})
        return original_client(**kwargs)

    monkeypatch.setattr(main.genai, 'Client', sdk_client)
    result = main.generate_triage({'title': 'Failure', 'description': 'Export fails'}, [('image/png', b'png-data')])
    assert result.type == 'bug'
    assert 'aiplatform.googleapis.com' in str(requests[0].url)
    body = json.loads(requests[0].content)
    assert body['generationConfig']['responseMimeType'] == 'application/json'
    assert 'summary' in body['generationConfig']['responseSchema']['properties']
    inline = body['contents'][0]['parts'][1]['inlineData']
    assert inline.get('mimeType', inline.get('mime_type')) == 'image/png'
