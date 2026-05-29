# ============================================
# Dockerfile для Miss Kurochka (Next.js 16)
# Оптимизирован для Timeweb App Platform
# ============================================

# Этап 1: Установка зависимостей
FROM node:20-alpine AS deps

# Устанавливаем необходимые системные зависимости
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm ci --legacy-peer-deps

# ============================================
# Этап 2: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем node_modules из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules

# Копируем весь код проекта
COPY . .

# Устанавливаем фиктивные переменные окружения для сборки
# Реальные значения будут переданы при запуске контейнера
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret-key-min-32-chars"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
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
FROM node:20-alpine AS runner

WORKDIR /app

# Устанавливаем необходимые системные зависимости для production
RUN apk add --no-cache openssl

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы из builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Копируем Prisma схему и миграции для возможности запуска миграций
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

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

# Запускаем приложение
CMD ["node", "server.js"]
