# ProsteFakty

ProsteFakty is an application designed to make difficult official documents easier to understand. It turns letters, contracts, and administrative decisions into clear explanations of what they mean, what the reader may need to do, and which deadlines they should note.

Users can paste text or provide a photograph or supported file. The application is intended to extract the document's text, explain it in plain language, show relevant original passages alongside the explanation, and help the user create an action checklist and deadline reminder.

## Why ProsteFakty?

Official documents can be difficult to understand and may require action by a specific date. ProsteFakty aims to make that information more accessible, especially for older people and people with disabilities.

The planned experience includes:

- Large, adjustable text and high-contrast presentation.
- Keyboard and screen-reader accessibility.
- Text-to-speech support for listening to explanations.
- A plain-language summary, suggested next steps, and identified deadlines.
- Original document passages shown alongside the related explanation, so users can check the source.
- A clear notice that AI-generated explanations are informational and are not legal advice.
- Temporary document processing without permanent storage of document images or originals.

AI-generated explanations can be incomplete or incorrect. Users should check the original document and contact the issuing authority or a qualified professional when they need certainty.

## Planned user flow

1. The user pastes text or uploads a supported document or photograph.
2. The backend extracts text from the input, using OCR when necessary.
3. The application prepares a plain-language explanation, relevant source passages, possible actions, and dates for the user to review.
4. The user reviews the explanation and can create a reminder for a deadline.
5. Temporary document files are removed after processing; only information needed for features such as reminders may be retained.

This is an initial project description. The exact AI provider, supported file formats, account model, and reminder-delivery channels remain to be confirmed.

## Technology direction

The project notes currently describe the following planned stack:

- **Frontend:** Progressive Web App (PWA) using React and Vite.
- **Backend:** Python and FastAPI, with a modular REST API.
- **Data:** PostgreSQL and SQLAlchemy for persistent application data such as settings and reminders.
- **Document processing:** PyMuPDF for text-based PDFs; PaddleOCR for scanned documents and images; OpenCV and Pillow for image preprocessing.
- **Long-running processing:** Celery and Redis for background document-analysis jobs.
- **Reminders:** APScheduler with PostgreSQL-backed reminder data.
- **Accessibility:** Browser-native speech synthesis, responsive text sizing, keyboard support, and screen-reader-friendly UI components.

These are planned technologies, not a claim that every feature has already been implemented. See [Frontend technology stack](docs/tech-stack/frontend.md) and [Backend technology stack](docs/tech-stack/backend.md) for the comparison and rationale.

## Repository structure

```text
.
├── .github/    GitHub configuration: workflows and agent skills
├── docs/       project documentation
├── frontend/   React + Vite PWA
├── backend/    FastAPI service
├── prompts/    AI prompts and output schemas
├── tests/      automated tests
├── .env.example      template for local configuration (copy to .env, never commit .env)
├── .gitignore        files Git must not track
├── .dockerignore     files excluded from Docker builds
├── .gitattributes    line-ending normalisation
├── .editorconfig     shared editor settings
└── README.md
```

| Folder | Purpose |
| :--- | :--- |
| [`.github/`](.github/) | GitHub Actions workflows (CI/CD) and agent skills. |
| [`docs/`](docs/) | Project documentation: architecture, product catalog, and technology stack decisions. |
| [`frontend/`](frontend/) | The React + Vite PWA client. |
| [`backend/`](backend/) | The FastAPI service: API, document processing (PDF text, OCR), AI integration, background jobs, and reminders. |
| [`prompts/`](prompts/) | Prompts and output schemas for the AI integration. |
| [`tests/`](tests/) | Automated tests (backend, frontend, end-to-end), using mocks instead of real AI calls. |

Each folder holds a short README so that it is visible on GitHub. Inside `frontend/` and `backend/`, the team chooses the internal layout when implementation starts.

## Privacy and safety principles

- Process document originals and images temporarily; do not retain them as a permanent document archive.
- Avoid putting document content in application logs.
- Validate uploaded file types and sizes, and clean up temporary files.
- Protect connections with HTTPS and manage secrets outside source control.
- If accounts are introduced, use an appropriate authentication mechanism and retain only data needed to provide the requested features.
- Assess any external AI provider for privacy, retention, and GDPR/RODO requirements before sending document content to it.
- Present AI output as assistance, not as a substitute for legal advice or professional judgment.

## Accessibility goals

The interface should support adjustable text, strong contrast, clear focus indicators, keyboard navigation, screen readers, and reading content aloud. Accessibility should be tested with people using assistive technologies and against applicable WCAG guidance as the project develops.

## Repository status

This repository is at an early stage. The folder structure is agreed (see [Repository structure](#repository-structure)), but there is no application code yet. Implementation details, supported languages and file formats, deployment instructions, and automated tests will be documented as they are established.

## Product scope

The [product catalog](docs/project-catalog/) lists all planned features with MoSCoW priorities. The first version (MVP) is built from the **Must** features. **Should** and **Could** features are added if time allows. **Won't** features are out of scope on purpose.

- **Must (MVP):** paste letter text, plain-language explanation, action plan (what to do, by when, how much to pay), key facts box, loading and error messages, phone and desktop layout, a rule that the app says "not in the letter" instead of guessing.
- **Should:** sensitive data masking (PESEL, ID numbers), consequences of not acting (only if the letter states them), large font mode, read aloud.
- **Could:** high contrast mode, photo or scan upload (OCR), calendar reminder.
- **Won't:** user accounts and history, legal advice, storing letter content.
  
## Documentation

- [Frontend technology stack](docs/tech-stack/frontend.md) — options considered, evaluation criteria, and the proposed frontend selection (Sprint 1).
- [Backend technology stack](docs/tech-stack/backend.md) — options considered, evaluation criteria, and the proposed backend selection (Sprint 1).
- [CI/CD technology stack](docs/tech-stack/ci-cd.md) — pipeline options considered, the proposed choice, and the proposed pipeline (Sprint 1).
- [AI](docs/tech-stack/ai.md) — options considered evaluation criteria, and the proposed ai selection (Sprint 1).
- [Product catalog and priorities](docs/project-catalog/product_catalog.xlsx) — all planned features with MoSCoW priorities (Sprint 1).
- [Feature ideas](docs/project-catalog/functions_ideas.pdf) — the raw idea list the catalog was built from (Sprint 1).
