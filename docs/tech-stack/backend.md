# Backend Technology Stack

## Backend requirements

The backend is expected to:

- Provide an API for the React PWA.
- Accept and validate document text, images, and supported files.
- Extract text from PDFs and scanned documents.
- Integrate with AI services to produce plain-language explanations, source passages, possible actions, and deadlines.
- Support longer-running analysis without holding a single HTTP request open.
- Store reminder and application data without permanently storing original documents or images.
- Handle sensitive data with strict retention, logging, and access controls.
- Expose API documentation to support frontend integration and testing.

## Options compared

The options below are compared on cost and ease of use.

### Python + FastAPI

- **Cost:** Low licensing cost because the tools are open source. Hosting, managed database, OCR, and background-worker costs still apply.
- **Ease of use:** High for an API-focused service. FastAPI provides request validation, asynchronous endpoints, and generated OpenAPI documentation. Python also has libraries suited to OCR and document processing.

### Python + Django REST Framework (DRF)

- **Cost:** Low licensing cost because DRF is open source. Hosting and PostgreSQL costs are broadly comparable to FastAPI.
- **Ease of use:** Medium. DRF is mature and provides broad web-application features. Its conventions can help with accounts and administration, but may add more structure than a focused document-processing API needs.

### TypeScript + NestJS

- **Cost:** Low licensing cost because NestJS is open source. Hosting and data-service costs still apply.
- **Ease of use:** Medium. NestJS provides a structured API framework and shares TypeScript with the planned React frontend. Python-based OCR and AI libraries would require a separate Python service or integration boundary, adding deployment and maintenance work.

### Cost notes

All three options can be built with open-source frameworks and libraries, so no framework license fee is expected. Actual operating costs will depend more on hosting, database and Redis services, OCR/AI workloads, and any paid AI provider than on the API framework. No currency estimate is provided because the deployment model, traffic, retention requirements, and AI provider have not yet been chosen.

## Proposed choice: Python + FastAPI

FastAPI is the recommended backend framework for the initial version, consistent with the project notes.

- **Python ecosystem:** PaddleOCR, PyMuPDF, OpenCV, and Pillow fit naturally into the same backend language and deployment boundary.
- **API integration:** FastAPI supports request validation and produces OpenAPI documentation for frontend development and API testing.
- **Long-running work:** The proposed Celery and Redis components can handle document-analysis jobs that should not block an HTTP request.
- **Modular growth:** The API, document extraction, AI integration, and reminder functionality can be separated into modules while remaining in a Python service initially.
- **Cost:** FastAPI and the proposed core libraries are open-source; infrastructure and external AI usage remain the primary variable costs.

DRF remains a reasonable alternative if the application needs Django's broader built-in features, particularly for account management and administration. NestJS is an option if sharing TypeScript with the frontend is a priority, but Python-based OCR and document processing would then need a separate service or integration boundary. FastAPI is the simplest fit for the current document-processing requirements.

## Team skills

The team has a general working familiarity with backend technologies. To implement the proposed stack effectively, we will need to deepen our practical knowledge of OpenCV, OCR and document-processing tools such as PaddleOCR and PyMuPDF, and background processing with Redis and Celery.

## Proposed backend components

| Concern | Proposed technology | Reason |
|---|---|---|
| API framework | Python + FastAPI | Lightweight REST API, validation, async support, and generated OpenAPI documentation. |
| Relational data | PostgreSQL + SQLAlchemy | Persistent storage for reminders and required application data, accessed through a Python ORM. Do not use it as an archive for original documents. |
| PDF text extraction | PyMuPDF | Extract text directly from PDFs that already contain a text layer, avoiding OCR when it is not needed. |
| OCR | PaddleOCR | Recognize text in scanned pages and document photographs, including Polish-language use cases described in the project notes. |
| Image preprocessing | OpenCV + Pillow | Prepare images for OCR, including appropriate cleanup and image transformations. |
| Background processing | Celery + Redis | Queue longer document-analysis jobs and let the API return a job identifier/status rather than hold a request open. |
| Reminder scheduling | APScheduler + PostgreSQL | Schedule reminder-related work while persisting reminder records so they survive a server restart. |
| File handling | Python file handling with upload validation | Enforce allowed types and size limits and manage temporary files with explicit cleanup. |
| Authentication, if accounts are added | JWT over HTTPS | The project notes propose JWT for authenticated accounts; it is only needed if the product introduces accounts or protected user data. |

The scheduling and background-job responsibilities should be clearly separated during implementation. For example, Celery can process analysis jobs while the reminder scheduler triggers reminder events. The team should avoid running duplicate schedulers across multiple application instances and should verify that scheduled work is recoverable after restarts.

## Data handling and safety requirements

These requirements apply regardless of the framework:

1. **Do not persist originals:** Treat uploaded documents and photographs as temporary inputs. Delete temporary files after processing, including on failure and cancellation paths.
2. **Persist only necessary data:** Store reminder details and other user data only when needed to provide an explicitly requested feature. Define retention and deletion behavior before adding document history.
3. **Keep content out of logs:** Do not log document text, OCR output, full AI prompts, or sensitive upload metadata.
4. **Validate uploads:** Check file type and size, reject unsupported inputs, and apply safe processing limits.
5. **Protect secrets and traffic:** Use HTTPS in deployment and store credentials/API keys in a managed secret store or environment configuration, never in source control.
6. **Control AI data sharing:** Select and configure any external AI provider only after reviewing its retention, processing location, and GDPR/RODO terms. Tell users when document content is sent to a third party.
7. **Set expectations:** Make it clear that generated explanations can be wrong and are not legal advice. Show the relevant original text alongside generated explanations where possible.
8. **Plan authentication deliberately:** Do not add JWT or accounts by default if the product can meet its initial requirements without them. If introduced, protect tokens and enforce access control for reminders and account data.

## Decisions still to confirm

- Which AI provider or model will generate explanations, and whether it may process sensitive documents.
- Whether users need accounts, or whether the first version can operate without them.
- Which languages, file types, file-size limits, and maximum processing times will be supported.
- Where the API, PostgreSQL, Redis, and worker processes will be hosted.
- How users will receive reminders: in-app, email, web push, or another channel.
- The applicable privacy policy, retention periods, and operational procedures for deletion and incidents.
