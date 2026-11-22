"""FastAPI route definitions for the ProsteFakty backend.

Routes
------
GET  /health       – liveness check; confirms the server is running.
POST /explain      – accepts letter text and language, calls the AI service, returns explanation.
POST /explain/file – extracts and explains a PDF, DOCX, or TXT upload in the chosen language.
"""

from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.ai_service import explain_letter
from app.config import settings
from app.documents import (
    DocumentTooLargeError,
    DocumentTypeError,
    MAX_UPLOAD_SIZE_MB,
    MAX_UPLOAD_SIZE_BYTES,
    NoDocumentTextError,
    extract_document_text,
)
from app.rate_limiter import check_rate_limit
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
        "plain-language explanation, document type, payment info, consequences, "
        "relevant source passages, an action checklist, and deadlines in the chosen language. "
        "**The AI key is never exposed to the client.**"
    ),
    tags=["Explanation"],
    responses={
        413: {
            "description": "The submitted letter text exceeds the maximum allowed length.",
        },
        422: {
            "description": "The request body is missing, the `text` field is empty, or the language is unsupported.",
        },
        429: {
            "description": "Rate limit exceeded for the client IP address.",
        },
        502: {
            "description": "The AI service did not respond or returned an unreadable answer.",
        },
    },
)
def explain(body: ExplainRequest, request: Request) -> ExplainResponse:
    """Explain the letter text using the AI service.

    - **text**: The full text of the letter (max length enforced).
    - **language**: Optional target language (pl, en, uk). Default: pl.

    Returns a structured JSON object with plain language explanation,
    document type, action checklist, deadlines, amounts, payment info, and consequences.
    """
    # Enforce rate limiting per client IP (US-41)
    check_rate_limit(request)

    # Enforce maximum text length limit (US-41)
    if len(body.text) > settings.max_text_length:
        raise HTTPException(
            status_code=413,
            detail=f"The submitted letter exceeds the maximum allowed length of {settings.max_text_length} characters.",
        )

    try:
        return explain_letter(body.text, language=body.language)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# POST /explain/file
# ---------------------------------------------------------------------------


@router.post(
    "/explain/file",
    response_model=ExplainResponse,
    summary="Explain an uploaded document",
    description=(
        "Upload a PDF, DOCX, or TXT document as `file`. The server extracts its "
        "text temporarily and returns the same explanation as `POST /explain`."
    ),
    tags=["Explanation"],
    responses={
        413: {
            "description": "The upload or extracted document exceeds its size limit.",
        },
        415: {
            "description": "The file content is not a supported PDF, DOCX, or TXT document.",
        },
        422: {
            "description": "No readable text could be extracted from the document or language is unsupported.",
        },
        429: {
            "description": "Rate limit exceeded for the client IP address.",
        },
        502: {
            "description": "The AI service did not respond or returned an unreadable answer.",
        },
    },
)
async def explain_file(
    request: Request,
    file: UploadFile = File(...),
    language: str | None = Form(default=None),
) -> ExplainResponse:
    """Extract and explain a supported uploaded document."""
    # Enforce rate limiting per client IP (US-41)
    check_rate_limit(request)

    # Validate language parameter if provided (US-42)
    normalized_language = None
    if language is not None and language.strip():
        clean_lang = language.strip().lower()
        if clean_lang not in ("pl", "en", "uk"):
            raise HTTPException(
                status_code=422,
                detail="Unsupported response language. Allowed values: pl, en, uk.",
            )
        normalized_language = clean_lang

    try:
        content = await file.read(MAX_UPLOAD_SIZE_BYTES + 1)
        if len(content) > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"The uploaded file exceeds the {MAX_UPLOAD_SIZE_MB} MB size limit.",
            )
        try:
            text = await run_in_threadpool(extract_document_text, content)
        except DocumentTooLargeError as exc:
            raise HTTPException(
                status_code=413,
                detail=str(exc),
            ) from exc
        except DocumentTypeError as exc:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=str(exc),
            ) from exc
        except NoDocumentTextError as exc:
            raise HTTPException(
                status_code=422,
                detail=str(exc),
            ) from exc

        # Also verify extracted text against maximum character limit (US-41)
        if len(text) > settings.max_text_length:
            raise HTTPException(
                status_code=413,
                detail=f"The extracted text exceeds the maximum allowed length of {settings.max_text_length} characters.",
            )

        try:
            return await run_in_threadpool(
                explain_letter,
                text,
                language=normalized_language,
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail=str(exc),
            ) from exc
        except RuntimeError as exc:
            raise HTTPException(
                status_code=502,
                detail=str(exc),
            ) from exc
    finally:
        await file.close()
