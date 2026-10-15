# Relay Support Agent

A small synthetic-data prototype for turning a customer complaint into reviewed triage and, in later steps, a GitHub issue and a safe draft pull request.

## Local development

Install Node.js 20+ and Python 3.11+, then run the frontend and API in separate terminals:

```sh
npm install
npm run dev
```

```sh
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open http://localhost:5173. The form calls `POST /triage`; until Vertex AI is configured, FastAPI returns a deterministic sample triage response. Set `VITE_API_URL` in a root `.env` file to point the frontend at a different API origin.

## Deployment outline

- Build the frontend with `npm run build` and deploy `dist/` with Firebase Hosting (`firebase.json` is included).
- Deploy `backend/` as a Cloud Run service using its Dockerfile.
- Set the frontend's `VITE_API_URL` to the HTTPS Cloud Run URL and add that deployed origin to the backend CORS allowlist.
- Later, grant the Cloud Run service account Vertex AI access and load any GitHub credential from Secret Manager. Keep secrets out of the frontend.

## Current scope

The complaint form, screenshot selection, triage result review, sample API, and UI flow are scaffolded. GitHub issue creation, Gemini/Vertex AI, and the single predefined demo patch / draft PR remain integration work. The “Create ticket” control is currently a demo placeholder and does not create a remote issue.
