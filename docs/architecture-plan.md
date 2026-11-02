# System Architecture Plan (US-03)

## Overview

This document defines the system architecture and data flow for **ProsteFakty** (`user → page → server → AI → result`). Every component in the diagram maps directly to the tools selected in **US-06**, showing where sensitive personal data (such as PESEL numbers) is masked and where external API keys are stored.

## Architecture & Data Flow Diagram

```mermaid
flowchart TB
    %% Styling
    classDef userNode fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000
    classDef pageNode fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000
    classDef serverNode fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,color:#000
    classDef secNode fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#000
    classDef dbNode fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000
    classDef aiNode fill:#e0f2f1,stroke:#00695c,stroke-width:2px,color:#000

    %% 1. USER
    User(["👤 User<br/>(Browser / Assistive Tech)"]):::userNode

    %% 2. PAGE (FRONTEND)
    subgraph Page ["1. Page (Frontend — Public Client, NO API Keys in Code)"]
        PWA["🖥️ Web UI Input<br/>Tool (US-06): React + Vite PWA"]:::pageNode
        ResultUI["📋 Explanation, Checklist & Deadlines (Result)<br/>Tool (US-06): React + Vite PWA + Browser Speech Synthesis (TTS)"]:::pageNode
    end

    %% 3. SERVER (BACKEND)
    subgraph Server ["2. Server (Backend — Trusted Boundary over HTTPS)"]
        API["⚙️ REST API & Upload Validation<br/>Tool (US-06): Python + FastAPI"]:::serverNode
        Queue["📨 Background Job Queue & Worker<br/>Tool (US-06): Celery + Redis"]:::serverNode
        Extraction["📄 Document Text Extraction & OCR<br/>Tool (US-06): PyMuPDF + OpenCV + Pillow + PaddleOCR"]:::serverNode
        Masking["🛡️ Sensitive Data (PII) Masking<br/>Masks PESEL, nip, addresses before AI call<br/>Tool (US-06): Python PII Sanitizer (Regex / Presidio)"]:::secNode
        EnvSecrets[("🔑 Server Secret Store (API Key)<br/>Stored ONLY on server, never in Page or Git<br/>Tool (US-06): Server Environment File (.env)")]:::secNode
        DB[("🗄️ Persistent App & Reminder Storage<br/>No original documents stored<br/>Tool (US-06): PostgreSQL + SQLAlchemy + APScheduler")]:::dbNode
    end

    %% 4. AI (EXTERNAL PROVIDER)
    subgraph ExternalAI ["3. AI Service (External Boundary)"]
        AI["🤖 External LLM Service<br/>Receives ONLY masked text<br/>Tool (US-06): External AI Provider REST API"]:::aiNode
    end

    %% FLOW CONNECTIONS
    User -- "1. Pastes text or uploads<br/>document/photo (contains PESEL)" --> PWA
    PWA -- "2. HTTPS POST request<br/>(raw document / text)" --> API
    API -- "3. Enqueues analysis job<br/>& validates upload" --> Queue
    Queue -- "4. Extracts text & deletes<br/>temporary files" --> Extraction
    Extraction -- "5. Raw extracted text" --> Masking
    EnvSecrets -. "6a. Loads AI API Key<br/>at runtime (server-side only)" .-> Masking
    Masking -- "6b. Sends sanitized prompt<br/>(PESEL -> [PESEL_MASKED]) + API Key" --> AI
    AI -- "7. Plain-language explanation,<br/>actions & deadlines" --> API
    API -- "8. Saves optional user reminder<br/>(metadata only)" --> DB
    API -- "9. Returns structured JSON<br/>(Result)" --> ResultUI
    ResultUI -- "10. Displays high-contrast result<br/>& reads aloud" --> User
```

## US-03 Checklist Verification

### 1. Flow: `user → page → server → AI → result`
1. **User:** Uploads an official letter/PDF or pastes text containing sensitive data.
2. **Page (`React + Vite PWA`):** Sends the input over HTTPS to the backend API without performing any direct calls to the AI provider.
3. **Server (`Python + FastAPI`, `Celery + Redis`):** Validates the upload, extracts text via `PyMuPDF` (digital PDFs) or `OpenCV + Pillow + PaddleOCR` (scans/photos), and immediately deletes temporary files.
4. **AI (`External AI Provider API`):** Processes the sanitized text and returns a plain-language explanation, relevant source passages, action items, and deadlines.
5. **Result (`React + Vite PWA` + `Browser Speech Synthesis`):** Renders the explanation in an accessible, high-contrast view with text-to-speech support, while optional deadline reminders are persisted via `PostgreSQL + SQLAlchemy + APScheduler`.

### 2. Sensitive Data Masking (e.g., PESEL) Before Going to AI
* **Where it happens:** Strictly inside the **Backend Server (`Python + FastAPI / Celery Worker`)**, immediately after text extraction (`PyMuPDF` / `PaddleOCR`) and **before** any outbound HTTP request leaves the server for the external AI API.
* **How it works:** The Python PII Sanitizer module scans the extracted text for Polish sensitive identifiers (such as 11-digit **PESEL** numbers, document IDs, bank account numbers, or phone numbers) and replaces them with placeholders (e.g., `03271212345` → `[PESEL_REDACTED]`).
* **Data hygiene:** Raw document files are deleted immediately after processing, and neither raw text nor OCR output is written to application or CI/CD logs.

### 3. API Key Storage (Not in the Page Code)
* **Where it is stored:** In a protected **server-side environment file (`.env`)** on the deployment host (and managed via `GitHub Secrets` only for deployment SSH access, as defined in `docs/tech-stack/ci-cd.md`).
* **Why it is safe:** The `React + Vite PWA` frontend never contains, fetches, or sees the AI API key in its source bundle, network tab, or browser storage. The backend (`FastAPI` / `Celery`) reads the key from the server's environment variables at runtime when calling the AI provider.

### 4. Mapping to Tools from US-06

| Architecture Box | Tool from US-06 | Role in the Flow |
| :--- | :--- | :--- |
| **Page (Input & Result)** | `React + Vite (PWA)`, `Browser Speech Synthesis` | Accessible UI, file upload, high-contrast result display, and text-to-speech. |
| **API Server** | `Python + FastAPI` | REST API endpoints, file upload validation, OpenAPI schema, and response formatting. |
| **Background Queue** | `Celery + Redis` | Asynchronous execution of OCR and AI analysis without blocking HTTP requests. |
| **Text Extraction & OCR** | `PyMuPDF`, `OpenCV + Pillow`, `PaddleOCR` | Extracting text from native PDFs and scanned Polish documents/photos. |
| **PII Masking Module** | `Python PII Sanitizer (Regex / Presidio)` | Masking PESEL and other sensitive data on the server before calling external AI. |
| **Secret Storage** | `Server Environment File (.env)` / `GitHub Secrets` | Storing AI API keys and DB credentials strictly outside page code and Git repo. |
| **Database & Reminders** | `PostgreSQL + SQLAlchemy`, `APScheduler` | Storing deadline reminders and settings without archiving original documents. |
| **CI/CD & Deployment** | `GitHub Actions`, `Docker Compose`, `Caddy` | Automated testing (`pytest`, `Ruff`, `npm build`) and SSH deployment with HTTPS. |
