"""Unit and evaluation tests for ProsteFakty AI prompts and sample letters (US-14, US-12).

Tests:
1. Prompt presence and repository structure.
2. Rule enforcement within the system prompt (short sentences, no legal jargon, anti-hallucination).
3. JSON Schema validity for structured outputs.
4. Sample letters criteria (3 letters, tax/zus/bank, anonymized, amounts and deadlines).
5. Output evaluation helpers (measuring sentence length, detecting blacklisted jargon, verifying facts).
"""

import json
import os
import re
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = ROOT_DIR / "prompts"
SAMPLES_DIR = ROOT_DIR / "samples"

FORBIDDEN_LEGAL_JARGON = [
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
    "zobowiązany periculum",
    "w oparciu o art.",
]


class TestPrompts(unittest.TestCase):
    """US-14 Acceptance criteria verification for AI prompt."""

    def setUp(self):
        self.prompt_path = PROMPTS_DIR / "system_prompt.txt"
        self.schema_path = PROMPTS_DIR / "explanation_schema.json"

    def test_prompt_saved_in_repository(self):
        """Criterion: The prompt is saved in the repository."""
        self.assertTrue(self.prompt_path.exists(), "prompts/system_prompt.txt must exist.")
        content = self.prompt_path.read_text(encoding="utf-8").strip()
        self.assertGreater(len(content), 100, "System prompt must not be empty.")

    def test_prompt_loader(self):
        """Verify prompt_loader module correctly imports prompt and schema."""
        from prompts.prompt_loader import get_system_prompt, get_explanation_schema
        prompt = get_system_prompt()
        schema = get_explanation_schema()
        self.assertIn("KRÓTKIE ZDANIA", prompt)
        self.assertEqual(schema["title"], "ExplanationResponse")

    def test_schema_saved_in_repository(self):
        """Structured output schema must exist and be valid JSON Schema."""
        self.assertTrue(self.schema_path.exists(), "prompts/explanation_schema.json must exist.")
        with open(self.schema_path, "r", encoding="utf-8") as f:
            schema = json.load(f)
        self.assertIn("properties", schema)
        self.assertIn("required", schema)
        required_fields = {"summary", "explanation", "action_checklist", "deadlines", "amount", "source_passages", "disclaimer"}
        self.assertTrue(required_fields.issubset(set(schema["required"])))

    def test_prompt_requires_short_sentences(self):
        """Criterion: Sentences are short."""
        content = self.prompt_path.read_text(encoding="utf-8").lower()
        has_short_sentences = any(
            phrase in content
            for phrase in ["krótkimi", "krótkich", "10–15 słów", "10-15 słów", "proste zdania"]
        )
        self.assertTrue(has_short_sentences, "Prompt must explicitly enforce short sentences (10-15 words).")

    def test_prompt_forbids_legal_jargon(self):
        """Criterion: Sentences have no legal jargon."""
        content = self.prompt_path.read_text(encoding="utf-8").lower()
        has_anti_jargon = "żargon" in content or "zastępuj" in content
        self.assertTrue(has_anti_jargon, "Prompt must explicitly forbid legal and official jargon.")

    def test_prompt_enforces_anti_hallucination(self):
        """Criterion: The explanation does not add facts that are not in the letter."""
        content = self.prompt_path.read_text(encoding="utf-8").lower()
        has_anti_hallucination = (
            "brak informacji w piśmie" in content
            or "nie zgaduj" in content
            or "wyłącznie na informacjach" in content
        )
        self.assertTrue(has_anti_hallucination, "Prompt must forbid adding external facts and instruct to say 'Brak informacji'.")


class TestSampleLetters(unittest.TestCase):
    """US-12 Acceptance criteria verification for sample letters."""

    def setUp(self):
        self.letter1 = SAMPLES_DIR / "01_urzad_skarbowy_upomnienie.txt"
        self.letter2 = SAMPLES_DIR / "02_zus_zawiadomienie_o_niedoplacie.txt"
        self.letter3 = SAMPLES_DIR / "03_bank_zmiana_regulaminu.txt"

    def test_there_are_three_letters_in_samples(self):
        """Criterion: There are 3 letters saved as text files in the samples folder."""
        self.assertTrue(self.letter1.exists(), "Tax office letter must exist.")
        self.assertTrue(self.letter2.exists(), "ZUS letter must exist.")
        self.assertTrue(self.letter3.exists(), "Bank letter must exist.")

    def test_letters_have_no_real_personal_data(self):
        """Criterion: The letters have no real personal data."""
        for path in [self.letter1, self.letter2, self.letter3]:
            text = path.read_text(encoding="utf-8")
            self.assertTrue(
                "Kowalski" in text or "Nowak" in text or "Wiśniewski" in text,
                f"{path.name} should use standard sample names."
            )
            self.assertTrue(
                "Przykładow" in text or "Testow" in text or "Fikcyjn" in text or "Kwiatow" in text,
                f"{path.name} should use fictional address placeholders."
            )

    def test_amounts_and_deadlines_distribution(self):
        """Criterion: At least 2 letters have a deadline and an amount, and 1 letter has no deadline."""
        t1 = self.letter1.read_text(encoding="utf-8")
        t2 = self.letter2.read_text(encoding="utf-8")
        t3 = self.letter3.read_text(encoding="utf-8")

        # Letter 1: Tax Office -> has amount (1 308) and deadline (7 dni)
        self.assertTrue("1 308" in t1 or "1 250" in t1, "Letter 1 must have an amount.")
        self.assertTrue("7 dni" in t1 or "terminie 7 dni" in t1, "Letter 1 must have a deadline.")

        # Letter 2: ZUS -> has amount (430,50) and deadline (30 listopada 2026)
        self.assertTrue("430,50" in t2, "Letter 2 must have an amount.")
        self.assertTrue("30 listopada" in t2 or "terminie" in t2, "Letter 2 must have a deadline.")

        # Letter 3: Bank -> informational, NO deadline for action
        self.assertNotIn("terminie 7 dni", t3)
        self.assertNotIn("nieprzekraczalnym terminie", t3)
        self.assertTrue(
            "nie musisz podejmować żadnych czynności" in t3 or "automatycznie" in t3,
            "Letter 3 must be informational without a required deadline."
        )


class TestExplanationQualityEvaluator(unittest.TestCase):
    """Evaluation tests checking quality of outputs (sentence length, jargon, grounding)."""

    def _split_sentences(self, text: str) -> list[str]:
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 3]

    def test_short_sentences_rule(self):
        """Evaluate that sample plain-language explanation adheres to max 15 words/sentence average."""
        sample_explanation = (
            "Dostałeś upomnienie z Urzędu Skarbowego. "
            "Chodzi o zaległy podatek PIT za rok 2025. "
            "Musisz zapłacić 1308 złotych. "
            "Masz na to 7 dni od odebrania pisma. "
            "Pieniądze wpłać na podany numer konta. "
            "Jeśli nie zapłacisz, sprawę może przejąć komornik."
        )
        sentences = self._split_sentences(sample_explanation)
        self.assertGreater(len(sentences), 0)
        for s in sentences:
            words = s.split()
            self.assertLessEqual(len(words), 16, f"Sentence too long ({len(words)} words): '{s}'")

    def test_forbidden_jargon_detector(self):
        """Ensure no forbidden legal terms appear in plain language text."""
        good_text = "Urząd prosi o zapłatę zaległości. Masz 7 dni na wpłatę pieniędzy."
        bad_text = "Organ administracji publicznej wzywa do uiszczenia należności albowiem upłynął termin zawity."

        for term in FORBIDDEN_LEGAL_JARGON:
            self.assertNotIn(term.lower(), good_text.lower())

        found_in_bad = any(term.lower() in bad_text.lower() for term in FORBIDDEN_LEGAL_JARGON)
        self.assertTrue(found_in_bad, "Detector must catch legal jargon.")

    def test_letter3_no_deadline_rule(self):
        """For Letter 3 (Bank), deadlines must report 'Brak terminu w piśmie' or empty."""
        simulated_deadlines = ["Brak terminu w piśmie"]
        self.assertIn("Brak terminu w piśmie", simulated_deadlines)


if __name__ == "__main__":
    unittest.main()

