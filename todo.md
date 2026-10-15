# Relay Support Agent — POC plan

## Goal

Build a local-first, single-user proof of concept that takes a synthetic customer complaint through AI triage, human review, a real GitHub issue, and one safe draft pull request. Use the user's eligible ChatGPT plan through Sign in with ChatGPT for model usage. Use Codex with the developer's ChatGPT subscription to build and maintain the software; do not treat the Codex subscription as a server API key.

The Sign in with ChatGPT plan-usage flow is documented for open-source and locally hosted apps. It may require an eligible ChatGPT account, user consent, and client registration; eligibility, model availability, and usage limits are controlled by OpenAI and may change. Do not design this POC to run as a public hosted service that shares the developer's plan token. See [OpenAI's Sign in with ChatGPT docs](https://developers.openai.com/siwc/quickstart) and [open-source plan-usage docs](https://developers.openai.com/siwc/token-sharing-open-source).

## Product scope and architecture

```text
Browser UI (localhost:5173)
       │ same-machine HTTP only
       ▼
FastAPI (127.0.0.1)
       ├── ChatGPT OAuth + PKCE: sign-in and user-consented plan usage
       ├── Responses API: structured multimodal complaint triage
       ├── SQLite: local reports, review and GitHub operation state
       └── GitHub API: explicit issue creation and one allowlisted draft fix
```

- Frontend: existing React + TypeScript + Vite app.
- Backend: existing FastAPI app, bound to loopback for this single-user POC.
- Model: user's selected, available model through the public Responses API using the OAuth token issued for ChatGPT plan usage. Send `store: false` and `stream: true` as required by the plan-usage flow.
- Login: Sign in with ChatGPT, using OAuth authorization code flow with PKCE, state and nonce validation, refresh handling, and a loopback callback. Do not use an API key or a developer's Codex CLI credentials.
- Persistence: local SQLite database; no Firestore, Firebase, or cloud database.
- GitHub: backend-only, fine-grained token scoped to one test repository. Keep it separate from ChatGPT OAuth credentials.
- Demo: deterministic mode with clearly labeled sample triage, so the UI flow is demonstrable without model entitlement. Creating remote GitHub issues/PRs still requires a valid test repository credential.

## Build plan

### 1. Make the local demo honest and runnable

- [x] Create React + Vite + TypeScript frontend and FastAPI backend.
- [x] Build the complaint form with title, description, reproduction steps, expected/actual behavior, and screenshot upload.
- [x] Build a triage result and review panel; keep create-ticket action explicit.
- [x] Add local setup and configuration documentation.
- [ ] Remove Google Cloud, Gemini/Vertex AI, Firestore, Firebase Hosting, and Cloud Run setup from the runtime configuration and docs.
- [ ] Provide deterministic, visibly labeled sample triage that can run without ChatGPT OAuth.
- [ ] Ensure the API binds to `127.0.0.1` and rejects non-loopback origins/requests for this local-only single-user prototype.

### 2. Add ChatGPT plan sign-in and triage

- [ ] Register this open-source/local app for Sign in with ChatGPT plan usage; configure `agent_name_hint` and the loopback callback consistently.
- [ ] Add a **Continue with ChatGPT** connection flow: generate/persist a stable host ID, generate fresh state/nonce/PKCE verifier per authorization attempt, request only required identity and plan-usage scopes, validate the callback, exchange the code, and verify the ID token.
- [ ] Store issued client ID and refresh credentials in the operating-system credential store; never store them in browser local storage, SQLite, logs, or the repository.
- [ ] Implement refresh, disconnect, reconnect, OAuth error handling, and clear account/plan connection status in the UI.
- [ ] List available models for the authorized account and let the user choose an available model (or select a documented default after querying the account).
- [ ] Replace Gemini calls with `POST /v1/responses` using the user's OAuth token; do not call ChatGPT private `backend-api` routes.
- [ ] Request streamed output with `store: false`, accept text and image inputs supported by the selected model, and constrain the final triage object to `summary`, `type` (`bug` / `feature` / `other`), `reproduction_steps`, and `confidence`.
- [ ] Treat complaint text and screenshots as untrusted input. Do not invent steps or causes. Validate model output on the backend before returning it.
- [ ] Clearly distinguish ChatGPT-plan triage from deterministic demo fallback; never label fallback output as AI-generated.

### 3. Keep reports and operations local

- [ ] Replace Firestore with SQLite tables for reports, original complaint fields, model result, user-reviewed edits, and external operation status/IDs.
- [ ] Set SQLite file permissions to the current user; exclude the database and backups from Git.
- [ ] Save only screenshot metadata and any data needed for the review; delete uploaded bytes after inference and do not attach screenshots to GitHub.
- [ ] Add a retention/reset action that deletes local reports and credentials without affecting already-created GitHub issues.
- [ ] Preserve duplicate protection for issue/PR writes. If a remote write outcome is uncertain, show its status and require reconciliation before another attempt.

### 4. Create reviewed GitHub issues

- [x] Add an explicit **Create ticket** action and GitHub issue endpoint.
- [x] Format an issue from the reviewed summary/classification/reproduction notes and the original complaint.
- [x] Show the returned issue number/link, actionable errors, and prevent automatic issue creation during triage.
- [ ] Keep GitHub token in a local backend-only ignored env file or OS keychain; do not return it to the browser or include it in OAuth tokens.
- [ ] Document a fine-grained credential restricted to one synthetic-data test repository with only the permissions needed for issues, and verify Issues are enabled.
- [ ] Confirm issue creation is idempotent for retries and that uncertain failures are not blindly replayed.

### 5. Add one safe draft PR path

- [ ] Select a small known bug in the dedicated test repository and add one reviewed, predefined patch to the backend configuration/source.
- [ ] Add a **Try demo fix** action only for that allowlisted report/bug; all other reports must return “Needs developer investigation.”
- [ ] Create a new branch from the configured base, apply only the predefined file contents, and open a GitHub draft PR linked to the issue.
- [ ] Do not accept arbitrary model-produced diffs, shell commands, file paths, repositories, or branch names.
- [ ] Use a separate least-privilege GitHub credential for contents/PR creation, or clearly document the extra permissions on the single test-only token.
- [ ] Display the draft PR link and state; never merge, deploy, or claim the fix is correct.

### 6. Verify the complete local POC

- [x] Add backend tests that mock model/GitHub/cloud interactions.
- [ ] Remove cloud-specific tests and replace them with mocked OAuth, Responses API, SQLite, and GitHub behavior tests.
- [ ] Check OAuth state/nonce/PKCE failures, token refresh/revocation, no-auth demo mode, malformed model output, screenshot limits, CORS/loopback restrictions, GitHub rejection, and uncertain-write recovery.
- [ ] Run `npm run build` and `python -m pytest backend/tests -q`.
- [ ] Walk through: connect ChatGPT plan → submit synthetic complaint → review/edit triage → create issue → use allowlisted fix → open draft PR → disconnect and clear local data.
- [ ] Confirm no secrets, real customer data, uploaded image bytes, GCP setup, or generated database files are present in Git.

## POC definition of done

- [ ] Fresh clone can run locally from the README without a GCP project.
- [ ] User can complete a ChatGPT plan connection on an eligible account, and app shows when plan usage is unavailable or disconnected.
- [ ] A submitted synthetic complaint returns validated structured triage through the Responses API using the user's authorized plan, including image understanding where supported.
- [ ] User can edit and confirm the result before any GitHub write.
- [ ] User can create and open a real GitHub Issue in the configured test repository.
- [ ] One explicitly allowlisted bug can produce a draft PR with a fixed patch and linked issue; other reports never trigger code changes.
- [ ] Local state and credentials are user-scoped, excluded from Git, and can be cleared.
- [ ] Demo mode works without OpenAI plan authorization and is clearly labeled as deterministic sample output.
- [ ] Automated checks and the end-to-end local walkthrough pass.

## Explicitly out of scope

- Competition submission materials, pitch decks, prescribed demo video, judging/evaluation hosting requirements.
- Gemini, Vertex AI, GCP billing, Firebase Hosting, Firestore, Cloud Run, API keys, or service-account deployment.
- Public/multi-user production hosting, team accounts, arbitrary repositories, real customer information, or browser-held credentials.
- Automatic replies, emails, support-system integration, auto-assignment, queues, unrestricted coding agents, automatic merges, or deployments.
