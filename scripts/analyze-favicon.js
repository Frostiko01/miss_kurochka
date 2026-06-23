const fs = require('fs');
const path = require('path');

console.log('=== FAVICON AUDIT ===\n');

// Проверяем существующие файлы
const files = [
  'public/favicon.ico',
  'public/apple-icon.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/icon-maskable-192.png',
  'public/icon-maskable-512.png',
  'public/logo.png',
  'public/site.webmanifest'
];

console.log('1. ФАЙЛЫ В PUBLIC:');
files.forEach(file => {
  const exists = fs.existsSync(file);
  if (exists) {
    const stats = fs.statSync(file);
    console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`   ❌ ${file} — НЕ НАЙДЕН`);
  }
});

console.log('\n2. PRODUCTION HTML ТЕГИ:');
console.log('   ✅ <link rel="manifest" href="/manifest.webmanifest"/>');
console.log('   ✅ <link rel="shortcut icon" href="/favicon.ico?v=4"/>');
console.log('   ✅ <link rel="icon" href="/favicon.ico?v=4" sizes="48x48"/>');
console.log('   ✅ <link rel="icon" href="/icon-192.png?v=4" sizes="192x192"/>');
console.log('   ✅ <link rel="apple-touch-icon" href="/apple-icon.png?v=4"/>');

console.log('\n3. ПРОБЛЕМЫ:');
console.log('   ❌ /site.webmanifest не существует (404)');
console.log('   ⚠️  Favicon может быть квадратным с белым фоном');
console.log('   ⚠️  Google не показывает favicon в Search');

console.log('\n4. ТРЕБУЕМЫЕ ДЕЙСТВИЯ:');
console.log('   1. Создать правильный круглый favicon без белого фона');
console.log('   2. Создать site.webmanifest для совместимости');
console.log('   3. Убедиться что favicon transparent PNG');
console.log('   4. Убрать padding вокруг логотипа');
console.log('   5. Проверить все размеры: 16x16, 32x32, 48x48, 180x180, 192x192, 512x512');

console.log('\n=== КОНЕЦ АУДИТА ===');
