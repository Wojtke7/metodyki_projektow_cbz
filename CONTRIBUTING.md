# Contributing to ProsteFakty

How the team works on this repository. Keep it short and update it when the process changes.

## Pull requests to `main`

Changes reach `main` only through a pull request.

1. Create a branch from an up-to-date `main` and make your changes there.
2. Open a pull request to `main`. Describe what changed and why, and link the Trello card (for example `[S1] US-04`).
3. At least one other team member reviews the changes and approves the pull request.
4. After at least one approval, the pull request is merged into `main`.

Keep pull requests small and focused on one task, so they are quick to review.

Suggested branch names use a short prefix: `feat/`, `fix/`, `docs/` or `chore/`, for example `docs/tech-stack-ai`. Commit messages follow the same prefixes, for example `docs: AI model technology stack`.

## Task flow on Trello

A task card moves through the board columns in this order:

1. **DOING**: the task is being worked on.
2. **VERIFY**: the work is done and the Product Owner checks it.
3. **CLOSED**: the Product Owner accepts the result and the card is closed.

## Repository rules

- Do not commit secrets. Keep local configuration in `.env` (see `.env.example`); it is ignored by Git.
- Do not commit real documents, photographs, or OCR output.
- Tests must not call a real AI provider; use fixtures and mocks.
- Follow the folder structure described in the [README](README.md#repository-structure).
