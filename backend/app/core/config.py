import logging
import os
import secrets
import warnings
from typing import Annotated, Any, Literal, Self

from pydantic import (
    AnyUrl,
    BeforeValidator,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import Defaults, EnvVars
from app.core.secrets import load_secrets_from_gsm, should_use_gsm


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    """auto load config from .env and validate settings"""

    # https://docs.pydantic.dev/latest/concepts/pydantic_settings/#dotenv-env-support
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="./app/.env",
        env_ignore_empty=True,
        extra="ignore",
    )
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    # FRONTEND_HOST: str = "http://localhost:5173"
    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = (
        []
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        frontend_urls = [
            url.strip().rstrip("/")
            for url in os.getenv("FRONTEND_URLS", "").split(",")
            if url.strip()
        ]

        return [
            str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS
        ] + frontend_urls

    PROJECT_NAME: str

    ## DB
    SUPABASE_URL: str
    # NOTE: super user key is service_role key instead of the anon key
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        return self

    # Application settings
    DEBUG: bool = Defaults.DEBUG
    TESTING: bool = Defaults.TESTING
    LOG_LEVEL: str = Defaults.LOG_LEVEL
    USE_GSM: bool = Defaults.USE_GSM


def get_settings() -> Settings:
    """Get application settings with optional Google Secret Manager integration"""
    # Load secrets from GSM if enabled (automatically falls back to env variables)
    if should_use_gsm():
        load_secrets_from_gsm()

    return Settings()


def should_use_testing() -> bool:
    return os.environ.get(EnvVars.TESTING, "").lower() in ("true", "1", "t")


# Load settings using the function
settings = get_settings()

# Set log level
LOG_LEVEL = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
