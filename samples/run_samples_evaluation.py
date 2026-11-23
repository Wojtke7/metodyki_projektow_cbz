#!/usr/bin/env python3
"""Manually evaluate sample letters against the running ProsteFakty API.

This is deliberately not a pytest test: every run makes real Gemini requests.
Start the backend with a real GEMINI_API_KEY, then run this script from the
repository root. Semantic checks (unsupported facts and privacy) still require
human review; the script checks expected facts and source quotations.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = ROOT_DIR / "samples"
DEFAULT_API_URL = os.getenv("PROSTEFAKTY_API_URL", "http://127.0.0.1:8000")

CASES = [
    {
        "file": "01_urzad_skarbowy_upomnienie.txt",
        "type": "upomnienie podatkowe",
        "amount": "1 308,00 zł",
        "deadline_tokens": ["7 dni", "doręczenia"],
    },
    {
        "file": "02_zus_zawiadomienie_o_niedoplacie.txt",
        "type": "niedopłata składek ZUS",
        "amount": "430,50 zł",
        "deadline_tokens": ["30.11.2026"],
    },
    {
        "file": "03_bank_zmiana_regulaminu.txt",
        "type": "informacja bankowa; brak kwoty i terminu działania",
        "amount": None,
        "deadline_tokens": None,
    },
    {
        "file": "04_faktura_energia.txt",
        "type": "faktura za energię",
        "amount": "187,44 zł",
        "deadline_tokens": ["15.12.2026"],
    },
    {
        "file": "05_zaleglosc_czynszowa.txt",
        "type": "wezwanie dotyczące czynszu",
        "amount": "620,00 zł",
        "deadline_tokens": ["01.12.2026"],
    },
    {
        "file": "06_decyzja_ubezpieczeniowa.txt",
        "type": "decyzja ubezpieczyciela",
        "amount": "2 450,00 zł",
        "deadline_tokens": ["14 dni", "otrzymania"],
    },
    {
        "file": "07_oplata_parkingowa.txt",
        "type": "opłata parkingowa",
        "amount": "120,00 zł",
        "deadline_tokens": ["7 dni", "doręczenia"],
    },
    {
        "file": "08_informacja_operatora.txt",
        "type": "informacja od operatora; brak kwoty i terminu działania",
        "amount": None,
        "deadline_tokens": None,
    },
    {
        "file": "09_skan_wniosek_ocr.txt",
        "type": "transkrypcja OCR pisma otrzymanego jako skan",
        "amount": None,
        "deadline_tokens": ["14 dni", "otrzymania"],
        "placeholders": ["[IMIĘ I NAZWISKO]", "[ADRES]", "[NUMER SPRAWY]"],
    },
]

MISSING_AMOUNT_MARKER = "brak kwoty w piśmie"
MISSING_DEADLINE_MARKER = "brak terminu w piśmie"


def load_file(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).casefold().strip()


def compact(value: str) -> str:
    return re.sub(r"\s+", "", normalize(value))


def as_text_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, str)]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def call_api(api_url: str, text: str, timeout: int) -> dict:
    payload = json.dumps({"text": text}, ensure_ascii=False).encode("utf-8")
    request = Request(
        f"{api_url.rstrip('/')}/explain",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def evaluate_case(case: dict, api_url: str, timeout: int) -> tuple[bool, list[str]]:
    path = SAMPLES_DIR / case["file"]
    source = load_file(path)
    print(f"\n--- {case['file']} ({case['type']}) ---")

    try:
        result = call_api(api_url, source, timeout)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        print(f"API error {error.code}: {detail}")
        return False, ["API request"]
    except (TimeoutError, URLError, json.JSONDecodeError) as error:
        print(f"API request failed: {error}")
        return False, ["API request"]

    amount = result.get("amount", "")
    deadlines = as_text_list(result.get("deadlines"))
    source_passages = as_text_list(result.get("source_passages"))
    checks: list[tuple[str, bool]] = []

    if case["amount"]:
        checks.append(("expected amount", compact(case["amount"]) in compact(str(amount))))
    else:
        checks.append(("missing amount marker", MISSING_AMOUNT_MARKER in normalize(str(amount))))

    if case["deadline_tokens"]:
        actual_deadlines = normalize(" ".join(deadlines))
        checks.append(
            (
                "expected deadline",
                all(normalize(token) in actual_deadlines for token in case["deadline_tokens"]),
            )
        )
    else:
        checks.append(
            ("missing deadline marker", MISSING_DEADLINE_MARKER in normalize(" ".join(deadlines)))
        )

    normalized_source = normalize(source)
    grounded_quotes = bool(source_passages) and all(
        normalize(quote) in normalized_source for quote in source_passages
    )
    checks.append(("source quotations match letter", grounded_quotes))

    for placeholder in case.get("placeholders", []):
        checks.append((f"source contains {placeholder}", placeholder in source))

    for label, passed in checks:
        print(f"{'PASS' if passed else 'FAIL'} {label}")

    print(f"Amount: {amount}")
    print(f"Deadlines: {deadlines}")
    print(f"Actions: {as_text_list(result.get('action_checklist'))}")
    print("Manual review: check unsupported facts and that placeholders remain anonymous.")

    failures = [label for label, passed in checks if not passed]
    return not failures, failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Running backend base URL")
    parser.add_argument("--timeout", type=int, default=120, help="Seconds per Gemini request")
    parser.add_argument("--sample", help="Run only the named sample file")
    parser.add_argument("--list", action="store_true", help="List cases without calling Gemini")
    args = parser.parse_args()

    cases = CASES
    if args.sample:
        cases = [case for case in CASES if case["file"] == args.sample]
        if not cases:
            parser.error(f"Unknown sample: {args.sample}")

    print(f"ProsteFakty US-48 manual quality evaluation ({len(cases)} case(s))")
    if args.list:
        for case in cases:
            print(f"{case['file']}: {case['type']}")
        return 0

    passed_cases = 0
    failures: list[str] = []
    for case in cases:
        passed, failed_checks = evaluate_case(case, args.api_url, args.timeout)
        if passed:
            passed_cases += 1
        else:
            failures.extend(f"{case['file']}: {check}" for check in failed_checks)

    print(f"\nAutomated checks: {passed_cases}/{len(cases)} cases passed.")
    print("Human review is still required for hallucinations and anonymization.")
    if failures:
        print("Failed checks:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

