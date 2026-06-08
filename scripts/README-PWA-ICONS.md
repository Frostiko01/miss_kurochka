# Исправление иконок PWA

## Проблема
Иконка сайта при добавлении на рабочий стол телефона (PWA/ярлык) обрезалась некорректно: по бокам, сверху и снизу торчали красные части круглого логотипа.

## Решение
Создан скрипт `fix-pwa-icons.js`, который:

1. **Берёт исходный логотип** `public/logo.png`
2. **Добавляет белый padding**:
   - Для обычных иконок (`icon-*.png`, `apple-icon.png`): **15% отступ**
   - Для maskable иконок (`icon-maskable-*.png`): **20% отступ** (для Android adaptive icons)
3. **Создаёт оптимизированные иконки**:
   - `icon-512.png` — 512×512px (для Android)
   - `icon-192.png` — 192×192px (для Android)
   - `apple-icon.png` — 180×180px (для iOS)
   - `icon-maskable-512.png` — 512×512px maskable (для Android adaptive)
   - `icon-maskable-192.png` — 192×192px maskable (для Android adaptive)

## Обновлённые файлы

### 1. `scripts/fix-pwa-icons.js`
Новый скрипт для генерации иконок с padding.

### 2. `app/manifest.ts`
Обновлены пути к иконкам с версией `?v=3` для cache busting:
```typescript
icons: [
  { src: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icon-512.png?v=3', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/icon-maskable-192.png?v=3', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
  { src: '/icon-maskable-512.png?v=3', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
]
```

### 3. `app/layout.tsx`
Обновлены мета-теги для иконок:
```typescript
icons: {
  icon: [
    { url: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png' },
    { url: '/icon-512.png?v=3', sizes: '512x512', type: 'image/png' },
  ],
  apple: [
    { url: '/apple-icon.png?v=3', sizes: '180x180', type: 'image/png' },
  ],
}
```

### 4. `public/sw.js`
- Обновлена версия Service Worker: `v1.0.0` → `v1.0.1`
- Добавлены новые иконки в список предзагрузки

### 5. Иконки в `public/`
Перезаписаны файлы:
- `icon-512.png` — теперь с белым padding 15%
- `icon-192.png` — теперь с белым padding 15%
- `apple-icon.png` — теперь с белым padding 15%
- `icon-maskable-512.png` — теперь с белым padding 20%
- `icon-maskable-192.png` — теперь с белым padding 20%

## Как использовать

### Повторная генерация иконок
Если нужно обновить логотип и пересоздать все иконки:

```bash
# 1. Замените файл public/logo.png на новый логотип
# 2. Запустите скрипт
node scripts/fix-pwa-icons.js
```

### Проверка на телефоне

#### Android (Chrome/Edge/Samsung Internet):
1. Откройте сайт в браузере
2. Меню → "Добавить на главный экран" / "Install app"
3. Иконка должна корректно отображаться с белым фоном без обрезания

#### iOS (Safari):
1. Откройте сайт в Safari
2. Нажмите кнопку "Поделиться" (квадрат со стрелкой вверх)
3. "Добавить на экран «Домой»"
4. Иконка должна корректно отображаться с белым фоном без обрезания

#### Очистка кэша:
Если старая иконка всё ещё отображается:
1. **Android**: Удалите приложение с главного экрана → очистите кэш браузера → добавьте снова
2. **iOS**: Удалите иконку с домашнего экрана → закройте Safari полностью → откройте заново → добавьте снова

## Технические детали

### Почему 15% и 20% padding?

- **15% padding** (обычные иконки): Безопасная зона для iOS и большинства Android-лаунчеров
- **20% padding** (maskable иконки): [Спецификация maskable icons](https://w3c.github.io/manifest/#icon-masks) требует, чтобы важный контент находился в центральном круге диаметром 80% (то есть 10% отступ с каждой стороны). Мы используем 20% для дополнительной безопасности.

### Белый фон vs прозрачный

Используется **белый непрозрачный фон** потому что:
- iOS не поддерживает прозрачные иконки (заменяет на чёрный)
- Белый фон хорошо сочетается с дизайном бренда Miss Kurochka
- Обеспечивает консистентный вид на всех платформах

### Cache Busting

Версия `?v=3` добавлена ко всем путям иконок, чтобы:
- Браузеры скачали новые версии, игнорируя старый кэш
- Service Worker обновил кэш с новыми иконками

## Зависимости

Скрипт использует библиотеку **sharp** (уже установлена в проекте через Next.js):
```json
{
  "dependencies": {
    "sharp": "^0.34.5"
  }
}
```

## Troubleshooting

### Иконки не обновляются на телефоне
1. Удалите приложение/иконку с главного экрана
2. Очистите кэш браузера (Chrome: Settings → Privacy → Clear browsing data)
3. Закройте браузер полностью
4. Откройте сайт снова и добавьте на главный экран

### Ошибка "Cannot find module 'sharp'"
```bash
npm install sharp
```

### Скрипт не находит logo.png
Убедитесь, что файл `public/logo.png` существует и имеет правильный формат (PNG).

## Дополнительные ресурсы

- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [PWA Icon Generator](https://maskable.app/editor) — онлайн-инструмент для тестирования maskable icons
- [Apple Human Interface Guidelines — App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
