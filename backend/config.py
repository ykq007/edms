from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional


def _get_env(name: str, default: Optional[str] = None) -> Optional[str]:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value


def _get_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False

    raise ValueError(f"Invalid boolean value for environment variable '{name}': {value}")


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default

    try:
        return int(value)
    except ValueError as exc:  # pragma: no cover - defensive branch for misconfiguration
        raise ValueError(
            f"Invalid integer value for environment variable '{name}': {value}"
        ) from exc


def _get_log_level(default: str = "INFO") -> str:
    return os.getenv("BACKEND_LOG_LEVEL", default).upper()


@dataclass(frozen=True)
class DocumentIndexSettings:
    name: str = "documents"
    number_of_shards: int = 1
    number_of_replicas: int = 1
    refresh_interval: str = "1s"


DEFAULT_DOCUMENT_INDEX = DocumentIndexSettings()


@dataclass(frozen=True)
class ElasticsearchSettings:
    url: str
    username: Optional[str]
    password: Optional[str]
    api_key: Optional[str]
    verify_certs: bool
    ca_certs: Optional[str]
    request_timeout: int
    retry_on_timeout: bool
    max_retries: int
    document_index: DocumentIndexSettings
    log_level: str


@lru_cache(maxsize=1)
def get_settings() -> ElasticsearchSettings:
    document_index = DocumentIndexSettings(
        name=_get_env("ELASTICSEARCH_DOCUMENT_INDEX", DEFAULT_DOCUMENT_INDEX.name),
        number_of_shards=_get_int(
            "ELASTICSEARCH_DOCUMENT_INDEX_SHARDS", DEFAULT_DOCUMENT_INDEX.number_of_shards
        ),
        number_of_replicas=_get_int(
            "ELASTICSEARCH_DOCUMENT_INDEX_REPLICAS", DEFAULT_DOCUMENT_INDEX.number_of_replicas
        ),
        refresh_interval=_get_env(
            "ELASTICSEARCH_DOCUMENT_INDEX_REFRESH_INTERVAL", DEFAULT_DOCUMENT_INDEX.refresh_interval
        ),
    )

    return ElasticsearchSettings(
        url=_get_env("ELASTICSEARCH_URL", "http://localhost:9200"),
        username=_get_env("ELASTICSEARCH_USERNAME"),
        password=_get_env("ELASTICSEARCH_PASSWORD"),
        api_key=_get_env("ELASTICSEARCH_API_KEY"),
        verify_certs=_get_bool("ELASTICSEARCH_VERIFY_CERTS", False),
        ca_certs=_get_env("ELASTICSEARCH_CA_CERTS"),
        request_timeout=_get_int("ELASTICSEARCH_REQUEST_TIMEOUT", 10),
        retry_on_timeout=_get_bool("ELASTICSEARCH_RETRY_ON_TIMEOUT", True),
        max_retries=_get_int("ELASTICSEARCH_MAX_RETRIES", 3),
        document_index=document_index,
        log_level=_get_log_level(),
    )


__all__ = [
    "DocumentIndexSettings",
    "ElasticsearchSettings",
    "get_settings",
]
