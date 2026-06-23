#!/bin/bash

# Скрипт для обновления паролей филиалов на production
# Использование: ./scripts/update-production-passwords.sh

echo "🔐 Обновление паролей филиалов на Production"
echo "=============================================="
echo ""

# Проверка наличия production DATABASE_URL
if [ -z "$PRODUCTION_DATABASE_URL" ]; then
  echo "⚠️  PRODUCTION_DATABASE_URL не установлен!"
  echo ""
  echo "Установите переменную окружения:"
  echo "export PRODUCTION_DATABASE_URL='postgresql://...'"
  echo ""
  echo "Или запустите скрипт так:"
  echo "PRODUCTION_DATABASE_URL='postgresql://...' ./scripts/update-production-passwords.sh"
  echo ""
  exit 1
fi

# Сохранить текущий DATABASE_URL
ORIGINAL_DATABASE_URL=$DATABASE_URL

# Временно использовать production URL
export DATABASE_URL=$PRODUCTION_DATABASE_URL

echo "✅ Используется production база данных"
echo ""

# Запустить скрипт обновления
npx tsx scripts/set-branch-password.ts

# Вернуть оригинальный DATABASE_URL
export DATABASE_URL=$ORIGINAL_DATABASE_URL

echo ""
echo "✅ Готово! Пароли обновлены на production"
echo ""
echo "Проверьте вход на:"
echo "https://miss-kurochka.com/branch/signin"
echo ""
echo "Логины: branch1@gmail.com, branch2@gmail.com, branch3@gmail.com"
echo "Пароль: 123123"
