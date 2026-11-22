"""Tests for backend hardening (US-41) and extended schema & language (US-42).

Acceptance criteria covered:
- US-41: Zero letter content in logs (raw[:200] removed).
- US-41: Rate limiting per IP on /explain and /explain/file (HTTP 429).
- US-41: Maximum text length in ExplainRequest (HTTP 413).
- US-41: Timeout and retry for Gemini calls.
- US-41: Consistent error mapping: 413, 415, 422, 429, 502.
- US-42: Extended schema (document_type, payment_info, consequences).
- US-42: Language parameter (pl, en, uk) with invariant deadlines and amounts.
"""

import json
import logging
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.rate_limiter import rate_limiter
from app.schemas import ExplainRequest, ExplainResponse, MAX_TEXT_LENGTH

client = TestClient(app)

_FAKE_EXPLANATION = {
    "document_type": "upomnienie",
    "summary": "Urząd Skarbowy wzywa do zapłaty zaległego podatku.",
    "explanation": "Masz zaległość w podatku PIT. Musisz ją zapłacić w terminie.",
    "payment_info": "Wpłać 1308,00 zł na mikrorachunek podatkowy.",
    "consequences": "Jeśli nie zapłacisz, sprawę może przejąć komornik.",
    "source_passages": ["wzywamy do uregulowania zaległości w terminie 7 dni"],
    "action_checklist": ["Wpłać 1308,00 zł na mikrorachunek", "Zrób to w ciągu 7 dni"],
    "deadlines": ["7 dni od dnia odebrania"],
    "amount": "1 308,00 zł",
    "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną.",
}


def _fake_gemini_response(payload: dict) -> MagicMock:
    mock_resp = MagicMock()
    mock_resp.text = json.dumps(payload)
    return mock_resp


class TestHardeningRateLimiting(unittest.TestCase):
    """US-41: Rate limiting per IP on /explain and /explain/file."""

    def setUp(self):
        rate_limiter.reset()

    def tearDown(self):
        rate_limiter.reset()

    @patch("app.ai_service.genai.Client")
    def test_explain_rate_limit_exceeded_returns_429(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_FAKE_EXPLANATION)
        )
        limit = settings.rate_limit_per_minute

        # First `limit` requests should succeed
        for i in range(limit):
            resp = client.post("/explain", json={"text": f"Pismo numer {i}"})
            self.assertEqual(resp.status_code, 200, f"Request {i+1} should succeed")

        # The limit + 1 request must return 429
        resp = client.post("/explain", json={"text": "Kolejne pismo"})
        self.assertEqual(resp.status_code, 429)
        self.assertIn("detail", resp.json())
        self.assertIn("Rate limit exceeded", resp.json()["detail"])
        self.assertIn("Retry-After", resp.headers)

    @patch("app.ai_service.genai.Client")
    def test_different_ips_have_separate_limits(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_FAKE_EXPLANATION)
        )
        limit = settings.rate_limit_per_minute

        # Exhaust limit for IP 1
        headers_ip1 = {"X-Forwarded-For": "192.168.1.100"}
        for _ in range(limit):
            client.post("/explain", json={"text": "Tekst"}, headers=headers_ip1)

        # IP 1 should be blocked
        blocked_resp = client.post("/explain", json={"text": "Tekst"}, headers=headers_ip1)
        self.assertEqual(blocked_resp.status_code, 429)

        # IP 2 should still be allowed
        headers_ip2 = {"X-Forwarded-For": "192.168.1.200"}
        allowed_resp = client.post("/explain", json={"text": "Tekst"}, headers=headers_ip2)
        self.assertEqual(allowed_resp.status_code, 200)


class TestHardeningTextLimits(unittest.TestCase):
    """US-41: Maximum text length in ExplainRequest (HTTP 413)."""

    def setUp(self):
        rate_limiter.reset()

    def test_text_exceeding_max_length_returns_413(self):
        huge_text = "A" * (MAX_TEXT_LENGTH + 100)
        resp = client.post("/explain", json={"text": huge_text})
        self.assertEqual(resp.status_code, 413)
        self.assertIn("detail", resp.json())
        self.assertIn(str(MAX_TEXT_LENGTH), resp.json()["detail"])

    @patch("app.ai_service.genai.Client")
    def test_text_within_max_length_is_accepted(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_FAKE_EXPLANATION)
        )
        allowed_text = "A" * 1000
        resp = client.post("/explain", json={"text": allowed_text})
        self.assertEqual(resp.status_code, 200)


class TestHardeningConsistentErrorMapping(unittest.TestCase):
    """US-41: Consistent error mapping: 413, 415, 422, 429, 502."""

    def setUp(self):
        rate_limiter.reset()

    def test_413_payload_too_large(self):
        resp = client.post("/explain", json={"text": "x" * 60_000})
        self.assertEqual(resp.status_code, 413)
        self.assertIn("detail", resp.json())

    def test_422_empty_text(self):
        resp = client.post("/explain", json={"text": ""})
        self.assertEqual(resp.status_code, 422)

    def test_422_whitespace_only(self):
        resp = client.post("/explain", json={"text": "    "})
        self.assertEqual(resp.status_code, 422)

    def test_422_invalid_language(self):
        resp = client.post("/explain", json={"text": "Pismo", "language": "es"})
        self.assertEqual(resp.status_code, 422)
        self.assertIn("Unsupported response language", str(resp.json()))

    @patch("app.ai_service.genai.Client")
    def test_502_ai_service_exception(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.side_effect = Exception("Service unavailable")
        resp = client.post("/explain", json={"text": "Jakieś pismo"})
        self.assertEqual(resp.status_code, 502)
        self.assertIn("detail", resp.json())

    @patch("app.ai_service.genai.Client")
    def test_502_ai_unparseable_response(self, mock_client_cls):
        mock_resp = MagicMock()
        mock_resp.text = "NOT JSON AT ALL"
        mock_client_cls.return_value.models.generate_content.return_value = mock_resp

        resp = client.post("/explain", json={"text": "Jakieś pismo"})
        self.assertEqual(resp.status_code, 502)
        self.assertIn("unreadable response", resp.json()["detail"])


class TestHardeningPrivacyZeroLetterInLogs(unittest.TestCase):
    """US-41: No letter content in logs; raw[:200] removed from logger.error."""

    def setUp(self):
        rate_limiter.reset()

    @patch("app.ai_service.genai.Client")
    def test_logger_never_contains_raw_or_letter_content_on_error(self, mock_client_cls):
        secret_letter = "TAJNE_DANE_PISMA_123456789_NIE_LOGOWAC"
        raw_response_content = "INVALID_RESPONSE_CONTAINING_SECRET_DATA"

        mock_resp = MagicMock()
        mock_resp.text = raw_response_content
        mock_client_cls.return_value.models.generate_content.return_value = mock_resp

        with self.assertLogs("app.ai_service", level="ERROR") as cm:
            resp = client.post("/explain", json={"text": secret_letter})
            self.assertEqual(resp.status_code, 502)

            for log_msg in cm.output:
                self.assertNotIn(
                    secret_letter,
                    log_msg,
                    "Letter text must NEVER appear in logs!",
                )
                self.assertNotIn(
                    raw_response_content,
                    log_msg,
                    "Raw response or raw[:200] must NEVER appear in logs!",
                )


class TestExtendedSchemaAndLanguages(unittest.TestCase):
    """US-42: Extended schema (document_type, payment_info, consequences) and languages."""

    def setUp(self):
        rate_limiter.reset()

    @patch("app.ai_service.genai.Client")
    def test_extended_schema_fields_present_in_response(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_FAKE_EXPLANATION)
        )
        resp = client.post("/explain", json={"text": "Treść upomnienia", "language": "pl"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertIn("document_type", data)
        self.assertEqual(data["document_type"], "upomnienie")
        self.assertIn("payment_info", data)
        self.assertIn("mikrorachunek", data["payment_info"])
        self.assertIn("consequences", data)
        self.assertIn("komornik", data["consequences"])
        self.assertIn("summary", data)
        self.assertIn("explanation", data)
        self.assertIn("action_checklist", data)
        self.assertIn("deadlines", data)
        self.assertIn("amount", data)
        self.assertIn("source_passages", data)
        self.assertIn("disclaimer", data)

    @patch("app.ai_service.genai.Client")
    def test_missing_payment_and_consequences_fallback(self, mock_client_cls):
        payload = dict(_FAKE_EXPLANATION)
        payload["payment_info"] = "Brak informacji w piśmie"
        payload["consequences"] = "Brak informacji w piśmie"
        payload["document_type"] = "information"

        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(payload)
        )
        resp = client.post("/explain", json={"text": "Pismo informacyjne"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["payment_info"], "Brak informacji w piśmie")
        self.assertEqual(data["consequences"], "Brak informacji w piśmie")

    @patch("app.ai_service.genai.Client")
    def test_language_en_passed_with_invariance_rules(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_FAKE_EXPLANATION)
        )
        resp = client.post("/explain", json={"text": "Pismo", "language": "en"})
        self.assertEqual(resp.status_code, 200)

        call_args = mock_client_cls.return_value.models.generate_content.call_args
        system_instruction = call_args.kwargs["config"].system_instruction
        self.assertIn("Respond in English", system_instruction)
        self.assertIn("do not alter amounts or dates", system_instruction)

    @patch("app.ai_service.genai.Client")
    def test_language_uk_passed_with_invariance_rules(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_FAKE_EXPLANATION)
        )
        resp = client.post("/explain", json={"text": "Pismo", "language": "uk"})
        self.assertEqual(resp.status_code, 200)

        call_args = mock_client_cls.return_value.models.generate_content.call_args
        system_instruction = call_args.kwargs["config"].system_instruction
        self.assertIn("Відповідай українською мовою", system_instruction)
        self.assertIn("не змінюй суми та дати", system_instruction)

    def test_list_normalization_for_string_outputs(self):
        """Pydantic schema normalizes string outputs to single-element lists."""
        explanation = ExplainResponse(
            document_type="reminder",
            summary="Test",
            explanation="Test explanation",
            action_checklist="Pojedynczy krok",  # String instead of list
            deadlines="30.11.2024",              # String instead of list
            source_passages="Cytat z pisma",      # String instead of list
        )
        self.assertEqual(explanation.action_checklist, ["Pojedynczy krok"])
        self.assertEqual(explanation.deadlines, ["30.11.2024"])
        self.assertEqual(explanation.source_passages, ["Cytat z pisma"])


if __name__ == "__main__":
    unittest.main()

