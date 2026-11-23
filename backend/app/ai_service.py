"""AI service layer — calls the Google Gemini API and returns a structured ExplainResponse.

The API key is read from the application settings (server-side environment
variable only). It is never placed in source code or exposed to the frontend.

Compatible with google-genai >= 1.0 (tested on 3.0.0).
"""

import logging
from pathlib import Path
import time

import google.genai as genai
import google.genai.types as types
from pydantic import BaseModel, field_validator

from app.config import settings
from app.pii import redact_pii
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
    document_type: str = "other"
    summary: str = ""
    explanation: str
    payment_info: str = "Brak informacji w piśmie"
    consequences: str = "Brak informacji w piśmie"
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


def _system_instruction_for_language(language: str | None) -> str:
    instruction = get_system_instruction()
    lang = (language or "pl").strip().lower()
    language_instructions = {
        "pl": "Odpowiedz w języku polskim.",
        "en": (
            "Respond in English. Entire response MUST be written in plain English. "
            "Translate summary, explanation, action checklist, document type, payment info, "
            "consequences, and disclaimer into clear, plain English. "
            "If no action is required, output in action checklist: ['No action required']. "
            "If no deadline is present, output: ['No deadline in the letter']. "
            "If no amount is present, output: 'No amount in the letter'. "
            "If payment info is absent, output: 'Missing in the letter'. "
            "If consequences are absent, output: 'Missing in the letter'. "
            "Crucial requirement: keep the exact amount, currency, and deadline dates / terms "
            "identical to what is stated in the original document (do not alter amounts or dates). "
            "Keep literal quotes in source_passages in their original language."
        ),
        "uk": (
            "Відповідай українською мовою. Вся відповідь ОБОВ'ЯЗКОВО має бути написана простою українською мовою. "
            "Переклади резюме, пояснення, план дій, тип документа, інформацію про оплату, наслідки та застереження. "
            "Якщо дій не потрібно, виведи у списку дій: ['Немає необхідних дій']. "
            "Якщо термін відсутній, виведи: ['Немає терміну в листі']. "
            "Якщо сума відсутня, виведи: 'Немає суми в листі'. "
            "Якщо інформація про оплату відсутня, виведи: 'Немає інформації в листі'. "
            "Якщо наслідки відсутні, виведи: 'Немає інформації в листі'. "
            "Важлива вимога: збережи точну суму, валюту та дати/строки виконання такими самими, "
            "як в оригінальному документі (не змінюй суми та дати). "
            "Збережи точні цитати в source_passages мовою оригіналу."
        ),
    }

    if lang not in language_instructions:
        raise ValueError("Unsupported response language. Allowed values: pl, en, uk.")

    return f"{instruction}\n\n{language_instructions[lang]}"


def explain_letter(text: str, language: str | None = None) -> ExplainResponse:
    """Send *text* to the Gemini API and return a structured ExplainResponse.

    Raises:
        ValueError: if *text* is empty or language is unsupported.
        RuntimeError: if the Gemini API call fails after retries or returns an unparseable response.
    """
    if not text or not text.strip():
        raise ValueError("Letter text must not be empty.")

    text = redact_pii(text)
    timeout_ms = int(getattr(settings, "gemini_timeout_seconds", 30.0) * 1000)
    http_opts = types.HttpOptions(timeout=timeout_ms) if hasattr(types, "HttpOptions") else None
    client_kwargs = {"api_key": settings.gemini_api_key}
    if http_opts:
        client_kwargs["http_options"] = http_opts

    client = genai.Client(**client_kwargs)
    system_instruction = _system_instruction_for_language(language)

    max_retries = getattr(settings, "gemini_max_retries", 3)
    response = None
    last_exc: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=text,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=_GeminiExplanation,
                ),
            )
            if response and response.text:
                break
        except Exception as exc:
            last_exc = exc
            logger.warning("Gemini API call attempt %d failed", attempt)
            if attempt < max_retries:
                time.sleep(0.5 * (2 ** (attempt - 1)))
            continue

    if response is None or not response.text:
        logger.error("Gemini API call failed after retries")
        raise RuntimeError("The AI service did not respond. Please try again later.") from last_exc

    raw = response.text
    try:
        data = _GeminiExplanation.model_validate_json(raw)
    except Exception as exc:
        # Never log raw letter or response content to protect user privacy (US-41)
        logger.error("Could not parse Gemini response (JSON validation failed)")
        raise RuntimeError("The AI service returned an unreadable response.") from exc

    return ExplainResponse(
        document_type=data.document_type,
        summary=data.summary,
        explanation=data.explanation,
        payment_info=data.payment_info,
        consequences=data.consequences,
        source_passages=data.source_passages,
        action_checklist=data.action_checklist,
        deadlines=data.deadlines,
        amount=data.amount,
        disclaimer=data.disclaimer,
    )
