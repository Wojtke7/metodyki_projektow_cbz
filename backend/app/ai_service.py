"""AI service layer — calls the Google Gemini API and returns a structured ExplainResponse.

The API key is read from the application settings (server-side environment
variable only).  It is never placed in source code or exposed to the frontend.

Compatible with google-genai >= 1.0 (tested on 3.0.0).
"""

import logging

import google.genai as genai
import google.genai.types as types
from pydantic import BaseModel

from app.config import settings
from app.schemas import ExplainResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
Jesteś asystentem, który pomaga zrozumieć trudne oficjalne dokumenty pisane po polsku.

Użytkownik przesyła tekst pisma urzędowego, umowy lub decyzji administracyjnej.
Twoim zadaniem jest:
1. Wyjaśnić dokument prostym, zrozumiałym językiem (pole "explanation").
2. Zacytować dosłownie kluczowe fragmenty z oryginalnego tekstu, na których opierasz wyjaśnienie (pole "source_passages").
3. Podać listę czynności, które odbiorca powinien wykonać (pole "action_checklist").
4. Wypisać wszystkie terminy i daty wymienione w dokumencie (pole "deadlines").

Zasady, których MUSISZ przestrzegać:
- Jeśli informacja nie wynika wprost z tekstu pisma, napisz "Brak informacji w piśmie" — nie zgaduj.
- Nie udzielaj porad prawnych; zaznacz, że wyjaśnienie ma charakter informacyjny.
- Odpowiadaj wyłącznie w języku polskim.
"""

# ---------------------------------------------------------------------------
# Pydantic schema passed to Gemini for guaranteed structured JSON output
# (google-genai >= 1.0 accepts a Pydantic model class as response_schema)
# ---------------------------------------------------------------------------


class _GeminiExplanation(BaseModel):
    explanation: str
    source_passages: list[str]
    action_checklist: list[str]
    deadlines: list[str]


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
                system_instruction=_SYSTEM_PROMPT,
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
        explanation=data.explanation,
        source_passages=data.source_passages,
        action_checklist=data.action_checklist,
        deadlines=data.deadlines,
    )
