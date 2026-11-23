# Backend

The ProsteFakty service: a Python + FastAPI REST API that accepts official letter text and returns a plain-language explanation, powered by the Google Gemini AI.

See [backend technology stack](../docs/tech-stack/backend.md) and [AI technology stack](../docs/tech-stack/ai.md) for technology decisions and rationale.

## Folder structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py        # FastAPI application, CORS, router registration
│   ├── routes.py      # GET /health  and  POST /explain
│   ├── schemas.py     # Pydantic request / response models
│   ├── ai_service.py  # Gemini API client (key loaded from env, never from code)
│   └── config.py      # Settings read from environment variables / .env
└── requirements.txt
```

## Routes

| Method | Path       | Description                                              |
|--------|------------|----------------------------------------------------------|
| GET    | `/health`  | Returns `{"status": "ok"}` — confirms the server is up. |
| POST   | `/explain` | Accepts `{"text": "…"}`, returns structured explanation. |

Full interactive documentation is available at **`/docs`** (Swagger UI) and **`/redoc`** (ReDoc) when the server is running.

### Example request

```bash
curl -X POST http://localhost:8000/explain \
     -H "Content-Type: application/json" \
     -d '{"text": "Szanowny Panie, wzywamy Pana do zapłaty kwoty 1200 zł do dnia 30.11.2024."}'
```

### Example response

```json
{
  "explanation": "Urząd wzywa Pana do zapłaty 1200 zł.",
  "source_passages": [
    "wzywamy Pana do zapłaty kwoty 1200 zł do dnia 30.11.2024"
  ],
  "action_checklist": [
    "Zapłacić 1200 zł do 30 listopada 2024"
  ],
  "deadlines": [
    "30.11.2024"
  ]
}
```

## Setup

### 1. Copy and fill in the environment file

```bash
cp .env.example .env
# Open .env and set GEMINI_API_KEY to your Google AI Studio key.
# Never commit .env — it is listed in .gitignore.
```

Get a free API key at <https://aistudio.google.com/app/apikey>.

### 2. Create a virtual environment and install dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start the development server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Running tests

Tests use mocks — no real Gemini API calls are made in CI or locally.

```bash
# From the project root:
pip install pytest httpx
pytest tests/
```

## Security notes

- `GEMINI_API_KEY` is read **only** from the server-side environment.  It is never placed in source code, returned in any response, or sent to the browser.
- The `.env` file is listed in `.gitignore` and must never be committed.
- Empty or invalid `text` returns a `422 Unprocessable Entity` with a clear error message.
- If the AI service fails or returns an unreadable answer, the server returns `502 Bad Gateway` with a clear message.
