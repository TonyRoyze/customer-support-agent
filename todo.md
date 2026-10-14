# Agentic Customer Support System — TODO

An implementation checklist for the plan in [agentic-customer-support-plan.md](./agentic-customer-support-plan.md).

## Proposed stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend API and agent: Python, FastAPI, Google ADK, Gemini on Vertex AI
- Hosting: Firebase Hosting for the frontend; Cloud Run for backend services
- Workflow/state: Pub/Sub for background jobs; Firestore for workflow state
- Integrations: GitHub App for Issues and draft pull requests; Secret Manager for credentials
- Code execution: isolated worker or runner, separate from the API and agent service

## 1. Define the prototype

- [ ] Choose the demo product and one non-production GitHub repository.
- [ ] Choose the demo intake method: web form or seeded sample complaints.
- [ ] Prepare 5–10 synthetic complaints, including incomplete, duplicate, and risky reports.
- [ ] Choose one known, low-risk bug that the coding workflow can attempt to fix.
- [ ] Define the repository and file-path allowlist for code changes.
- [ ] Define the only test and lint commands the worker may run.
- [ ] Define the team ownership map used to suggest assignees.
- [ ] Decide which ticket fields are required before creating a ticket.
- [ ] Write stop/escalation rules for security, privacy, payment, data-loss, and unclear reports.

## 2. Create and configure the GCP project

- [ ] Create a dedicated Google Cloud project for the prototype and enable billing.
- [ ] Choose a region for Cloud Run and related resources.
- [ ] Enable the required APIs: Cloud Run, Vertex AI, Cloud Build, Firestore, Pub/Sub, Secret Manager, and Artifact Registry.
- [ ] Create separate service accounts for the API/agent and coding worker.
- [ ] Grant each service account only the permissions it needs.
- [ ] Configure a budget and billing alerts for the project.
- [ ] Create Secret Manager entries for the GitHub App private key and webhook secret.
- [ ] Do not create or download a service-account key for the frontend.

## 3. Build the frontend

- [ ] Create a React + TypeScript + Vite app.
- [ ] Add Tailwind CSS and initialize shadcn/ui.
- [ ] Build the complaint intake form with fields for description, steps, expected behavior, actual behavior, and optional attachments.
- [ ] Build a triage review view showing summary, category, product area, severity suggestion, confidence, and missing details.
- [ ] Build a ticket view showing labels, suggested owner, status, and source complaint ID.
- [ ] Build a fix-attempt view showing eligible status, progress, checks, changed files, and result.
- [ ] Build a PR review view linking the ticket, branch, draft PR, reviewer, and check results.
- [ ] Add visible loading, error, retry, and empty states.
- [ ] Make all dashboard workflows keyboard accessible.
- [ ] Keep customer-provided text visibly separate from AI-generated summaries.

## 4. Build the backend API

- [ ] Create a Python FastAPI service.
- [ ] Add request validation and size limits for text and attachments.
- [ ] Assign each complaint a stable request ID.
- [ ] Add duplicate detection/idempotency so retries do not create duplicate tickets.
- [ ] Add a privacy sanitization step for secrets and unnecessary personal data.
- [ ] Add API routes for complaint intake, triage status, ticket details, and fix-attempt status.
- [ ] Add authentication and authorization for support/developer actions.
- [ ] If using Firebase Authentication, verify the ID token server-side on protected endpoints.
- [ ] Return structured errors that the frontend can display and users can retry.

## 5. Add the ADK triage agent

- [ ] Create an ADK agent with Gemini on Vertex AI.
- [ ] Define a strict structured output schema for complaint triage.
- [ ] Have the agent classify the report, summarize it, extract reproduction steps, and identify missing information.
- [ ] Treat complaint text, logs, attachments, and repository content as untrusted input.
- [ ] Add a deterministic policy check for escalation and coding eligibility.
- [ ] Ask the agent to draft clarification questions when required details are missing.
- [ ] Keep sending customer replies out of scope for the MVP; show drafts for a human to approve.
- [ ] Verify the agent says when it is uncertain instead of inventing missing details.

## 6. Connect GCP services

- [ ] Assign the API/agent Cloud Run service its dedicated runtime service account.
- [ ] Configure the service account to call Vertex AI and access only required Firestore collections, Pub/Sub topics, and Secret Manager secrets.
- [ ] Use Application Default Credentials from the Cloud Run service identity for Google Cloud APIs.
- [ ] Store workflow records in Firestore: request ID, status, ticket ID, eligibility decision, branch, PR URL, and timestamps.
- [ ] Store attachments in a private Cloud Storage bucket only if the prototype needs them.
- [ ] Publish long-running coding jobs to a Pub/Sub topic.
- [ ] Create an authenticated Pub/Sub push subscription to the coding worker endpoint.
- [ ] Record operational logs without raw complaint text, secrets, or attachment contents.

## 7. Integrate GitHub

- [ ] Create a GitHub App for the prototype.
- [ ] Install it only on the demo repository.
- [ ] Grant the minimum repository permissions needed for reading code, creating issues/branches/PRs, and requesting reviews.
- [ ] Store the GitHub App private key in Secret Manager.
- [ ] Add a backend tool to create an issue from the sanitized triage result.
- [ ] Add a backend tool to assign an issue using the configured ownership map.
- [ ] Add a backend tool to create a short-lived branch for an eligible fix attempt.
- [ ] Add a backend tool to open a draft PR and request review.
- [ ] Link every issue, commit, branch, and PR back to the original request ID.
- [ ] Confirm the GitHub App cannot merge PRs or modify unrelated repositories.

## 8. Implement the isolated fix workflow

- [ ] Require an explicit “Attempt fix” action for the hackathon prototype.
- [ ] Create an isolated, short-lived workspace for each fix attempt.
- [ ] Give the worker only the sanitized ticket, approved repository, and narrow tools it needs.
- [ ] Do not expose production credentials, customer data, or the API service's secrets to the worker.
- [ ] Restrict changed files to the configured path allowlist.
- [ ] Restrict shell/build execution to the configured command allowlist.
- [ ] Set execution time, resource, and retry limits.
- [ ] Check patch size, changed paths, test results, and policy rules before publishing.
- [ ] Stop and escalate if tests fail, scope expands, or the bug is unclear.
- [ ] Create a draft PR only; do not approve, merge, release, or deploy.
- [ ] Include a summary, linked ticket, exact checks run, failures/unrun checks, and known uncertainty in the PR body.

## 9. Deploy the prototype

- [ ] Deploy the FastAPI/ADK service to Cloud Run.
- [ ] Deploy the React static build to Firebase Hosting.
- [ ] Configure the frontend API base URL without embedding secrets.
- [ ] Configure Firebase Hosting rewrites to the Cloud Run API if serving the API through the same domain.
- [ ] Configure CORS only for the deployed frontend origin if using a separate API domain.
- [ ] Verify Cloud Run uses the intended runtime service account.
- [ ] Confirm secrets are injected from Secret Manager, not committed to source control.
- [ ] Add a manual rollback path for the frontend and backend deployment.

## 10. Verify and harden

- [ ] Verify a normal complaint becomes one ticket with a useful structured summary.
- [ ] Verify incomplete complaints produce a clarification draft and do not start a code fix.
- [ ] Verify duplicate submissions do not create duplicate tickets or PRs.
- [ ] Verify risky reports are escalated without creating a PR.
- [ ] Verify prompt-injection text cannot change tool permissions or policy.
- [ ] Verify the worker cannot read secrets or access unrelated repositories.
- [ ] Verify path restrictions and command allowlists are enforced server-side.
- [ ] Verify the agent has no route to merge or deploy code.
- [ ] Verify failed GitHub, Vertex AI, Firestore, and Pub/Sub calls produce recoverable status messages.
- [ ] Verify logs contain operational metadata but not complaint contents or credentials.
- [ ] Review GCP IAM roles, GitHub App permissions, retention, and budget alerts.

## 11. Prepare the hackathon demo

- [ ] Prepare one clear complaint with reproduction steps and a known fix.
- [ ] Prepare one ambiguous complaint that should be escalated.
- [ ] Show intake, triage summary, and issue creation.
- [ ] Show the suggested assignee and why it was selected.
- [ ] Trigger the fix attempt and show progress/status.
- [ ] Show the checks and changed files.
- [ ] Open the draft PR and point out review evidence and the assigned developer.
- [ ] Demonstrate that the ambiguous or risky report does not produce a PR.
- [ ] State that a developer reviews and merges all changes.
- [ ] Record a short backup demo video in case the live integration fails.

## Definition of done

- [ ] A synthetic complaint can be submitted and converted into a ticket.
- [ ] The ticket includes a useful, reviewable triage result and suggested owner.
- [ ] An explicitly eligible low-risk ticket can trigger an isolated fix attempt.
- [ ] Successful checks can produce a linked draft PR for a developer review.
- [ ] Risky, ambiguous, or failing fix attempts stop and escalate.
- [ ] No automated path can merge or deploy a change.
