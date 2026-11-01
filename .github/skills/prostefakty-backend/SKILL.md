---
name: prostefakty-backend
description: "Implement, debug, or review the ProsteFakty Python backend. Use for FastAPI APIs, PostgreSQL and SQLAlchemy, document uploads, PDF extraction, OCR with PaddleOCR, image processing with OpenCV and Pillow, background jobs with Celery and Redis, reminders, and backend privacy or security."
---

# ProsteFakty Backend

## Purpose

Help agents make reliable backend changes for ProsteFakty, an application that explains official documents in plain language. The planned backend uses Python and FastAPI to process pasted text, document images, and PDFs; generate explanations and action/deadline information; and support reminders.

The repository may not yet contain a backend implementation. Treat the documented stack as a project direction, not proof that a component is already present or configured. Inspect the current code and follow its established patterns before making changes.

## Planned stack

- **API:** Python + FastAPI, with request validation and OpenAPI documentation.
- **Database:** PostgreSQL + SQLAlchemy for reminders and necessary application data.
- **PDF text:** PyMuPDF for PDFs with an extractable text layer.
- **OCR:** PaddleOCR for scans and document photographs.
- **Image processing:** OpenCV and Pillow for preprocessing images before OCR.
- **Background jobs:** Celery + Redis for long-running document analysis.
- **Reminders:** APScheduler with reminder data persisted in PostgreSQL.
- **Authentication:** JWT only if the product adds accounts or protected user data.

Use the existing project choice unless the task explicitly asks to reconsider it. Do not introduce every planned component at once; implement only what the task needs.

## Workflow

1. Read the relevant code, tests, and project documentation. Check whether the backend or dependency configuration exists before assuming a framework or library is installed.
2. Trace the affected request or job from input validation through processing, persistence, and response. Keep API routes, document extraction, AI integration, and reminder logic modular where the codebase supports it.
3. Implement the smallest complete change using existing project conventions and typed interfaces. Validate request and configuration data explicitly; surface failures through the project's standard error handling.
4. Add or update focused tests for successful processing, invalid inputs, and failure/cleanup behavior where applicable.
5. Run the narrowest relevant tests, linter, and type checks available. Report anything that could not be verified.

## Document processing and privacy

- Treat uploaded originals and images as temporary inputs, not as records to archive. Remove temporary files after success, failure, and cancellation.
- Enforce allowed file types, file-size limits, and processing limits before expensive work. Do not trust a filename or client-provided content type as the only validation.
- Use PyMuPDF to extract text when a PDF already has a text layer; use OCR for image-based content. Apply image preprocessing only when it improves the actual OCR flow.
- Do not write document text, OCR output, full AI prompts, or sensitive upload metadata to logs, exceptions returned to clients, or persistent storage.
- Persist only data needed for an explicitly supported feature, such as a user-created reminder. Do not add document history or accounts unless requested.
- Review privacy, retention, and GDPR/RODO implications before sending document content to an external AI provider.
- Treat AI results as fallible. Preserve source passages alongside generated explanations where supported, and do not present output as legal advice.

## Background jobs and reminders

- Use Celery and Redis for document-analysis work that should not block an HTTP request; return a clear job identifier/status if that matches the existing API design.
- Keep analysis workers and reminder scheduling responsibilities distinct.
- Persist reminder state in PostgreSQL so it survives restarts. Consider duplicate scheduler processes, retries, idempotency, and recovery when changing scheduling behavior.
- Do not add Redis, Celery, or APScheduler as dependencies unless the requested feature requires them and the project is ready to configure and run them.

## Security and reliability

- Keep secrets out of source control and use the repository's established configuration mechanism.
- Require HTTPS in deployed environments; use JWT only when authentication is part of the implemented product.
- Apply access controls to user-specific data and avoid leaking whether another user's reminder or resource exists.
- Avoid broad exception catches, silent fallbacks, and success-shaped error responses. Return safe, useful errors without exposing sensitive content.
- Keep processing bounded and account for malformed files, timeouts, worker failures, and cleanup paths.
