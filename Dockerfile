# ============================================
# Dockerfile для Miss Kurochka (Next.js 16)
# Оптимизирован для Timeweb App Platform
#
# Используется Debian-based образ node:20-slim вместо Alpine.
# Причина: сборочная сеть Timeweb стабильно не может достучаться
# до dl-cdn.alpinelinux.org (DNS: transient error), из-за чего
# apk не скачивает индекс пакетов и падает с "no such package".
# Debian тянет пакеты с deb.debian.org, glibc уже встроен
# (libc6-compat не нужен), а openssl ставится из репозитория Debian.
#
# CACHE-BUST: 2026-06-05-v2 (форсируем чистую пересборку без Alpine-кэша)
# ============================================

# Этап 1: Установка зависимостей
FROM node:20-slim AS deps

# openssl нужен Prisma; ca-certificates — для HTTPS.
# Retry на случай временных сетевых сбоев при сборке.
RUN set -eux; \
    ok=0; \
    for i in 1 2 3 4 5; do \
      if apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates; then ok=1; break; fi; \
      echo "apt-get: попытка $i не удалась, повтор через 5с..."; \
      sleep 5; \
    done; \
    [ "$ok" = "1" ]; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm ci --legacy-peer-deps

# ============================================
# Этап 2: Сборка приложения
FROM node:20-slim AS builder

WORKDIR /app

# openssl нужен Prisma на этапе generate/build
RUN set -eux; \
    ok=0; \
    for i in 1 2 3 4 5; do \
      if apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates; then ok=1; break; fi; \
      echo "apt-get: попытка $i не удалась, повтор через 5с..."; \
      sleep 5; \
    done; \
    [ "$ok" = "1" ]; \
    rm -rf /var/lib/apt/lists/*

# Копируем node_modules из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules

# Копируем весь код проекта
COPY . .

# Устанавливаем фиктивные переменные окружения для сборки
# Реальные значения будут переданы при запуске контейнера
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV NEXTAUTH_URL="https://miss-kurochka.com"
ENV NEXTAUTH_SECRET="build-time-secret-key-min-32-chars"
ENV AUTH_URL="https://miss-kurochka.com"
ENV AUTH_TRUST_HOST="true"
ENV NEXT_PUBLIC_APP_URL="https://miss-kurochka.com"
ENV OPEN_AI="sk-build-time-fake-key"
ENV GOOGLE_CLIENT_ID="build-time-client-id"
ENV GOOGLE_CLIENT_SECRET="build-time-client-secret"
ENV SMTP_HOST="smtp.gmail.com"
ENV SMTP_PORT="587"
ENV SMTP_USER="build@example.com"
ENV SMTP_PASSWORD="build-password"
ENV SMTP_FROM="Build <build@example.com>"
ENV ADMIN_TELEGRAM_BOT_TOKEN="build-token"
ENV ADMIN_TELEGRAM_USER_ID="123456"
ENV FINIK_ENV="beta"
ENV FINIK_API_KEY="build-key"
ENV FINIK_ACCOUNT_ID="build-account"
ENV FINIK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nbuild\n-----END PRIVATE KEY-----"

# Генерируем Prisma Client
RUN npx prisma generate

# Отключаем телеметрию Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем Next.js приложение
RUN npm run build

# ============================================
# Этап 3: Production образ
FROM node:20-slim AS runner

WORKDIR /app

# openssl нужен Prisma в рантайме
RUN set -eux; \
    ok=0; \
    for i in 1 2 3 4 5; do \
      if apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates; then ok=1; break; fi; \
      echo "apt-get: попытка $i не удалась, повтор через 5с..."; \
      sleep 5; \
    done; \
    [ "$ok" = "1" ]; \
    rm -rf /var/lib/apt/lists/*

# Создаем пользователя для безопасности
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Копируем необходимые файлы из builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Копируем Prisma схему и миграции для синхронизации БД при старте.
COPY --from=builder /app/prisma ./prisma

# Копируем ПОЛНЫЙ node_modules из builder.
# Причина: entrypoint выполняет `prisma db push` для синхронизации схемы БД.
# CLI Prisma 7 при старте подтягивает @prisma/config и его зависимости
# (c12, effect, jiti, deepmerge-ts, empathic), которые лежат в корне
# node_modules. Частичное копирование (.prisma/@prisma/prisma) их теряло,
# из-за чего db push молча падал, схема БД оставалась устаревшей, и запросы
# к корзине возвращали 500. Полный node_modules гарантирует наличие и CLI,
# и сгенерированного клиента, и корректного Linux-движка (собран на Debian).
COPY --from=builder /app/node_modules ./node_modules

# Копируем entrypoint-скрипт и делаем исполняемым
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Устанавливаем права доступа
RUN chown -R nextjs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запускаем приложение через entrypoint (синхронизация БД + старт)
CMD ["./docker-entrypoint.sh"]
