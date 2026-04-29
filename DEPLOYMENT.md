# 🚀 Развертывание Miss Kurochka PWA

## 📋 Предварительные требования

- Node.js 18+ 
- PostgreSQL 14+
- Git
- Домен (для продакшена)

## 🔧 Локальная разработка

См. [QUICKSTART.md](./QUICKSTART.md)

## 🌐 Развертывание на Vercel

### 1. Подготовка

```bash
# Убедитесь, что проект в Git
git init
git add .
git commit -m "Initial commit"

# Отправьте на GitHub/GitLab
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Настройка базы данных

Используйте один из вариантов:

#### Вариант A: Vercel Postgres
```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите
vercel login

# Создайте Postgres базу
vercel postgres create
```

#### Вариант B: Внешний PostgreSQL (Supabase, Railway, Neon)

**Supabase** (рекомендуется):
1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Скопируйте Connection String из Settings → Database

**Railway**:
1. Зайдите на [railway.app](https://railway.app)
2. New Project → Provision PostgreSQL
3. Скопируйте DATABASE_URL

**Neon**:
1. Зайдите на [neon.tech](https://neon.tech)
2. Создайте проект
3. Скопируйте Connection String

### 3. Развертывание на Vercel

```bash
# Импортируйте проект
vercel

# Или через веб-интерфейс:
# 1. Зайдите на vercel.com
# 2. Import Git Repository
# 3. Выберите ваш репозиторий
```

### 4. Настройка переменных окружения

В Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

### 5. Применение миграций

```bash
# Локально с продакшен БД
DATABASE_URL="your-production-url" npm run db:migrate:deploy

# Или через Vercel CLI
vercel env pull .env.production
npm run db:migrate:deploy
```

### 6. Заполнение данными (опционально)

```bash
DATABASE_URL="your-production-url" npm run db:seed
```

## 🐳 Развертывание с Docker

### 1. Создайте Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Обновите next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

### 3. Создайте docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: kurochka
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: miss_kurochka
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://kurochka:your_password@postgres:5432/miss_kurochka
      NEXT_PUBLIC_API_URL: http://localhost:3000
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### 4. Запуск

```bash
# Соберите и запустите
docker-compose up -d

# Примените миграции
docker-compose exec app npx prisma migrate deploy

# Заполните данными
docker-compose exec app npm run db:seed
```

## 🖥️ Развертывание на VPS (Ubuntu)

### 1. Подготовка сервера

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установите PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установите Nginx
sudo apt install -y nginx

# Установите PM2
sudo npm install -g pm2
```

### 2. Настройка PostgreSQL

```bash
# Войдите в PostgreSQL
sudo -u postgres psql

# Создайте базу и пользователя
CREATE DATABASE miss_kurochka;
CREATE USER kurochka_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE miss_kurochka TO kurochka_user;
\q
```

### 3. Клонирование проекта

```bash
# Создайте директорию
sudo mkdir -p /var/www/miss-kurochka
sudo chown $USER:$USER /var/www/miss-kurochka

# Клонируйте репозиторий
cd /var/www/miss-kurochka
git clone <your-repo-url> .

# Установите зависимости
npm install

# Создайте .env
cp .env.example .env
nano .env
```

### 4. Настройка .env

```env
DATABASE_URL="postgresql://kurochka_user:your_secure_password@localhost:5432/miss_kurochka"
NEXT_PUBLIC_API_URL=https://your-domain.com
NODE_ENV=production
```

### 5. Сборка и миграции

```bash
# Примените миграции
npm run db:migrate:deploy

# Заполните данными (опционально)
npm run db:seed

# Соберите проект
npm run build
```

### 6. Настройка PM2

```bash
# Запустите приложение
pm2 start npm --name "miss-kurochka" -- start

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Проверьте статус
pm2 status
pm2 logs miss-kurochka
```

### 7. Настройка Nginx

```bash
# Создайте конфигурацию
sudo nano /etc/nginx/sites-available/miss-kurochka
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/miss-kurochka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Настройка SSL (Let's Encrypt)

```bash
# Установите Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автообновление
sudo certbot renew --dry-run
```

## 🔄 Обновление приложения

### Vercel
```bash
# Просто отправьте изменения в Git
git add .
git commit -m "Update"
git push

# Vercel автоматически развернет
```

### VPS
```bash
cd /var/www/miss-kurochka

# Получите изменения
git pull

# Установите новые зависимости
npm install

# Примените миграции
npm run db:migrate:deploy

# Пересоберите
npm run build

# Перезапустите PM2
pm2 restart miss-kurochka
```

## 📊 Мониторинг

### PM2 Monitoring
```bash
pm2 monit
pm2 logs miss-kurochka
pm2 status
```

### Логи Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL
```bash
# Подключитесь к БД
psql -U kurochka_user -d miss_kurochka

# Проверьте размер БД
SELECT pg_size_pretty(pg_database_size('miss_kurochka'));

# Активные соединения
SELECT count(*) FROM pg_stat_activity;
```

## 🔐 Безопасность

### Checklist
- ✅ Используйте сильные пароли для БД
- ✅ Настройте SSL/HTTPS
- ✅ Ограничьте доступ к PostgreSQL (только localhost)
- ✅ Настройте firewall (ufw)
- ✅ Регулярно обновляйте зависимости
- ✅ Настройте резервное копирование БД
- ✅ Используйте переменные окружения для секретов

### Firewall (UFW)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### Резервное копирование БД
```bash
# Создайте backup
pg_dump -U kurochka_user miss_kurochka > backup_$(date +%Y%m%d).sql

# Восстановите из backup
psql -U kurochka_user miss_kurochka < backup_20260424.sql

# Автоматический backup (cron)
crontab -e
# Добавьте: 0 2 * * * pg_dump -U kurochka_user miss_kurochka > /backups/backup_$(date +\%Y\%m\%d).sql
```

## 🆘 Troubleshooting

### Ошибка подключения к БД
```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Проверьте подключение
psql -U kurochka_user -d miss_kurochka -h localhost
```

### Приложение не запускается
```bash
# Проверьте логи PM2
pm2 logs miss-kurochka --lines 100

# Проверьте порт
sudo lsof -i :3000
```

### Nginx ошибки
```bash
# Проверьте конфигурацию
sudo nginx -t

# Перезапустите
sudo systemctl restart nginx
```

## 📚 Дополнительные ресурсы

- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
