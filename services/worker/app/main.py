import asyncio
from datetime import datetime
from typing import Any

from fastapi import BackgroundTasks, FastAPI, status
from fastapi.responses import JSONResponse

from .config import get_settings

settings = get_settings()
app = FastAPI(title=settings.service_name, version="1.0.0")


async def _simulate_async_job(payload: dict[str, Any]) -> None:
    await asyncio.sleep(settings.poll_interval_seconds)
    # In a real application this is where background work would be processed.
    # The coroutine exists to demonstrate that the worker knows about its poll interval.


@app.get("/health", response_class=JSONResponse, status_code=status.HTTP_200_OK)
def healthcheck() -> dict[str, str]:
    """Return a simple payload to indicate the worker service is responsive."""

    return {
        "status": "ok",
        "service": settings.service_name,
        "environment": settings.environment,
    }


@app.post("/jobs", response_class=JSONResponse, status_code=status.HTTP_202_ACCEPTED)
def enqueue_job(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Pretend to enqueue a background job and confirm receipt."""

    payload = {"accepted_at": datetime.utcnow().isoformat()}
    background_tasks.add_task(_simulate_async_job, payload)

    return {
        "message": "Job accepted for asynchronous processing.",
        "poll_interval_seconds": str(settings.poll_interval_seconds),
    }
