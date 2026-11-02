# AI Model Technology Stack

## AI integration requirements

The AI service integrated with the ProsteFakty backend is expected to:

- Translate complex Polish official documents, contracts, and administrative decisions into clear, plain-language explanations.
- Extract structured information: plain-language summary, exact source quotes from the original text, an action checklist, and specific deadlines for reminders.
- Operate at zero cost ($0 / free tier) with generous daily rate limits suitable for development, testing, and MVP operation without requiring a credit card.
- Support a large context window to process multi-page official PDFs and OCR output in a single request.
- Guarantee structured JSON output (JSON Schema) so the FastAPI backend can reliably parse responses without regex workarounds.
- Process only pre-sanitized text after sensitive personal data (such as PESEL numbers) has been masked by the backend server.

## Options compared

The options below are compared on cost, rate limits, ease of use, and suitability for Polish administrative documents.

### Google Gemini API — Gemini Flash Free Tier (`gemini-3.8-flash` / `gemini-3.5-flash-lite`)

- **Cost:** Free ($0). Google AI Studio provides a standing free tier for the Gemini Flash family without requiring a billing account or credit card.
- **Rate limits & quota:** High free-tier allowance (up to 1,500 requests per day and 10–15 requests per minute, with a 1,000,000-token context window), which is more than sufficient for team development, automated testing, and MVP traffic.
- **Ease of use:** High. Official `google-genai` Python SDK integrates directly with FastAPI and Pydantic schemas to enforce strict JSON output. Excellent fluency in Polish legal and administrative terminology.

### OpenAI API / Anthropic Claude API (e.g., GPT-4o-mini / Claude Haiku)

- **Cost:** Paid only (Prepaid billing required). Neither OpenAI nor Anthropic offers a standing, no-card free tier for API usage; developers must attach a payment method and purchase prepaid credits upfront.
- **Rate limits & quota:** Restricted by credit balance and spending tiers.
- **Ease of use:** High API quality and strong Polish language support, but rejected due to mandatory upfront costs and billing management overhead for a student/MVP team.

### Self-hosted Open-Source LLM (Ollama + SpeakLeash Bielik / Llama 3)

- **Cost:** Free software license ($0 API cost), but high infrastructure cost. Running a 7B–11B parameter model with acceptable latency requires a dedicated GPU instance.
- **Rate limits & quota:** Limited by server hardware capacity. On a standard CPU-only EC2 instance (as planned in `ci-cd.md`), inference takes several minutes per document and risks exhausting system RAM alongside FastAPI, Celery, Redis, and PaddleOCR.
- **Ease of use:** Low to medium. Requires managing model weights, container GPU passthrough, and high memory consumption on the deployment server.

## Cost notes

While commercial APIs (OpenAI, Anthropic) charge per token from the first request and self-hosted models (Ollama) shift the cost to expensive GPU cloud hosting, **Google Gemini Flash (Free Tier)** is the only option that provides both zero API cost and zero infrastructure overhead. Because no billing account is linked in Google AI Studio on the free tier, the project cannot accidentally incur financial charges if traffic spikes.

## Proposed choice: Google Gemini Flash (Free Tier)

**Google Gemini Flash (`gemini-3.8-flash` / `gemini-3.5-flash-lite` via Google AI Studio Free Tier)** is the selected AI provider for the initial version of ProsteFakty.

- **Zero cost with no credit card:** Eliminates billing risk while providing generous daily request quotas (up to 1,500 RPD) and a 1M-token context window capable of handling long Polish administrative letters.
- **Native Structured Outputs:** Supports passing a Pydantic schema directly from FastAPI to guarantee the response always contains valid JSON fields (`explanation`, `source_passages`, `action_checklist`, and `deadlines`).
- **Low latency on CPU servers:** Because inference runs on Google's infrastructure, our EC2 server only handles lightweight HTTP requests, keeping hosting requirements minimal.
- **Fallback flexibility:** If rate limits (`429 RESOURCE_EXHAUSTED`) are reached during heavy testing, the backend can automatically fall back to `gemini-3.5-flash-lite` (which has a separate quota bucket) or queue retries via Celery with exponential backoff.

## Proposed AI integration architecture

| Concern | Proposed technology | Reason |
| :--- | :--- | :--- |
| **Primary LLM** | `Google Gemini Flash (Free Tier)` | Free of charge, high daily request quota, 1M context window, and strong Polish language comprehension. |
| **Python SDK** | `google-genai` (Official Python SDK) | Native support for async FastAPI calls and Pydantic `response_schema` validation. |
| **PII Masking (Pre-AI)** | `Python PII Sanitizer (Regex / Presidio)` | Masks PESEL, bank accounts, and personal identifiers on our server **before** text is sent to Gemini API. |
| **Rate-limit handling** | `Celery + Redis` (Exponential backoff) | Queues requests to stay within the free-tier RPM limit and retries automatically on HTTP 429 responses. |
| **Secret storage** | `Server Environment File (.env)` | Stores `GEMINI_API_KEY` exclusively on the backend server, never in the React PWA frontend or Git repository. |

## Data handling and safety requirements

Because the Google AI Studio Free Tier has different data-retention policies than paid enterprise tiers, the backend must enforce the following safeguards before calling the Gemini API:

1. **Mandatory server-side PII masking (US-03):** Never send raw document text containing sensitive personal identifiers to the external AI API. The backend must strip or mask Polish PESEL numbers, document IDs, phone numbers, and exact addresses (e.g., replacing them with `[PESEL_MASKED]`) inside the Python service before constructing the prompt.
2. **Keep API keys out of page code:** Store `GEMINI_API_KEY` strictly in the backend server's `.env` file. The React PWA frontend must only communicate with our FastAPI endpoints, never directly with Google's servers.
3. **No real AI calls in CI/CD:** As required in `ci-cd.md`, automated tests running in GitHub Actions must mock the Gemini client so that CI checks remain fast, deterministic, and independent of external API quotas.
4. **Prevent hallucinations with source grounding:** Instruct the model via system prompt to pair every plain-language explanation with the exact verbatim passage from the extracted text, and display a clear UI disclaimer that AI explanations are informational and not legal advice.
