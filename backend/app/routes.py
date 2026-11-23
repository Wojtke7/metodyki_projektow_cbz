"""FastAPI route definitions for the ProsteFakty backend.

Routes
------
GET  /health   – liveness check; confirms the server is running.
POST /explain  – accepts letter text, calls the AI service, returns explanation.
"""

from fastapi import APIRouter, HTTPException, status

from app.ai_service import explain_letter
from app.schemas import ExplainRequest, ExplainResponse

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


@router.get(
    "/health",
    summary="Health check",
    description="Returns a simple status message confirming the server is running.",
    tags=["Monitoring"],
)
def health() -> dict[str, str]:
    """Liveness endpoint.

    The frontend (or any monitoring tool) can call this to confirm that the
    server is up before sending a document.
    """
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /explain
# ---------------------------------------------------------------------------


@router.post(
    "/explain",
    response_model=ExplainResponse,
    summary="Explain a letter",
    description=(
        "Send the full text of an official letter or document. "
        "The server forwards it to the AI service (Gemini) and returns a "
        "plain-language explanation, relevant source passages from the original "
        "text, an action checklist, and a list of deadlines. "
        "**The AI key is never exposed to the client.**"
    ),
    tags=["Explanation"],
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "The request body is missing or the `text` field is empty.",
        },
        status.HTTP_502_BAD_GATEWAY: {
            "description": "The AI service did not respond or returned an unreadable answer.",
        },
    },
)
def explain(body: ExplainRequest) -> ExplainResponse:
    """Explain the letter text using the AI service.

    - **text**: The full text of the letter (must not be empty).

    Returns a structured JSON object with four fields:
    ``explanation``, ``source_passages``, ``action_checklist``, ``deadlines``.
    """
    try:
        return explain_letter(body.text)
    except ValueError as exc:
        # This should not normally be reached because Pydantic validates
        # min_length=1 on the request body, but we guard it explicitly.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
