# Drill Cloud API

Центральный REST API для хранения, управления и выдачи телеметрии буровых установок. Построен на NestJS + Prisma + PostgreSQL. Реализует логику привязки тегов к блокам (`edge↔tag`).

## Назначение
- хранение телеметрии (`history`, `current`)
- управление деревом оборудования (`edge`)
- управление тегами и их связями с блоками (`tag`, `edge_tag`)
- конфигурации UI (виджеты, таблицы, кастомизации)
- синхронизация тегов с внешними источниками

## Схема данных (упрощенно)
```mermaid
erDiagram
  EDGE ||--o{ EDGE_TAG : binds
  TAG  ||--o{ EDGE_TAG : binds
  EDGE ||--o{ CURRENT  : has
  TAG  ||--o{ CURRENT  : has
  EDGE ||--o{ HISTORY  : has
  TAG  ||--o{ HISTORY  : has
  EDGE ||--o{ EDGE_CUSTOMIZATION : has
  EDGE ||--o{ TAG_CUSTOMIZATION  : has
  TAG  ||--o{ TAG_CUSTOMIZATION  : has
```

## Ключевые эндпоинты
### Edge
- `GET /edge` — список блоков
- `GET /edge/tree` — дерево блоков
- `GET /edge/:id/children` — дочерние блоки
- `GET /edge/:id/scoped-current` — текущие данные, отфильтрованные по разрешенным тегам
- `POST /edge/:id/current-by-tags` — текущие данные по списку тегов (учитывает edge_tag)
- `GET /edge/widget-configs/all` — все конфигурации виджетов
- `GET /edge/page/:page/table-config` — таблица по странице

### Tag
- `GET /tag` — список тегов (с `edge_ids`)
- `POST /tag` — создание тега с привязкой
- `PATCH /tag/:id` — обновление тега/привязок
- `POST /sync/tags?edge=EDGE_ID` — синхронизация тегов с внешним источником

### Current/History
- `GET /current?edge=EDGE_ID` — текущие значения по edge
- `GET /current/details?edge=EDGE_ID` — текущие значения с метаданными
- `POST /ingest` — пакетная загрузка телеметрии
- `GET /history` — история значений

### Customizations
- `GET /tag-customization` / `POST /tag-customization`
- `GET /edge-customization` / `POST /edge-customization`

## Логика привязки тегов к блокам
Все выдачи «текущих» значений фильтруются через таблицу `edge_tag`.
Это предотвращает отображение тегов, не принадлежащих выбранному блоку.

## Запуск
```bash
npm install
npm run prisma:generate
npm run migrate:dev
npm run start:dev
```

## Миграции
```bash
npm run migrate:dev:create
npm run migrate:dev
npm run migrate:deploy
```

## Переменные окружения
```env
DATABASE_URL="postgresql://user:password@localhost:5432/drillcloud"
```

## Архитектура
```mermaid
flowchart LR
  Bus -->|ingest| Cloud
  Admin -->|CRUD| Cloud
  View -->|read| Cloud
  Cloud --> DB[(PostgreSQL)]
```
