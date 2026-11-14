"""ProsteFakty FastAPI application entry point.

Start the development server from the backend/ directory:

    uvicorn app.main:app --reload

Interactive API docs are available at:
    http://127.0.0.1:8000/docs   (Swagger UI)
    http://127.0.0.1:8000/redoc  (ReDoc)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

app = FastAPI(
    title="ProsteFakty API",
    description=(
        "Backend for the ProsteFakty application. "
        "Accepts official letter text and returns a plain-language explanation, "
        "action checklist, and deadlines — powered by the Google Gemini AI. "
        "The AI key is stored server-side only and is never sent to the browser."
    ),
    version="0.1.0",
    contact={
        "name": "ProsteFakty Team",
    },
    license_info={
        "name": "MIT",
    },
)

# ---------------------------------------------------------------------------
# CORS — allow the React PWA (dev server on :5173) to call the API.
# In production, replace "*" with the actual frontend domain.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(router)
