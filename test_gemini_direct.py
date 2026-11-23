#!/usr/bin/env python3
"""Direct Gemini API tester for ProsteFakty.

Usage:
    python3 test_gemini_direct.py [1|2|3] [pl|en|uk]

Examples:
    python3 test_gemini_direct.py 1       # Urząd Skarbowy (PL)
    python3 test_gemini_direct.py 1 en    # Urząd Skarbowy (EN)
    python3 test_gemini_direct.py 1 uk    # Urząd Skarbowy (UK)
    python3 test_gemini_direct.py 2       # ZUS
    python3 test_gemini_direct.py 3       # Bank (brak terminu)
"""

import json
import os
import sys
import time
from pathlib import Path
from urllib import error, request

ROOT_DIR = Path(__file__).resolve().parent
PROMPT_FILE = ROOT_DIR / "prompts" / "system_prompt.txt"
SAMPLES_DIR = ROOT_DIR / "samples"
FALLBACK_MODELS = ["models/gemini-flash-lite-latest", "models/gemini-2.5-flash", "models/gemini-3.1-flash-lite"]


def get_system_prompt_for_language(base_prompt: str, language: str) -> str:
    lang = (language or "pl").strip().lower()
    instructions = {
        "pl": "Odpowiedz w języku polskim.",
        "en": (
            "CRITICAL INSTRUCTION: Respond entirely in English. "
            "All fields (summary, explanation, action_checklist, document_type, payment_info, "
            "consequences, disclaimer) MUST be written in plain English. "
            "If no action is required, output: ['No action required']. "
            "If no deadline is present, output: ['No deadline in the letter']. "
            "If no amount is present, output: 'No amount in the letter'. "
            "If payment info is absent, output: 'Missing in the letter'. "
            "If consequences are absent, output: 'Missing in the letter'. "
            "Do NOT use Polish anywhere in the output, EXCEPT that literal quotes in source_passages "
            "and original amounts, currency symbols, and deadline dates must remain invariant "
            "(do not alter amounts or dates)."
        ),
        "uk": (
            "КРИТИЧНА ІНСТРУКЦІЯ: Відповідай виключно українською мовою. "
            "Усі поля (summary, explanation, action_checklist, document_type, payment_info, "
            "consequences, disclaimer) ОБОВ'ЯЗКОВО мають бути написані простою українською мовою. "
            "Якщо дій не потрібно, виведи: ['Немає необхідних дій']. "
            "Якщо термін відсутній, виведи: ['Немає терміну в листі']. "
            "Якщо сума відсутня, виведи: 'Немає суми в листі'. "
            "Якщо інформація про оплату відсутня, виведи: 'Немає інформації в листі'. "
            "Якщо наслідки відсутні, виведи: 'Немає інформації в листі'. "
            "НЕ використовуй польську мову у відповіді, за винятком того, що точні цитати в source_passages, "
            "оригінальні суми, валюта та дати виконання мають залишатися незмінними "
            "(не змінюй суми та дати)."
        ),
    }
    return f"{base_prompt}\n\n{instructions.get(lang, instructions['pl'])}"


def get_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "")
    if key:
        return key

    for env_path in [ROOT_DIR / ".env", ROOT_DIR / "backend" / ".env"]:
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("GEMINI_API_KEY=") and not line.startswith("#"):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val
    return ""


def clean_json_text(text: str) -> str:
    raw = text.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()


def call_with_sdk(api_key: str, prompt: str, letter_text: str, model: str) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    clean_model = model.replace("models/", "")
    response = client.models.generate_content(
        model=clean_model,
        contents=letter_text,
        config=types.GenerateContentConfig(
            system_instruction=prompt,
            response_mime_type="application/json",
        ),
    )
    return json.loads(clean_json_text(response.text))


def call_with_rest(api_key: str, prompt: str, letter_text: str, model: str) -> dict:
    clean_model = model.replace("models/", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={api_key}"

    payload = {
        "system_instruction": {"parts": [{"text": prompt}]},
        "contents": [{"parts": [{"text": letter_text}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }

    req = request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        raw = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(clean_json_text(raw))


def execute_request_with_retries(api_key: str, prompt: str, letter_text: str) -> dict:
    has_sdk = False
    try:
        import google.genai
        has_sdk = True
    except ImportError:
        pass

    last_error = None

    for model in FALLBACK_MODELS:
        for attempt in range(1, 3):
            try:
                if has_sdk:
                    return call_with_sdk(api_key, prompt, letter_text, model)
                else:
                    return call_with_rest(api_key, prompt, letter_text, model)
            except Exception as e:
                err_str = str(e)
                last_error = err_str
                if "503" in err_str or "overloaded" in err_str.lower() or "unavailable" in err_str.lower():
                    time.sleep(2)
                    continue
                break

    raise RuntimeError(f"Nie udało się połączyć po próbach: {last_error}")


def main():
    print("=" * 70)
    print("PROSTEFAKTY — TEST WYJAŚNIANIA PISM (GEMINI FLASH)")
    print("=" * 70)

    api_key = get_api_key()
    if not api_key:
        print("\n[BŁĄD] Brak klucza GEMINI_API_KEY w pliku .env!")
        sys.exit(1)

    sample_arg = sys.argv[1] if len(sys.argv) > 1 else "1"
    language_arg = sys.argv[2] if len(sys.argv) > 2 else "pl"
    letter_map = {
        "1": ("01_urzad_skarbowy_upomnienie.txt", "Urząd Skarbowy (kwota i termin)"),
        "2": ("02_zus_zawiadomienie_o_niedoplacie.txt", "ZUS (kwota i termin)"),
        "3": ("03_bank_zmiana_regulaminu.txt", "Bank (BRAK TERMINU - informacyjne)"),
    }

    filename, desc = letter_map.get(sample_arg, letter_map["1"])
    letter_path = SAMPLES_DIR / filename
    base_prompt = PROMPT_FILE.read_text(encoding="utf-8")
    prompt = get_system_prompt_for_language(base_prompt, language_arg)
    letter_text = letter_path.read_text(encoding="utf-8")

    print(f"\n📄 Pismo: {filename} ({desc})")
    print(f"🌐 Język odpowiedzi: {language_arg.upper()}")
    print("⏳ Trwa analiza pisma przez model Gemini Flash...")

    try:
        result = execute_request_with_retries(api_key, prompt, letter_text)
    except Exception as e:
        print(f"\n[Błąd]: {e}")
        sys.exit(1)

    def as_list(val):
        if isinstance(val, list):
            return val
        if isinstance(val, str) and val.strip():
            return [val.strip()]
        return []

    actions = as_list(result.get("action_checklist"))
    deadlines = as_list(result.get("deadlines"))
    sources = as_list(result.get("source_passages"))

    print("\n" + "=" * 70)
    print("ODPOWIEDŹ Z MODELU GEMINI (PROSTY JĘZYK):")
    print("=" * 70)
    print(f"\n🏷️  TYP DOKUMENTU:\n  {result.get('document_type', '')}")
    print(f"\n📋 PODSUMOWANIE:\n{result.get('summary', '')}")
    print(f"\n🔍 WYJAŚNIENIE:\n{result.get('explanation', '')}")
    print(f"\n💳 INFORMACJA O PŁATNOŚCI:\n  {result.get('payment_info', '')}")
    print(f"\n⚠️  KONSEKWENCJE BRAKU DZIAŁANIA:\n  {result.get('consequences', '')}")
    print(f"\n✅ PLAN DZIAŁANIA:")
    for step in actions:
        print(f"  • {step}")
    print(f"\n⏰ TERMINY (INVARIANT):")
    for d in deadlines:
        print(f"  • {d}")
    print(f"\n💰 KWOTA (INVARIANT):\n  {result.get('amount', '')}")
    print(f"\n📄 CYTATY ŹRÓDŁOWE:")
    for quote in sources:
        print(f"  > \"{quote}\"")
    print(f"\nℹ️  KLAUZULA:\n{result.get('disclaimer', '')}\n")


if __name__ == "__main__":
    main()
