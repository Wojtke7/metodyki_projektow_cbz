
"""Manual acceptance tests for US-15 and US-27 using real Gemini responses."""

import re

from test_gemini_direct import (
    PROMPT_FILE,
    SAMPLES_DIR,
    execute_request_with_retries,
    get_api_key,
)

CASES = [
    ("Urząd Skarbowy", "01_urzad_skarbowy_upomnienie.txt"),
    ("ZUS", "02_zus_zawiadomienie_o_niedoplacie.txt"),
    ("Bank", "03_bank_zmiana_regulaminu.txt"),
]


def check_result(name, result):
    errors = []

    amount = result.get("amount")
    deadlines = result.get("deadlines")
    actions = result.get("action_checklist")

    if not isinstance(amount, str):
        errors.append("Pole amount musi być tekstem.")

    if not isinstance(deadlines, list):
        errors.append("Pole deadlines musi być listą.")
        deadlines = []

    if not isinstance(actions, list):
        errors.append("Pole action_checklist musi być listą.")
        actions = []

    if not all(isinstance(x, str) for x in deadlines + actions):
        errors.append("Elementy list muszą być tekstem.")
        return errors

    deadline_text = " ".join(deadlines).lower()

    if name == "Urząd Skarbowy":
        if amount != "1 308,00 zł":
            errors.append("Niepoprawna kwota podatku.")

        if "7 dni" not in deadline_text or not any(
            word in deadline_text for word in ["doręcz", "odebran"]
        ):
            errors.append("Niepoprawny termin względny.")

        if re.search(r"\b\d{2}\.\d{2}\.\d{4}\b", deadline_text):
            errors.append("AI nie powinno obliczać daty bez daty doręczenia.")

    elif name == "ZUS":
        if amount != "430,50 zł":
            errors.append("Niepoprawna kwota ZUS.")

        if deadlines != ["30.11.2026"]:
            errors.append("Niepoprawny termin płatności ZUS.")

    elif name == "Bank":
        if amount != "Brak kwoty w piśmie":
            errors.append("AI wymyśliło kwotę lub podało zły komunikat.")

        if deadlines != ["Brak terminu w piśmie"]:
            errors.append("AI wymyśliło termin lub podało zły komunikat.")

        if actions != ["Brak wymaganych działań"]:
            errors.append("AI sugeruje nieobowiązkowe działania jako zadania.")

    if name != "Bank" and not 2 <= len(actions) <= 5:
        errors.append("Lista musi zawierać od 2 do 5 kroków.")

    return errors


def main():
    api_key = get_api_key()
    if not api_key:
        raise SystemExit("Brak GEMINI_API_KEY.")

    prompt = PROMPT_FILE.read_text(encoding="utf-8")
    passed = 0

    for name, filename in CASES:
        print(f"\nTest: {name}")

        letter = (SAMPLES_DIR / filename).read_text(encoding="utf-8")
        result = execute_request_with_retries(api_key, prompt, letter)
        errors = check_result(name, result)

        if errors:
            print("FAIL")
            for error in errors:
                print(" -", error)
        else:
            print("PASS")
            passed += 1

    print(f"\nWynik: {passed}/{len(CASES)}")
    if passed != len(CASES):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
