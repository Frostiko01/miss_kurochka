#!/bin/bash
# Скрипт для deploy новых favicon

echo "🚀 DEPLOY НОВЫХ FAVICON"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Проверка изменений
echo "📊 Проверяю изменения..."
git status --short
echo ""

# 2. Добавление файлов
echo "📦 Добавляю файлы..."
git add app/layout.tsx
git add app/manifest.ts
git add next.config.ts
git add README.md
git add public/favicon/
git add scripts/verify-new-favicon.js
git add FAVICON_FINAL_REPORT.md
git add FAVICON_AUDIT_REPORT.md
git add FAVICON_FIX_INSTRUCTIONS.md
git add EXECUTIVE_SUMMARY.md
git add COMMIT_CHANGES.md
git add "НАЧНИТЕ_ОТСЮДА.md"

# Удаление старых файлов
echo "🗑️  Удаляю старые файлы..."
git rm public/apple-icon.png
git rm public/favicon.ico
git rm public/icon-192.png
git rm public/icon-512.png
git rm public/icon-maskable-192.png
git rm public/icon-maskable-512.png
git rm public/site.webmanifest 2>/dev/null || true
git rm public/favicon-production-check.ico 2>/dev/null || true

echo ""
echo "✅ Файлы добавлены!"
echo ""

# 3. Commit
echo "💾 Создаю commit..."
git commit -m "fix: финальное обновление favicon для Google Search indexing

Проблема: Google Search не показывает favicon

Исправления:
- Установлены новые оптимизированные favicon в /favicon/
- favicon.ico уменьшен с 87KB до 14.73KB (оптимизация!)
- Добавлен SVG favicon для современных браузеров
- Обновлены все пути в layout.tsx и manifest.ts
- Добавлены redirects для обратной совместимости
- Настроены правильные Cache-Control headers
- Удалены старые конфликтующие favicon из public/
- Обновлён site.webmanifest с правильной информацией

Новая структура:
- /favicon/favicon.ico (14.73 KB) ← оптимизирован!
- /favicon/favicon.svg (векторный, 276 KB)
- /favicon/apple-touch-icon.png (34.82 KB)
- /favicon/favicon-96x96.png (12.10 KB)
- /favicon/web-app-manifest-192x192.png (39.03 KB)
- /favicon/web-app-manifest-512x512.png (216.19 KB)
- /favicon/site.webmanifest (обновлён)

Redirects для обратной совместимости:
- /favicon.ico → /favicon/favicon.ico (301)
- /site.webmanifest → /favicon/site.webmanifest (301)
- /manifest.webmanifest → /favicon/site.webmanifest (301)
- /apple-touch-icon.png → /favicon/apple-touch-icon.png (301)

Изменённые файлы:
- app/layout.tsx: обновлены пути favicon на /favicon/
- app/manifest.ts: обновлены иконки PWA
- next.config.ts: добавлены redirects и headers
- public/favicon/site.webmanifest: обновлён контент

Удалённые файлы (конфликты):
- public/favicon.ico (87KB - старый)
- public/apple-icon.png
- public/icon-*.png
- public/site.webmanifest

Следующие шаги:
1. Deploy на production
2. Проверить: node scripts/verify-new-favicon.js
3. Запросить переиндексацию в Google Search Console
4. Проверить отображение через 1-2 недели

Документация:
- FAVICON_FINAL_REPORT.md - полный отчёт
- FAVICON_AUDIT_REPORT.md - первичный аудит
- FAVICON_FIX_INSTRUCTIONS.md - инструкции
- scripts/verify-new-favicon.js - скрипт проверки

Автор: Kiro AI
Дата: 23.06.2026"

echo ""
echo "✅ Commit создан!"
echo ""

# 4. Push
echo "🚀 Push на origin/main..."
git push origin main

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOY ЗАВЕРШЁН!"
echo ""
echo "Следующие шаги:"
echo "1. Дождитесь deployment (5-10 минут)"
echo "2. Запустите: node scripts/verify-new-favicon.js"
echo "3. Проверьте вручную:"
echo "   - https://miss-kurochka.com/favicon/favicon.ico"
echo "   - https://miss-kurochka.com/favicon/site.webmanifest"
echo "4. Запросите переиндексацию в Google Search Console"
echo "5. Проверьте через 1-2 недели отображение в Google Search"
echo ""
echo "📖 Полный отчёт: FAVICON_FINAL_REPORT.md"
echo ""
