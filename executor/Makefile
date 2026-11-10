SHELL := /bin/bash
.DEFAULT_GOAL := help

# Config — override on the command line when needed, e.g. make psql DB_NAME=other-db
DB_NAME ?= patidar-stone-crusher-website-db
DB_USER ?= postgres
COMPOSE  = docker compose

# NOTE: recipes must be indented with real tabs, not spaces.

# HELP
# This will output the help for each task
.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-26s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ============================================================
# DOCKER TASKS
# ============================================================

.PHONY: check-docker
check-docker: ## Verify docker + compose plugin are installed
	@command -v docker >/dev/null 2>&1 || { echo "ERROR: docker is not installed. Install Docker Desktop or docker-ce with the compose plugin."; exit 1; }
	@$(COMPOSE) version >/dev/null 2>&1 || { echo "ERROR: 'docker compose' plugin not found."; exit 1; }

.PHONY: up
up: check-docker ## Build images (if needed) and start the whole stack
	@$(COMPOSE) up -d --build --wait
	@$(MAKE) --no-print-directory ps

.PHONY: dirty-up
dirty-up: check-docker ## Start the stack WITHOUT rebuilding images
	@$(COMPOSE) up -d --wait
	@$(MAKE) --no-print-directory ps

.PHONY: down
down: ## Stop and remove containers (data/volumes are kept)
	@$(COMPOSE) down --remove-orphans

.PHONY: restart
restart: down up ## Restart the whole stack (rebuild)

.PHONY: build
build: check-docker ## (Re)build all service images
	@echo "Building docker images — grab a coffee and wait."
	@$(COMPOSE) build --force-rm
	@echo "Docker images built"

.PHONY: ps
ps: ## Show container status
	@$(COMPOSE) ps

.PHONY: logs
logs: ## Tail service logs (all, or one: make logs s=user-backend)
	@$(COMPOSE) logs -f $(s)

.PHONY: wipe
wipe: ## Stop the stack AND delete its volumes (destroys all database data)
	@$(COMPOSE) down -v --remove-orphans

.PHONY: wipe-all
wipe-all: ## Stop the stack, delete volumes AND locally built images (full clean, scoped to this project)
	@$(COMPOSE) down -v --remove-orphans --rmi local

# ============================================================
# DATABASE TASKS
# admin-backend OWNS the schema: all migrations + seeders live there and run
# in the admin-backend container. user-backend only holds the Sequelize
# models matching that schema. Both share one database and one
# sequelize_migration_meta table, so migrations run exactly once.
# ============================================================

.PHONY: ensure-db
ensure-db: check-docker ## Create DB_NAME in postgres if missing (the volume may predate the DB rename)
	@$(COMPOSE) up -d --wait postgres
	@if $(COMPOSE) exec -T postgres psql -U $(DB_USER) -tAc "SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)'" | grep -q 1; then \
		echo "Database '$(DB_NAME)' already exists"; \
	else \
		echo "Creating database '$(DB_NAME)'"; \
		$(COMPOSE) exec -T postgres psql -U $(DB_USER) -c 'CREATE DATABASE "$(DB_NAME)"'; \
	fi

.PHONY: migrate
migrate: migrate-admin ## Run pending migrations (admin-backend owns the schema)

.PHONY: migrate-admin
migrate-admin: check-docker ## Run pending admin-backend migrations (schema owner)
	@$(COMPOSE) run --rm admin-backend npm run db:migrate

.PHONY: migrate-status
migrate-status: check-docker ## Show migration status (admin-backend)
	@$(COMPOSE) run --rm admin-backend npm run db:migrate:status

.PHONY: migrate-undo
migrate-undo: check-docker ## Undo the LAST migration (runs in admin-backend, the schema owner)
	@$(COMPOSE) run --rm admin-backend npm run db:migrate:undo

.PHONY: seed
seed: seed-admin ## Run all seeders (admin-backend owns them)

.PHONY: seed-admin
seed-admin: check-docker ## Run admin-backend seeders (user login: staff@crusher.com / Staff@123)
	@$(COMPOSE) run --rm admin-backend npm run db:seed

.PHONY: setup-db
setup-db: ensure-db migrate seed ## Ensure database exists, migrate + seed (via admin-backend)

.PHONY: reset-db
reset-db: check-docker ## DROP and recreate the database, then migrate + seed (DESTROYS all order data!)
	@$(COMPOSE) up -d --wait postgres
	@$(COMPOSE) exec -T postgres psql -U $(DB_USER) -c 'DROP DATABASE IF EXISTS "$(DB_NAME)" WITH (FORCE);'
	@$(COMPOSE) exec -T postgres psql -U $(DB_USER) -c 'CREATE DATABASE "$(DB_NAME)";'
	@$(MAKE) --no-print-directory setup-db

.PHONY: psql
psql: ## Open a psql console on the app database
	@$(COMPOSE) exec postgres psql -U $(DB_USER) -d $(DB_NAME)

.PHONY: redis-cli
redis-cli: ## Open a redis-cli console
	@$(COMPOSE) exec redis redis-cli

.PHONY: migration-create
migration-create: ## Create an empty migration file in admin-backend: make migration-create name=create-thing
	@test -n "$(name)" || { echo 'Usage: make migration-create name=create-thing'; exit 1; }
	@cd ../admin-backend && npm run db:migration:create -- $(name)

# ============================================================
# FRONTENDS (run on the host — their compose services are commented out)
# ============================================================

.PHONY: install-frontends
install-frontends: ## npm install for both frontends
	@cd ../user-frontend && npm install
	@cd ../admin-frontend && npm install

.PHONY: dev-user-frontend
dev-user-frontend: ## Run user-frontend dev server (http://localhost:3000)
	@cd ../user-frontend && npm run dev

.PHONY: dev-admin-frontend
dev-admin-frontend: ## Run admin-frontend dev server
	@cd ../admin-frontend && npm run dev

# ============================================================
# ONE-SHOT TASKS
# ============================================================

.PHONY: setup
setup: check-docker build up setup-db install-frontends ## Fresh project setup: build, start, create DB, migrate, seed, install frontend deps

.PHONY: reset
reset: wipe-all setup ## Full reset: wipe volumes + images, then setup from scratch
