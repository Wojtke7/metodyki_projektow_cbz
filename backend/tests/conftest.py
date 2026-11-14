"""Pytest configuration for the ProsteFakty test suite.

The Gemini client is mocked globally so that tests never make real API calls.
A fake GEMINI_API_KEY is injected into the environment before the application
modules are imported.
"""

import os
import sys

import pytest

# ---------------------------------------------------------------------------
# Ensure the backend package is on the Python path regardless of how pytest
# is invoked (from the project root or from backend/).
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# ---------------------------------------------------------------------------
# Inject a fake API key so that app.config.Settings can be instantiated
# without a real .env file present in CI.
# ---------------------------------------------------------------------------
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-real")
