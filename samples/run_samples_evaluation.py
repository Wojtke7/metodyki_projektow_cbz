#!/usr/bin/env python3
"""Evaluation script for testing the 3 sample letters with ProsteFakty prompt rules."""

import json
import os
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = ROOT_DIR / "prompts"
SAMPLES_DIR = ROOT_DIR / "samples"

FORBIDDEN_JARGON = [
    "niniejszym",
    "zważywszy",
    "albowiem",
    "organ administracji publicznej",
    "termin zawity",
    "rygor natychmiastowej wykonalności",
    "wszczęcie postępowania egzekucyjnego",
    "przedmiotowy",
    "rzeczony",
    "uiścić",
    "zobowiązany",
    "w oparciu o art.",
]


def load_file(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def main():
    print("=" * 70)
    print("PROSTEFAKTY — EVALUATION OF 3 SAMPLE LETTERS (US-14 / US-12)")
    print("=" * 70)

    system_prompt = load_file(PROMPTS_DIR / "system_prompt.txt")
    print(f"Loaded System Prompt ({len(system_prompt)} chars) from {PROMPTS_DIR / 'system_prompt.txt'}")

    sample_files = [
        ("01_urzad_skarbowy_upomnienie.txt", "Urząd Skarbowy"),
        ("02_zus_zawiadomienie_o_niedoplacie.txt", "ZUS"),
        ("03_bank_zmiana_regulaminu.txt", "Bank"),
    ]

    for filename, org in sample_files:
        path = SAMPLES_DIR / filename
        content = load_file(path)
        print(f"\n--- Testing Letter: {filename} ({org}) ---")
        print(f"File size: {len(content)} characters.")

        has_amount = any(c.isdigit() for c in content) and ("zł" in content or "PLN" in content)
        has_deadline = any(term in content.lower() for term in ["termin", "dni", "dnia"])

        print(f"Contains Amount: {has_amount}")
        print(f"Contains Deadline: {has_deadline}")

    print("\nEvaluation completed successfully. Run `python3 -m unittest tests/test_prompts.py` for automated checks.")


if __name__ == "__main__":
    main()

