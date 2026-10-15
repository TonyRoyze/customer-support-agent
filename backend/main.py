from typing import Annotated

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Relay Support API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/triage")
async def triage(
    title: Annotated[str, Form()],
    description: Annotated[str, Form()],
    steps_to_reproduce: Annotated[str, Form()] = "",
    expected_result: Annotated[str, Form()] = "",
    actual_result: Annotated[str, Form()] = "",
    screenshots: Annotated[list[UploadFile] | None, File()] = None,
) -> dict:
    """Sample response keeps the first demo usable before Vertex AI is configured."""
    lowered = f"{title} {description}".lower()
    kind = "bug" if any(word in lowered for word in ("can't", "cannot", "error", "broken", "freeze", "fail", "issue")) else "other"
    steps = [line.strip(" -*\t") for line in steps_to_reproduce.splitlines() if line.strip()]
    if not steps:
        steps = ["Review the customer's description", "Reproduce the behavior in the affected area"]
    details = description.strip()
    summary = f"{title.strip()}: {details}" if details else title.strip()
    return {
        "summary": summary,
        "type": kind,
        "reproduction_steps": steps[:6],
        "confidence": 0.72 if steps_to_reproduce.strip() else 0.56,
        "next_action": "Have a developer reproduce the issue and confirm the expected behavior.",
        "source": "sample",
        "attachment_count": len(screenshots or []),
        "expected_result": expected_result,
        "actual_result": actual_result,
    }
