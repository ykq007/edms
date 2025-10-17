# Environment Management, Service Healthchecks, and Developer Tooling

## Overview

This repository demonstrates a two-service architecture that focuses on predictable environment
management, repeatable local tooling, and observable service health. It ships with:

- A dedicated `.env` workflow with validation in code to protect against misconfiguration.
- Docker Compose orchestration for the API and worker services.
- A Makefile that exposes the most common development, build, and test workflows.
- `/health` endpoints on every service to provide clear readiness signals for humans and automation.
- Documentation that walks through local setup, configuration, and day-to-day usage.

## Service Topology

| Service | Description | Default Port | Healthcheck |
|---------|-------------|--------------|-------------|
| `api`   | Public-facing FastAPI application that exposes a REST API skeleton. | `8000` | `GET /health` |
| `worker`| Auxiliary FastAPI service that simulates background processing capabilities. | `8001` | `GET /health` |

All services inherit shared configuration from the root `.env` file. Containerised workloads are
managed through `docker-compose.yml`.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/) (Docker Desktop already includes it)
- [GNU Make](https://www.gnu.org/software/make/) – available by default on macOS/Linux and via
  [chocolatey](https://chocolatey.org/) or [scoop](https://scoop.sh/) on Windows

## Quickstart

1. **Copy and configure environment variables**

   ```bash
   make setup-env
   ```

   Edit `.env` if you need to override defaults. Do **not** commit secrets to version control.

2. **Build images and launch services**

   ```bash
   make up-detached
   ```

   The API will be available at http://localhost:8000 and the worker at http://localhost:8001 by
default.

3. **Inspect logs** (optional)

   ```bash
   make logs
   ```

4. **Shut everything down when finished**

   ```bash
   make down
   ```

## Health Checks

Each service exposes an authenticated-free readiness endpoint.

- **API** – `GET http://localhost:8000/health`
- **Worker** – `GET http://localhost:8001/health`

Sample response:

```json
{
  "status": "ok",
  "service": "api-service",
  "environment": "development"
}
```

Docker Compose additionally defines container-level health checks. Dependent services wait until
their upstreams report healthy before booting.

## Environment Management and Validation

Environment variables are declared in `.env.example` and read into both services via Pydantic
settings modules. Validation rules enforce consistent values so configuration mistakes fail fast at
startup.

| Variable | Description | Default |
|----------|-------------|---------|
| `GLOBAL_ENV` | Logical deployment environment (`development`, `staging`, `production`, `test`). | `development` |
| `API_SERVICE_NAME` | Display name for the API service. | `api-service` |
| `API_HOST` | Bind host for the API server. | `0.0.0.0` |
| `API_PORT` | Bind port for the API server. | `8000` |
| `API_LOG_LEVEL` | Log verbosity (`debug`, `info`, `warning`, `error`, `critical`). | `info` |
| `API_DEFAULT_PAGE_SIZE` | Example domain configuration value. | `50` |
| `WORKER_SERVICE_NAME` | Display name for the worker service. | `worker-service` |
| `WORKER_HOST` | Bind host for the worker server. | `0.0.0.0` |
| `WORKER_PORT` | Bind port for the worker server. | `8001` |
| `WORKER_LOG_LEVEL` | Log verbosity (`debug`, `info`, `warning`, `error`, `critical`). | `info` |
| `WORKER_POLL_INTERVAL` | Simulated job polling interval in seconds. | `5` |

If a value is outside its permitted range (for example, `API_PORT` > 65535 or a log level not in the
allowed list) the service will fail to boot with a clear validation error.

## Running Tests

Execute the entire suite from the host:

```bash
make test
```

This command starts disposable containers for each service and runs `pytest`. You can also target a
single service:

```bash
make test-api
make test-worker
```

## Local Development Tips

- When iterating quickly, run `docker compose up --build` directly to rebuild only the services that
  change.
- To run a service outside Docker, create a virtual environment and install the relevant
  `requirements.txt`, then start `uvicorn app.main:app --reload --port <PORT>` while exporting the
  same environment variables defined in `.env`.
- Keep `.env.example` updated whenever you add new configuration options so that new contributors can
  bootstrap easily.

## Cleaning Up

Stop running services and remove associated containers, networks, and volumes with:

```bash
make down
```

This does not delete built images; run `docker system prune` if you need to reclaim disk space.
