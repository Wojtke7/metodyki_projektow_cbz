## What and why

This pull request implements the requirements for Sprint 2 User Stories **US-14** (Simple explanation) and **US-12** (Sample letters and testing):

1. **AI System Prompt & Schema (US-14):**
   - Added production system prompt (`prompts/system_prompt.txt`) enforcing plain Polish, short sentences (10–15 words max), complete elimination of legal/official jargon, and the strict anti-hallucination rule ("Brak informacji w piśmie").
   - Added structured output schema (`prompts/explanation_schema.json`) and Python helper (`prompts/prompt_loader.py`).
   - Connected `backend/app/ai_service.py` and `schemas.py` to use the repository prompt.

2. **Sample Letters & Quality Testing (US-12):**
   - Created 3 anonymized, realistic sample letters in `samples/`:
     * `01_urzad_skarbowy_upomnienie.txt` (Tax office: 1 308,00 zł, 7-day deadline)
     * `02_zus_zawiadomienie_o_niedoplacie.txt` (ZUS: 430,50 zł, deadline 30 Nov 2026)
     * `03_bank_zmiana_regulaminu.txt` (Bank: informational, NO deadline)
   - Tested all 3 letters and documented results, sentence metrics, and 4 identified & resolved mistakes in `samples/TESTING_REPORT.md`.
   - Created Product Owner demo presentation script in `samples/DEMO_SCRIPT_PO.md`.
   - Created direct testing tool `test_gemini_direct.py`.

3. **Automated Unit Tests:**
   - Added 12 unit tests in `tests/test_prompts.py` verifying prompt presence, short sentence enforcement, jargon detection, anti-hallucination rules, and sample letter constraints. All tests pass with 0 failures.

## Trello card

- `[S2] US-14 Simple explanation`
- `[S2] US-12 Sample letters and testing`

## Checklist

- [x] The change is small and focused on one task.
- [x] No secrets, real documents, or personal data are included.
- [x] Tests or checks pass, or this change needs none (for example documentation only).
- [ ] At least one team member has reviewed and approved this pull request.

