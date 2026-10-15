# 3-Day TODO: Barely Working Support Agent Prototype

Goal: demonstrate one path from a customer complaint to a support ticket and a developer-reviewable draft PR. Keep the demo on synthetic data and a test repository.

## Keep the stack small

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: one Python FastAPI service on Cloud Run
- AI: Gemini on Vertex AI; use a single constrained agent/tool workflow
- Source of truth: GitHub Issues and Pull Requests
- Hosting: Firebase Hosting for the frontend, Cloud Run for the API
- No separate database, queue, email integration, or general-purpose coding sandbox for this demo

## Day 1 — Get a visible end-to-end skeleton

- [ ] Create a small React + Vite + TypeScript app and add Tailwind and shadcn/ui.
- [ ] Build one complaint form with title, description, steps to reproduce, expected result, actual result, and upload screenshots.
- [ ] Build a result panel for the AI summary, category, and next action.
- [ ] Create a minimal FastAPI backend with `POST /triage`.
- [ ] Add one sample complaint in case live model access is not ready.
- [ ] Create a GCP project, enable billing, and enable Vertex AI and Cloud Run APIs.
- [ ] Deploy the static frontend to Firebase Hosting if time allows; otherwise run both locally for the first demo.

**Day 1 result:** submitting a complaint shows a summary, even if it uses the sample response.

## Day 2 — Triage and create a GitHub ticket

- [ ] Connect the backend to Gemini through Vertex AI.
- [ ] Make the model return only a small JSON result: summary, type (`bug` / `feature` / `other`), reproduction steps, and confidence.
- [ ] Show the result in the UI and allow the user to review it.
- [ ] Add a **Create ticket** button; do not create tickets automatically during the demo.
- [ ] Create a GitHub Issue in one test repository from the reviewed summary.
- [ ] Use a repository-scoped GitHub credential on the backend only; never put it in React environment variables or browser code.
- [ ] Display the created issue link in the UI.
- [ ] Deploy FastAPI to Cloud Run and call it from the frontend over HTTPS.
- [ ] Use a Cloud Run service account to access Vertex AI; keep GitHub credentials in Secret Manager.

**Day 2 result:** a user can submit a complaint, review AI triage, and create a real issue in the test repo.

## Day 3 — Open one safe, predictable draft PR

- [ ] Pick one known bug in the test repository and prepare a small, predefined patch for it.
- [ ] Add a **Try demo fix** button for that specific issue only.
- [ ] Have the backend create a new branch, apply the predefined patch, and open a draft PR linked to the issue.
- [ ] Put the changed files and a short explanation in the PR description.
- [ ] Assign one developer as reviewer if the repo permits it.
- [ ] Show the draft PR link and status in the frontend.
- [ ] For every other complaint, show “Needs developer investigation” instead of attempting a code change.
- [ ] Prepare one normal complaint and one ambiguous complaint for the live demo.

**Day 3 result:** one known sample bug creates a reviewable draft PR; ambiguous reports stop safely.

## Simple architecture

```text
React + shadcn frontend (Firebase Hosting)
       │ HTTPS request
       ▼
FastAPI API + triage agent (Cloud Run)
       ├── Gemini via Vertex AI: summarize/classify complaint
       ├── GitHub API: create issue
       └── GitHub API: apply one predefined demo patch and create draft PR
```

The React app should only call the FastAPI endpoint. FastAPI calls Vertex AI and GitHub. On Cloud Run, give the service a dedicated service account for Vertex AI access; keep the GitHub credential in Secret Manager. Never place either credential in frontend code.

## Cut from the 3-day build

- [ ] No email or support-platform integration.
- [ ] No automatic customer replies.
- [ ] No automatic assignee selection; use one fixed demo reviewer.
- [ ] No arbitrary AI-generated code edits or shell execution.
- [ ] No database unless the prototype cannot work without one; GitHub can hold demo ticket/PR state.
- [ ] No Pub/Sub, multi-agent setup, production authentication, or real customer data.
- [ ] No merging, deploying, or claiming the AI fix is correct.

## Definition of done

- [ ] Complaint can be submitted from the UI.
- [ ] Gemini returns a short summary and classification through Vertex AI.
- [ ] User can review and create a GitHub Issue.
- [ ] The one known demo bug can produce a linked draft PR.
- [ ] Other or unclear reports do not create code changes.
- [ ] A developer must review and merge the PR.

## Mandatory submission requirements

- [ ] Submit the pitch deck using the prescribed challenge template. Submissions that do not follow the required format may be disqualified.
- [ ] Submit a 3–4 minute video demonstration that clearly shows the solution's working functionality. Videos exceeding the prescribed duration may be penalized or may not progress further in evaluation. If the video does not adequately demonstrate working functionality, the submission will not progress to prototype evaluation under the ladder process.
- [ ] Provide a valid, accessible link to a deployed, working prototype and keep it functional throughout evaluation. The application, APIs, integrations, and other deployment components will be evaluated as they are at evaluation time; no retries or additional allowances are provided for unavailable or non-functional components.
- [ ] Provide an accessible GitHub repository containing the source code and supporting materials, and keep it accessible throughout evaluation.
- [ ] Provide a brief description of what was built, including how Firebase, Firestore, Cloud Run, and Gemini are used in the submission.
