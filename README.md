# Cloud API

REST API для сбора и хранения показаний с буровых установок на базе NestJS, Prisma и PostgreSQL.

## Структура данных

### History
Лог снятых показаний, собранных метрик:
- `edge` - идентификатор устройства/буровой установки (string, 100)
- `timestamp` - дата и время снятия показаний (datetime)
- `tag` - идентификатор параметра (string, 100)
- `value` - числовое показание (decimal 16.3)

### Current
Текущие значения показаний, метрик:
- `edge` - идентификатор устройства/буровой установки (string, 100)
- `tag` - идентификатор параметра (string, 100)
- `value` - числовое показание (decimal 16.3)

## API Endpoints

### History
- `GET /history` - получить все записи истории
- `POST /history` - добавить новую запись
- `GET /history/:id` - получить запись по ID
- `PUT /history/:id` - обновить запись
- `DELETE /history/:id` - удалить запись

### Current
- `GET /current` - получить все текущие значения
- `POST /current` - добавить/обновить значение (upsert по edge+tag)
- `GET /current/:id` - получить значение по ID
- `PUT /current/:id` - обновить значение
- `DELETE /current/:id` - удалить значение

## Установка и запуск

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Настройка базы данных
npm run migrate:dev:create
npm run migrate:dev
npm run prisma:generate

# Запуск в режиме разработки
npm run start:dev
```

### Продакшн (Docker)

```bash
# Сборка и запуск через Docker Compose
docker-compose -f docker-compose.portainer.yml up --build
```

## Переменные окружения

Создайте файл `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cloud_db"
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=cloud_db
```

## Миграции

```bash
# Создать новую миграцию
npm run migrate:dev:create

# Применить миграции (разработка)
npm run migrate:dev

# Применить миграции (продакшн)
npm run migrate:deploy

# Генерация Prisma клиента
npm run prisma:generate
```

## Технологии

- **NestJS** - Node.js фреймворк
- **Prisma** - ORM для работы с базой данных
- **PostgreSQL** - база данных
- **Docker** - контейнеризация
