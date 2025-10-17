from __future__ import annotations

import logging
from typing import Any, Dict

from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ApiError

from .config import ElasticsearchSettings

logger = logging.getLogger(__name__)

DOCUMENT_INDEX_ANALYSIS: Dict[str, Any] = {
    "analyzer": {
        "autocomplete": {
            "tokenizer": "autocomplete",
            "filter": ["lowercase"],
        }
    },
    "tokenizer": {
        "autocomplete": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 20,
            "token_chars": ["letter", "digit"],
        }
    },
}

DOCUMENT_INDEX_PROPERTIES: Dict[str, Any] = {
    "document_id": {"type": "keyword"},
    "external_id": {"type": "keyword"},
    "slug": {"type": "keyword"},
    "title": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
            "keyword": {"type": "keyword", "ignore_above": 256},
            "autocomplete": {
                "type": "text",
                "analyzer": "autocomplete",
                "search_analyzer": "standard",
            },
        },
    },
    "summary": {"type": "text"},
    "content": {"type": "text"},
    "tags": {"type": "keyword"},
    "language": {"type": "keyword"},
    "source": {"type": "keyword"},
    "authors": {"type": "keyword"},
    "created_at": {"type": "date"},
    "updated_at": {"type": "date"},
    "is_archived": {"type": "boolean"},
    "metadata": {"type": "object", "enabled": False},
}

DOCUMENT_INDEX_MAPPINGS: Dict[str, Any] = {
    "dynamic": "strict",
    "properties": DOCUMENT_INDEX_PROPERTIES,
}


def _build_index_settings(settings: ElasticsearchSettings) -> Dict[str, Any]:
    return {
        "index": {
            "number_of_shards": settings.document_index.number_of_shards,
            "number_of_replicas": settings.document_index.number_of_replicas,
            "refresh_interval": settings.document_index.refresh_interval,
        },
        "analysis": DOCUMENT_INDEX_ANALYSIS,
    }


def _handle_index_creation_response(response: Any, index_name: str) -> None:
    if response is None:
        return

    if isinstance(response, dict) and response.get("error"):
        error = response["error"]
        error_type = error.get("type")
        if error_type in {"resource_already_exists_exception", "index_already_exists_exception"}:
            logger.debug("Index '%s' already exists; continuing", index_name)
            return

        logger.error("Elasticsearch index creation failed for '%s': %s", index_name, error)
        raise RuntimeError(f"Unable to create index '{index_name}': {error}")


def ensure_document_index(client: Elasticsearch, settings: ElasticsearchSettings) -> None:
    index_name = settings.document_index.name
    index_settings = _build_index_settings(settings)

    logger.info("Ensuring Elasticsearch index '%s' is provisioned", index_name)

    try:
        response = client.indices.create(
            index=index_name,
            settings=index_settings,
            mappings=DOCUMENT_INDEX_MAPPINGS,
            ignore=400,
        )
        _handle_index_creation_response(response, index_name)

        client.indices.put_mapping(
            index=index_name,
            dynamic=DOCUMENT_INDEX_MAPPINGS.get("dynamic"),
            properties=DOCUMENT_INDEX_PROPERTIES,
        )

        client.indices.put_settings(
            index=index_name,
            settings={
                "index": {
                    "number_of_replicas": settings.document_index.number_of_replicas,
                    "refresh_interval": settings.document_index.refresh_interval,
                }
            },
        )
    except ApiError as exc:  # pragma: no cover - requires integration tests
        logger.exception("Failed to prepare Elasticsearch index '%s'", index_name)
        raise RuntimeError(f"Failed to provision Elasticsearch index '{index_name}'") from exc


__all__ = ["ensure_document_index"]
