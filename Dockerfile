# Используем официальный Node.js образ
FROM node:22

# Устанавливаем рабочую директорию
WORKDIR /app

# 1. Копируем package.json, package-lock.json и схему Prisma
# Это позволяет кэшировать npm install
COPY package*.json ./
COPY prisma ./prisma/

# 2. Устанавливаем зависимости
RUN npm install

# 3. Генерируем клиент Prisma
# Это необходимо, чтобы клиент был готов до сборки приложения
RUN npm run prisma:generate

# 4. Копируем исходный код приложения
COPY . .

ARG CURRENT_API_BASE_URL

# 5. Собираем приложение (например, TypeScript -> JavaScript)
RUN npm run build

# 6. Команда запуска
# CRITICAL FIX: Сначала запускаем миграции (migrate:deploy), 
# убедившись, что база данных готова, а ЗАТЕМ запускаем само приложение.
CMD ["sh", "-c", "npm run migrate:deploy && npm run start:prod"]
