"""Helper loader for system prompt and JSON Schema."""

import json
from pathlib import Path

_PROMPTS_DIR = Path(__file__).resolve().parent


def get_system_prompt() -> str:
    """Load the plain-language system prompt (US-14)."""
    prompt_file = _PROMPTS_DIR / "system_prompt.txt"
    return prompt_file.read_text(encoding="utf-8").strip()


def get_explanation_schema() -> dict:
    """Load the JSON Schema for structured explanation responses."""
    schema_file = _PROMPTS_DIR / "explanation_schema.json"
    with open(schema_file, "r", encoding="utf-8") as f:
        return json.load(f)

