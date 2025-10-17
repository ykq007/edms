SHELL := /bin/bash
COMPOSE ?= docker compose
ENV_FILE ?= .env

.PHONY: help setup-env build up up-detached down restart logs test test-api test-worker

help: ## Show available make targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup-env: ## Create a local .env file from the example template
	@if [ ! -f $(ENV_FILE) ]; then \
		cp .env.example $(ENV_FILE); \
		echo "Created $(ENV_FILE) from .env.example"; \
	else \
		echo "$(ENV_FILE) already exists"; \
	fi

build: ## Build all Docker images
	$(COMPOSE) build

up: ## Start all services with logs in the foreground
	$(COMPOSE) up

up-detached: ## Start services in the background
	$(COMPOSE) up -d

restart: ## Restart all services without rebuilding images
	$(COMPOSE) down
	$(COMPOSE) up -d

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

down: ## Stop all running services and remove containers
	$(COMPOSE) down

test: test-api test-worker ## Run the full test suite inside service containers

test-api: ## Execute API service tests inside a disposable container
	$(COMPOSE) run --rm api pytest

test-worker: ## Execute worker service tests inside a disposable container
	$(COMPOSE) run --rm worker pytest
