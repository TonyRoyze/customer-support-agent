# Relay Support Agent — local proof of concept

Relay turns a customer complaint into a reviewed support ticket and, for one known sample bug, a developer-reviewable draft pull request. It is a single-user, local-first proof of concept. It uses the user's eligible ChatGPT plan through **Sign in with ChatGPT** for triage; it does not use Gemini, Vertex AI, Firebase, Cloud Run, an OpenAI API key, or a shared service account in the target design.

> **Current implementation status:** the existing backend still calls Gemini through Vertex AI and persists reports in Firestore. The OAuth plan-usage integration and migration to local persistence are tracked in [todo.md](todo.md). Until those migration tasks are complete, the current code does not yet match the target architecture described here.

## Target flow

1. Enter a synthetic complaint and optional screenshots.
2. Sign in with ChatGPT and explicitly authorize plan usage for this local app.
3. Ask the Responses API for schema-constrained triage. Review and edit its result.
4. Explicitly create a GitHub issue in the configured test repository.
5. For one allowlisted sample issue only, ask the backend to open a draft PR from a fixed, reviewed patch. All other reports stop at “Needs developer investigation.”

AI usage is charged against the signed-in user's eligible ChatGPT plan allowance and its limits; it is not a free or unlimited app entitlement. See [Sign in with ChatGPT](https://developers.openai.com/siwc/quickstart) and [plan usage for open-source apps](https://developers.openai.com/siwc/token-sharing-open-source). Availability and eligibility can change. This POC is local-first because the open-source plan-usage flow is intended for open-source and locally hosted apps; paid or remotely hosted products need separate eligibility/approval. A deployed public app must not forward a developer's personal OAuth token.

## Run locally

Requirements: Python 3.11+, Node.js 20+, and a GitHub test repository with Issues enabled. The deterministic demo mode should work without a ChatGPT connection or GitHub credential; real model triage and real GitHub writes need their respective user-authorized configuration.

```sh
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

```sh
cp .env.example .env
npm install
npm run dev
```

In a third terminal, start the API using the command documented in [Local POC setup](docs/local-poc-setup.md). Open http://localhost:5173. The setup guide covers ChatGPT OAuth registration, local callback, test-repository credentials, and the complete acceptance walkthrough.

## Local services and data

- React + TypeScript + Vite browser UI.
- FastAPI bound to loopback only; handles OAuth code exchange, refresh, triage, reviewed issue creation, and the one allowlisted patch.
- Sign in with ChatGPT OAuth + PKCE, then the public Responses API with `store: false` and streaming enabled.
- Local SQLite for report records and ticket/PR state; no Firebase or Firestore in the target.
- A fine-grained GitHub token scoped to a dedicated test repository, held by the local backend only.
- No hosted API, queue, email, customer data, arbitrary code execution, or automatic issue creation.

The ChatGPT access/refresh tokens are user credentials. Store them in the operating-system credential store, keep them local, never commit them, and never expose them to the browser. Keep the GitHub token separate and backend-only. Screenshots are sent as model inputs only after the user submits the report, and are not retained after triage or attached to GitHub.

## Documentation

- [POC plan and acceptance criteria](todo.md)
- [Local POC setup, OAuth, and GitHub configuration](docs/local-poc-setup.md)
