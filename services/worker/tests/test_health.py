import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.main import app


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()

    assert payload["status"] == "ok"
    assert payload["service"] == Settings().service_name
    assert payload["environment"] == Settings().environment


def test_settings_reject_non_positive_poll_interval() -> None:
    with pytest.raises(ValidationError):
        Settings(poll_interval_seconds=0)
