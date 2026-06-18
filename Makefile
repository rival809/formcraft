# FormCraft — Makefile shortcuts
# Usage: make <target>

.PHONY: dev build up down logs ps migrate seed clean

COMPOSE = docker compose -f docker-compose.yml -f docker-compose.prod.yml

dev:
	pnpm dev

build:
	$(COMPOSE) build --parallel

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f --tail=100

ps:
	$(COMPOSE) ps

migrate:
	$(COMPOSE) exec api npx prisma migrate deploy

studio:
	cd packages/db && pnpm prisma studio

seed:
	$(COMPOSE) exec api node dist/seed.js

restart-%:
	$(COMPOSE) restart $*

shell-%:
	$(COMPOSE) exec $* sh

clean:
	$(COMPOSE) down -v --remove-orphans
	docker image prune -f
