# Local POC setup

This guide describes the target, local-only POC in `todo.md`. The code migration from Vertex AI/Firestore to ChatGPT plan usage/SQLite is not complete yet; see the implementation status in the root README. Do not follow the old GCP deployment commands or put ChatGPT plan tokens on a server.

## What “use the Codex subscription” means here

Use Codex signed in with your ChatGPT account to build and maintain this repo. For the app's own triage requests, the intended integration is **Sign in with ChatGPT plan usage**: an end user authorizes this app to make eligible Responses API requests using that user's ChatGPT plan allowance. This is a distinct OAuth integration; it is not the app borrowing Codex CLI credentials. It requires user consent and is currently documented for open-source and locally hosted apps. OpenAI notes that remotely hosted/paid apps need separate approval. Review the [Sign in with ChatGPT quickstart](https://developers.openai.com/siwc/quickstart), [open-source plan usage overview](https://developers.openai.com/siwc/token-sharing-open-source), and [plan sign-in flow](https://developers.openai.com/siwc/token-sharing-open-source/sign-in) before implementing it.

Plan limits still apply. This avoids an API key and separate API billing for these eligible user-authorized requests; it does not make usage unlimited or guarantee availability to every account.

## Local prerequisites

- Python 3.11 or newer.
- Node.js 20 or newer.
- GitHub account and a dedicated synthetic-data test repository with Issues enabled.
- ChatGPT account eligible to authorize plan usage in this app. The deterministic sample mode should remain available when plan usage is not connected.

No GCP project, Firebase project, OpenAI API key, Gemini key, or hosted service is needed for the target local POC.

## Run the app

From the repository root:

```sh
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

In another terminal:

```sh
cp .env.example .env
npm install
npm run dev
```

After the OAuth and provider migration is implemented, start FastAPI bound only to the loopback interface:

```sh
source backend/.venv/bin/activate
uvicorn main:app --app-dir backend --env-file backend/.env --host 127.0.0.1 --port 8000 --reload
```

Open <http://localhost:5173>. The OAuth callback listener uses the fixed loopback callback configured for the app (for example `http://127.0.0.1:1455/auth/callback`); start that listener before opening the ChatGPT sign-in page. The callback scheme, host, and path must remain consistent with the registered client. Only choose a different port if the official flow and saved registration support it.

## Sign in with ChatGPT plan usage

Implement this OAuth flow in the local backend, not in React:

1. On first run, create and persist one stable opaque `ext_agent_host_id` for this installation. Do not generate a new host ID on every login or app restart.
2. Start a callback listener on loopback and generate fresh random `state`, OIDC `nonce`, and PKCE verifier for each login attempt.
3. For first registration, send `client_id=dynamic_agent_client`, a stable `agent_name_hint`, and this host ID. Save the issued `oaiapp_...` client ID from the callback/token response for subsequent sign-ins.
4. Request only the required scopes: identity (`openid profile email`) and plan usage (`offline_access resource.invoke chatgpt.tokens.use.direct`). Use resource `https://api.openai.com/v1`, PKCE `S256`, and the OpenAI authorize/token endpoints defined in the linked official documentation.
5. Validate `state`, OAuth errors, nonce, and the ID token. Exchange the authorization code with the same callback URI, PKCE verifier, resource, and issued client ID. No API key or client secret is part of this open-source flow.
6. Store access/refresh credentials in the OS credential store. Never put them in browser storage, SQLite, `.env`, source control, logs, API responses, or a shared hosted backend. Implement token refresh, logout/revocation, account switching, and clear status/errors.
7. Query the authorized user's model catalog and display supported choices. Do not hard-code a model slug as an entitlement check.

The app's backend sends the user's OAuth bearer token only to `https://api.openai.com/v1/responses`. Set `store: false` and `stream: true`; process streaming events and handle interrupted/failed responses. Use only models returned for the connected account. Do not call private ChatGPT `backend-api` routes. Text and supported image inputs are available, while several built-in tools and audio/video inputs are not part of this flow; check the current [limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) before adding features.

## GitHub test repository

1. Create a private or public test repo that contains only synthetic data and enable Issues.
2. Create a fine-grained personal access token restricted to that repository and grant only **Issues: Read and write** for issue creation. The GitHub API's create-issue endpoint documents this permission.
3. Put the token in a local ignored backend secret location (prefer OS credential store; a gitignored `.env` is acceptable for this single-user local POC). Configure owner/repository separately.
4. Do not put it in any `VITE_*` variable, frontend code, issue text, or logs. The token is distinct from the ChatGPT OAuth token.

For Day 3 draft PR creation, the credential will also need narrowly scoped contents and pull-request permissions. Prefer a separate test-only token for that operation and document the extra access; never enable arbitrary repository selection.

## Local storage and screenshots

Use SQLite under a gitignored local data directory. Set restrictive file permissions, do not sync or commit the database, and add a reset action. Keep the minimum report data needed for reviewing and preventing duplicate remote writes. Store issue and draft PR identifiers for reconciliation.

Read and validate screenshot MIME types, count, and byte limits in FastAPI. Pass uploaded image bytes to the selected model only on explicit triage submit; discard the bytes after the response. Store neither screenshot files nor their contents in SQLite or GitHub. Treat all report text and image content as untrusted instructions.

## End-to-end POC walkthrough

1. Run the deterministic fallback and confirm it is labeled as sample output, not AI.
2. Connect ChatGPT, consent to the plan-usage scope, and confirm a connected account/model is shown.
3. Submit a synthetic bug report, with and without a screenshot; verify structured `summary`, `type`, `reproduction_steps`, and `confidence`.
4. Edit the triage and confirm it. Verify triage alone makes no GitHub write.
5. Explicitly create the issue, open its link, and confirm it contains the reviewed fields plus the original report context.
6. Submit the one preselected demo bug and use its allowlisted fixed patch to open a **draft** PR linked to the issue. Confirm every other report says it needs developer investigation.
7. Retry successful and uncertain writes; verify duplicates are prevented and uncertain outcomes require repository reconciliation.
8. Disconnect the ChatGPT account and clear local report data. Verify credentials, screenshots, database files, and tokens are absent from Git.

Run the local checks after the provider migration:

```sh
npm run build
python -m pytest backend/tests -q
```

## Not part of this POC

Firebase Hosting, Firestore, Cloud Run, Vertex AI, GCP IAM/service accounts, competition submission requirements, production accounts, multiple users, real customer information, automatic customer responses, unrestricted generated patches, merging, or deployment of generated fixes.
