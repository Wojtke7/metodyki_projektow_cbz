"""Pydantic schemas for /explain request and response bodies."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

MAX_TEXT_LENGTH = 50_000


class ExplainRequest(BaseModel):
    """Body sent by the frontend to POST /explain."""

    text: str = Field(
        ...,
        min_length=1,
        description="The full text of the official letter or document to explain.",
        examples=["Szanowny Panie, wzywamy Pana do zapłaty kwoty 1200 zł do dnia 30.11.2024."],
    )
    language: Literal["pl", "en", "uk"] | None = Field(
        default="pl",
        description="Target language for the explanation (pl, en, uk).",
    )

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language(cls, v):
        if v is None:
            return "pl"
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in ("pl", "en", "uk"):
                return v_clean
        raise ValueError("Unsupported response language. Allowed values: pl, en, uk.")


class ExplainResponse(BaseModel):
    """Structured explanation returned by POST /explain and POST /explain/file."""

    document_type: str = Field(
        default="other",
        description="Type of the document, e.g. reminder, summons, decision, information, other.",
    )
    summary: str = Field(
        default="",
        description="Plain-language summary of what the document is about in 2-3 short sentences.",
    )
    explanation: str = Field(
        description="Plain-language explanation of what the document says.",
    )
    payment_info: str = Field(
        default="Brak informacji w piśmie",
        description="Information on how to pay: account number, amount, payment method.",
    )
    consequences: str = Field(
        default="Brak informacji w piśmie",
        description="Consequences of inaction only if explicitly mentioned in the letter.",
    )
    source_passages: list[str] = Field(
        default_factory=list,
        description="Verbatim quotes from the original text that the explanation is based on.",
    )
    action_checklist: list[str] = Field(
        default_factory=list,
        description="List of actions the reader should take.",
    )
    deadlines: list[str] = Field(
        default_factory=list,
        description="Important dates or deadlines mentioned in the document.",
    )
    amount: str = Field(
        default="",
        description="Amount to pay or settlement amount, or 'Brak kwoty w piśmie'.",
    )
    disclaimer: str = Field(
        default="To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma.",
        description="Informational disclaimer.",
    )

    @field_validator("source_passages", "action_checklist", "deadlines", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        return v
