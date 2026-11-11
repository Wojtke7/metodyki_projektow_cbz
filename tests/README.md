# Tests

Automated tests for the project (backend, frontend, prompts, and end-to-end). Tests must not call a real AI provider or use real documents; use fixtures and mocks as required by [CI/CD technology stack](../docs/tech-stack/ci-cd.md).

## Available Test Suites

### Prompts & Sample Letters Tests (US-14 / US-12)

Located in [`tests/test_prompts.py`](test_prompts.py):
- Validates that `prompts/system_prompt.txt` and `prompts/explanation_schema.json` exist in the repository.
- Asserts that the system prompt strictly enforces short sentences (10–15 words per sentence).
- Asserts that the prompt forbids legal and bureaucratic jargon with concrete replacement rules.
- Asserts that the prompt enforces the anti-hallucination rule ("Brak informacji w piśmie").
- Validates the 3 sample letters in `samples/` (Tax office, ZUS, Bank; no real PII; 2 letters with amount and deadline, 1 without deadline).
- Evaluates output text quality against sentence length limits and jargon blacklists.

### Running the Tests

To run the automated test suite locally:

```bash
python3 -m unittest discover tests
```

or specifically:

```bash
python3 -m unittest tests/test_prompts.py
```

