"""Tests for GET /health and POST /explain routes.

No real AI calls are made — the Gemini client is mocked via unittest.mock.patch.
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helper: build a fake Gemini response object
# ---------------------------------------------------------------------------


def _fake_gemini_response(payload: dict) -> MagicMock:
    """Return a MagicMock that looks like a Gemini GenerateContentResponse."""
    mock_response = MagicMock()
    mock_response.text = json.dumps(payload)
    return mock_response


_VALID_AI_PAYLOAD = {
    "explanation": "Urząd wzywa Pana do zapłaty 1200 zł.",
    "source_passages": ["wzywamy Pana do zapłaty kwoty 1200 zł do dnia 30.11.2024"],
    "action_checklist": ["Zapłacić 1200 zł do 30 listopada 2024"],
    "deadlines": ["30.11.2024"],
}


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_returns_ok_status(self):
        response = client.get("/health")
        assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /explain — happy path
# ---------------------------------------------------------------------------


class TestExplainHappyPath:
    @patch("app.ai_service.genai.Client")
    def test_returns_200_with_valid_text(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_VALID_AI_PAYLOAD)
        )

        response = client.post("/explain", json={"text": "Szanowny Panie, wzywamy Pana do zapłaty."})

        assert response.status_code == 200

    @patch("app.ai_service.genai.Client")
    def test_response_contains_explanation(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_VALID_AI_PAYLOAD)
        )

        data = client.post("/explain", json={"text": "Jakiś tekst pisma."}).json()

        assert "explanation" in data
        assert data["explanation"] == _VALID_AI_PAYLOAD["explanation"]

    @patch("app.ai_service.genai.Client")
    def test_response_contains_all_fields(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_VALID_AI_PAYLOAD)
        )

        data = client.post("/explain", json={"text": "Jakiś tekst pisma."}).json()

        assert set(data.keys()) >= {"explanation", "source_passages", "action_checklist", "deadlines"}

    @patch("app.ai_service.genai.Client")
    def test_source_passages_is_list(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_VALID_AI_PAYLOAD)
        )

        data = client.post("/explain", json={"text": "Jakiś tekst pisma."}).json()

        assert isinstance(data["source_passages"], list)

    @patch("app.ai_service.genai.Client")
    def test_action_checklist_is_list(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = (
            _fake_gemini_response(_VALID_AI_PAYLOAD)
        )

        data = client.post("/explain", json={"text": "Jakiś tekst pisma."}).json()

        assert isinstance(data["action_checklist"], list)


# ---------------------------------------------------------------------------
# POST /explain — empty / missing text
# ---------------------------------------------------------------------------


class TestExplainEmptyInput:
    def test_empty_string_returns_422(self):
        response = client.post("/explain", json={"text": ""})
        assert response.status_code == 422

    def test_whitespace_only_returns_422(self):
        # Pydantic min_length=1 rejects empty strings; whitespace-only strings
        # pass that check but are caught by the ai_service layer, which
        # raises ValueError → 422.
        with patch("app.ai_service.genai.Client") as mock_client_cls:
            mock_client_cls.return_value.models.generate_content.side_effect = ValueError(
                "Letter text must not be empty."
            )
            response = client.post("/explain", json={"text": "   "})
        assert response.status_code == 422

    def test_missing_text_field_returns_422(self):
        response = client.post("/explain", json={})
        assert response.status_code == 422

    def test_empty_error_has_detail(self):
        response = client.post("/explain", json={"text": ""})
        body = response.json()
        assert "detail" in body


# ---------------------------------------------------------------------------
# POST /explain — AI service failure
# ---------------------------------------------------------------------------


class TestExplainAIFailure:
    @patch("app.ai_service.genai.Client")
    def test_ai_exception_returns_502(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.side_effect = Exception(
            "Connection timeout"
        )

        response = client.post("/explain", json={"text": "Jakiś tekst pisma."})

        assert response.status_code == 502

    @patch("app.ai_service.genai.Client")
    def test_ai_502_has_detail(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.side_effect = Exception(
            "Connection timeout"
        )

        body = client.post("/explain", json={"text": "Jakiś tekst pisma."}).json()

        assert "detail" in body

    @patch("app.ai_service.genai.Client")
    def test_ai_empty_response_returns_502(self, mock_client_cls):
        mock_response = MagicMock()
        mock_response.text = ""
        mock_client_cls.return_value.models.generate_content.return_value = mock_response

        response = client.post("/explain", json={"text": "Jakiś tekst pisma."})

        assert response.status_code == 502

    @patch("app.ai_service.genai.Client")
    def test_ai_invalid_json_returns_502(self, mock_client_cls):
        mock_response = MagicMock()
        mock_response.text = "not valid json {"
        mock_client_cls.return_value.models.generate_content.return_value = mock_response

        response = client.post("/explain", json={"text": "Jakiś tekst pisma."})

        assert response.status_code == 502
