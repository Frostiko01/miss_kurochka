#!/bin/sh
set -e

# ============================================
# Entrypoint для production-контейнера Miss Kurochka
# Синхронизирует схему БД перед запуском приложения,
# чтобы прод-база всегда соответствовала prisma/schema.prisma
# (новые таблицы mini_combos, newsletter_subscribers и
# колонки mini_combo_id появляются автоматически).
# ============================================

echo "==> Синхронизация схемы базы данных (prisma db push)..."

# Пробуем несколько раз — БД может быть ещё не готова сразу после старта.
# Флаг --accept-data-loss НЕ используем: нужные изменения аддитивные
# (новые таблицы + nullable-колонки). Если push потребует удаления данных —
# он безопасно прервётся, а не уничтожит данные молча.
ok=0
for i in 1 2 3 4 5; do
  if node node_modules/prisma/build/index.js db push \
      --schema=prisma/schema.prisma \
      --url "$DATABASE_URL"; then
    ok=1
    break
  fi
  echo "prisma db push: попытка $i не удалась, повтор через 5с..."
  sleep 5
done

if [ "$ok" != "1" ]; then
  echo "!! Не удалось синхронизировать схему БД. Запускаем приложение всё равно."
fi

echo "==> Запуск приложения..."
exec node server.js
