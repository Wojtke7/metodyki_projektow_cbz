"""Application configuration loaded from environment variables / .env file."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the ProsteFakty backend.

    All values are read from environment variables.  Copy ``.env.example``
    to ``.env`` at the project root and fill in real values; never commit
    ``.env``.
    """

    gemini_api_key: str
    gemini_model: str = "models/gemini-flash-lite-latest"

    model_config = SettingsConfigDict(
        # Look for a .env file starting from the backend/ directory and
        # walking up to the project root so both `uvicorn` from backend/
        # and pytest from the project root find it.
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        # Ignore extra variables in .env (e.g. DATABASE_URL, REDIS_URL)
        # that belong to other components not yet in use.
        extra="ignore",
    )


# Module-level singleton — imported by the rest of the application.
settings = Settings()  # type: ignore[call-arg]
