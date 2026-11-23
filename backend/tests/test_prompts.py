"""Forwarder/mirror to run prompt tests inside backend/tests."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

_PROMPT_TESTS_PATH = Path(__file__).resolve().parents[2] / "tests" / "test_prompts.py"
_REPOSITORY_ROOT = str(_PROMPT_TESTS_PATH.parents[1])
if _REPOSITORY_ROOT not in sys.path:
    sys.path.insert(0, _REPOSITORY_ROOT)

_PROMPT_TESTS_SPEC = spec_from_file_location("_repository_prompt_tests", _PROMPT_TESTS_PATH)
if _PROMPT_TESTS_SPEC is None or _PROMPT_TESTS_SPEC.loader is None:
    raise ImportError(f"Unable to load prompt tests from {_PROMPT_TESTS_PATH}")

_PROMPT_TESTS = module_from_spec(_PROMPT_TESTS_SPEC)
_PROMPT_TESTS_SPEC.loader.exec_module(_PROMPT_TESTS)

TestPrompts = _PROMPT_TESTS.TestPrompts
TestSampleLetters = _PROMPT_TESTS.TestSampleLetters
TestExplanationQualityEvaluator = _PROMPT_TESTS.TestExplanationQualityEvaluator

__all__ = ["TestPrompts", "TestSampleLetters", "TestExplanationQualityEvaluator"]

