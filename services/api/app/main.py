from fastapi import FastAPI, status
from fastapi.responses import JSONResponse

from .config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.service_name,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.get("/", response_class=JSONResponse, status_code=status.HTTP_200_OK)
def read_root() -> dict[str, str]:
    """Return a friendly message confirming the service is running."""

    return {
        "message": "API service is up and running.",
        "default_page_size": str(settings.default_page_size),
    }


@app.get("/health", response_class=JSONResponse, status_code=status.HTTP_200_OK)
def healthcheck() -> dict[str, str]:
    """Basic healthcheck endpoint for liveness and readiness probes."""

    return {
        "status": "ok",
        "service": settings.service_name,
        "environment": settings.environment,
    }
