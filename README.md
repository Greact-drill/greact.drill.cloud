# Drill Cloud

Backend API Drill на NestJS + Prisma.

## Keycloak
- Используется общий realm: `toir`
- Audience/API client для этого сервиса: `drill-cloud-backend`
- JWT проверяется через issuer + JWKS
- Защита включается автоматически, если заданы `KEYCLOAK_ISSUER_URL` и `KEYCLOAK_AUDIENCE`
- Публичными оставлены `GET /health` и `POST /ingest`

## Environment
- `DATABASE_URL` - PostgreSQL connection string
- `CURRENT_API_BASE_URL` - внешний API для sync
- `CORS_ALLOWED_ORIGINS` - список origin через запятую
- `KEYCLOAK_ISSUER_URL` - например `https://sso.greact.ru/realms/toir`
- `KEYCLOAK_AUDIENCE` - например `drill-cloud-backend`
- `KEYCLOAK_JWKS_URL` - опционально, если нужен нестандартный JWKS endpoint

## Run
```bash
npm install
npm run prisma:generate
npm run start:dev
```

## Build
```bash
npm run build
```
