const fs = require('fs');
const https = require('https');

console.log('=== ПРОВЕРКА FAVICON НА PRODUCTION ===\n');

const checks = [
  { url: 'https://miss-kurochka.com/favicon.ico', expected: 200 },
  { url: 'https://miss-kurochka.com/apple-icon.png', expected: 200 },
  { url: 'https://miss-kurochka.com/icon-192.png', expected: 200 },
  { url: 'https://miss-kurochka.com/icon-512.png', expected: 200 },
  { url: 'https://miss-kurochka.com/manifest.webmanifest', expected: 200 },
  { url: 'https://miss-kurochka.com/site.webmanifest', expected: 200 },
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode, headers: res.headers });
    }).on('error', (err) => {
      resolve({ url, status: 'ERROR', error: err.message });
    });
  });
}

async function runChecks() {
  console.log('Проверяю доступность файлов на production...\n');
  
  for (const check of checks) {
    const result = await checkUrl(check.url);
    const icon = result.status === check.expected ? '✅' : '❌';
    console.log(`${icon} ${check.url}`);
    console.log(`   Status: ${result.status}`);
    if (result.headers && result.headers['content-type']) {
      console.log(`   Content-Type: ${result.headers['content-type']}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }

  console.log('=== ДИАГНОСТИКА GOOGLE FAVICON ===\n');
  console.log('Возможные причины почему Google не показывает favicon:');
  console.log('1. ⏰ Favicon недавно обновлен — Google нужно 1-2 недели');
  console.log('2. 🔍 Google еще не переиндексировал страницу');
  console.log('3. 🖼️  Favicon имеет белый фон/padding — не соответствует дизайну');
  console.log('4. 📦 Favicon слишком большой (>100KB)');
  console.log('5. 🎨 Favicon не квадратный или неправильный формат');
  console.log('6. 📋 site.webmanifest не доступен (404)');
  console.log('7. 🔄 Кэш CDN не обновился');
  console.log('\nРешение:');
  console.log('✅ Создать правильный favicon: круглый, transparent, без padding');
  console.log('✅ Создать site.webmanifest для обратной совместимости');
  console.log('✅ Убрать версионирование ?v=4 из основных тегов');
  console.log('✅ Запросить переиндексацию в Google Search Console');
}

runChecks().catch(console.error);
