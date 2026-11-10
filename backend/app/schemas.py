"""Pydantic schemas for /explain request and response bodies."""

from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    """Body sent by the frontend to POST /explain."""

    text: str = Field(
        ...,
        min_length=1,
        description="The full text of the official letter or document to explain.",
        examples=["Szanowny Panie, wzywamy Pana do zapłaty kwoty 1200 zł do dnia 30.11.2024."],
    )


class ExplainResponse(BaseModel):
    """Structured explanation returned by POST /explain."""

    explanation: str = Field(
        description="Plain-language summary of what the document says.",
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
