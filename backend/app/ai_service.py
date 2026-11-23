"""AI service layer — calls the Google Gemini API and returns a structured ExplainResponse.

The API key is read from the application settings (server-side environment
variable only). It is never placed in source code or exposed to the frontend.

Compatible with google-genai >= 1.0 (tested on 3.0.0).
"""

import logging
from pathlib import Path

import google.genai as genai
import google.genai.types as types
from pydantic import BaseModel, field_validator

from app.config import settings
from app.schemas import ExplainResponse

logger = logging.getLogger(__name__)

# Path to system prompt in prompts/ directory
_PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "system_prompt.txt"


def get_system_instruction() -> str:
    """Load system prompt from prompts/ directory or fallback to plain default."""
    if _PROMPT_PATH.exists():
        return _PROMPT_PATH.read_text(encoding="utf-8").strip()
    return (
        "Jesteś asystentem aplikacji ProsteFakty. Wyjaśniaj trudne pisma urzędowe "
        "krótkimi, prostymi zdaniami, bez żargonu prawniczego. Nie zmyślaj faktów."
    )


# ---------------------------------------------------------------------------
# Pydantic schema passed to Gemini for guaranteed structured JSON output
# ---------------------------------------------------------------------------


class _GeminiExplanation(BaseModel):
    summary: str = ""
    explanation: str
    source_passages: list[str] = []
    action_checklist: list[str] = []
    deadlines: list[str] = []
    amount: str = ""
    disclaimer: str = (
        "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. "
        "W razie wątpliwości skontaktuj się z nadawcą pisma."
    )

    @field_validator("source_passages", "action_checklist", "deadlines", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        return v


def explain_letter(text: str) -> ExplainResponse:
    """Send *text* to the Gemini API and return a structured ExplainResponse.

    Raises:
        ValueError: if *text* is empty (caller should validate before this point).
        RuntimeError: if the Gemini API call fails or returns an unparseable response.
    """
    if not text or not text.strip():
        raise ValueError("Letter text must not be empty.")

    client = genai.Client(api_key=settings.gemini_api_key)

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=text,
            config=types.GenerateContentConfig(
                system_instruction=get_system_instruction(),
                response_mime_type="application/json",
                response_schema=_GeminiExplanation,
            ),
        )
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise RuntimeError("The AI service did not respond. Please try again later.") from exc

    raw = response.text
    if not raw:
        raise RuntimeError("The AI service returned an empty response.")

    try:
        data = _GeminiExplanation.model_validate_json(raw)
    except Exception as exc:
        logger.error("Could not parse Gemini response: %s", raw[:200])
        raise RuntimeError("The AI service returned an unreadable response.") from exc

    return ExplainResponse(
        summary=data.summary,
        explanation=data.explanation,
        source_passages=data.source_passages,
        action_checklist=data.action_checklist,
        deadlines=data.deadlines,
        amount=data.amount,
        disclaimer=data.disclaimer,
    )
