from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from elasticsearch import Elasticsearch

from .config import ElasticsearchSettings, get_settings

logger = logging.getLogger(__name__)


def _resolve_auth(settings: ElasticsearchSettings) -> Dict[str, Any]:
    auth_options: Dict[str, Any] = {}

    if settings.api_key:
        auth_options["api_key"] = settings.api_key
        return auth_options

    if settings.username and settings.password:
        auth_options["basic_auth"] = (settings.username, settings.password)
        return auth_options

    if settings.username and not settings.password:
        raise ValueError(
            "ELASTICSEARCH_USERNAME is set but ELASTICSEARCH_PASSWORD is missing."
        )

    if settings.password and not settings.username:
        raise ValueError(
            "ELASTICSEARCH_PASSWORD is set but ELASTICSEARCH_USERNAME is missing."
        )

    return auth_options


def create_elasticsearch_client(
    settings: Optional[ElasticsearchSettings] = None,
) -> Elasticsearch:
    resolved_settings = settings or get_settings()

    kwargs: Dict[str, Any] = {
        "hosts": [resolved_settings.url],
        "verify_certs": resolved_settings.verify_certs,
        "request_timeout": resolved_settings.request_timeout,
        "retry_on_timeout": resolved_settings.retry_on_timeout,
        "max_retries": resolved_settings.max_retries,
    }

    if resolved_settings.ca_certs:
        kwargs["ca_certs"] = resolved_settings.ca_certs
    if not resolved_settings.verify_certs:
        kwargs["ssl_show_warn"] = False

    kwargs.update(_resolve_auth(resolved_settings))

    logger.debug(
        "Creating Elasticsearch client with hosts=%s, verify_certs=%s, timeout=%s",
        kwargs["hosts"],
        kwargs["verify_certs"],
        kwargs["request_timeout"],
    )

    client = Elasticsearch(**kwargs)
    return client


__all__ = ["create_elasticsearch_client"]
