from functools import lru_cache
from typing import Literal

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    """Configuration values for the worker service."""

    environment: Literal["development", "staging", "production", "test"] = Field(
        "development", env="GLOBAL_ENV"
    )
    service_name: str = Field("worker-service", env="WORKER_SERVICE_NAME")
    host: str = Field("0.0.0.0", env="WORKER_HOST")
    port: int = Field(8001, env="WORKER_PORT")
    log_level: Literal["debug", "info", "warning", "error", "critical"] = Field(
        "info", env="WORKER_LOG_LEVEL"
    )
    poll_interval_seconds: int = Field(5, env="WORKER_POLL_INTERVAL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @validator("port")
    def validate_port(cls, value: int) -> int:
        if not (1 <= value <= 65535):
            raise ValueError("WORKER_PORT must be between 1 and 65535")
        return value

    @validator("poll_interval_seconds")
    def validate_poll_interval(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("WORKER_POLL_INTERVAL must be a positive integer")
        return value


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance for the worker service."""

    return Settings()  # type: ignore[arg-type]
