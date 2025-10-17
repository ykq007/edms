from functools import lru_cache
from typing import Literal

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    """Configuration values for the API service.

    Environment variables are read from the runtime environment with fallbacks supplied by the
    defaults below. Validation raises an error during service startup if any variable contains an
    unexpected value.
    """

    environment: Literal["development", "staging", "production", "test"] = Field(
        "development", env="GLOBAL_ENV"
    )
    service_name: str = Field("api-service", env="API_SERVICE_NAME")
    host: str = Field("0.0.0.0", env="API_HOST")
    port: int = Field(8000, env="API_PORT")
    log_level: Literal["debug", "info", "warning", "error", "critical"] = Field(
        "info", env="API_LOG_LEVEL"
    )
    default_page_size: int = Field(50, env="API_DEFAULT_PAGE_SIZE")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @validator("port")
    def validate_port(cls, value: int) -> int:  # noqa: D401 - short validator description
        """Ensure the port value is within the valid TCP range."""

        if not (1 <= value <= 65535):
            raise ValueError("API_PORT must be between 1 and 65535")
        return value

    @validator("default_page_size")
    def validate_page_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("API_DEFAULT_PAGE_SIZE must be a positive integer")
        return value


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()  # type: ignore[arg-type]
