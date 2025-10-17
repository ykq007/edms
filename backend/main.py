from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from elasticsearch import Elasticsearch
from fastapi import Depends, FastAPI, HTTPException, Request, status

from .config import ElasticsearchSettings, get_settings
from .elasticsearch_client import create_elasticsearch_client
from .index_provisioner import ensure_document_index

logger = logging.getLogger(__name__)


def configure_logging(settings: ElasticsearchSettings) -> None:
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


@asynccontextmanager
def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    configure_logging(settings)

    logger.info("Initialising Elasticsearch client with index provisioning")
    client = create_elasticsearch_client(settings)

    try:
        ensure_document_index(client, settings)
    except Exception:
        logger.exception("Failed to ensure Elasticsearch indices on startup")
        client.close()
        raise

    app.state.elasticsearch_client = client

    try:
        yield
    finally:
        client.close()
        app.state.elasticsearch_client = None
        logger.info("Elasticsearch client closed")


app = FastAPI(title="Backend Service", lifespan=lifespan)


def get_elasticsearch_client(request: Request) -> Elasticsearch:
    client = getattr(request.app.state, "elasticsearch_client", None)
    if client is None:
        raise RuntimeError("Elasticsearch client has not been initialised yet")
    return client


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["health"])
def readiness(client: Elasticsearch = Depends(get_elasticsearch_client)) -> dict[str, str]:
    settings = get_settings()

    try:
        cluster_health = client.cluster.health()
        index_exists = client.indices.exists(index=settings.document_index.name)
    except Exception as exc:  # pragma: no cover - requires integration tests
        logger.exception("Readiness check failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Elasticsearch cluster is not ready",
        ) from exc

    cluster_status = cluster_health.get("status")

    if cluster_status == "red":
        logger.error(
            "Elasticsearch cluster reported critical status 'red' during readiness check"
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Elasticsearch cluster status is red",
        )

    if not index_exists:
        logger.error("Required index '%s' is missing", settings.document_index.name)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Index '{settings.document_index.name}' is missing",
        )

    return {
        "status": "ready",
        "cluster_status": cluster_status,
        "index": settings.document_index.name,
    }


__all__ = ["app"]
