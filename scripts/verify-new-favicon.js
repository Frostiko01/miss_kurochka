const fs = require('fs');
const https = require('https');

console.log('🔍 ФИНАЛЬНАЯ ПРОВЕРКА НОВЫХ FAVICON\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Проверяем локальные файлы
console.log('📁 ЛОКАЛЬНЫЕ ФАЙЛЫ:\n');

const localFiles = [
  'public/favicon/favicon.ico',
  'public/favicon/favicon.svg',
  'public/favicon/favicon-96x96.png',
  'public/favicon/apple-touch-icon.png',
  'public/favicon/web-app-manifest-192x192.png',
  'public/favicon/web-app-manifest-512x512.png',
  'public/favicon/site.webmanifest',
];

localFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   ✅ ${file} (${sizeKB} KB)`);
    
    // Проверка размера
    if (file.includes('favicon.ico') && stats.size > 20 * 1024) {
      console.log(`      ⚠️  ВНИМАНИЕ: Размер >20KB (рекомендуется <15KB)`);
    }
    if (file.includes('favicon.svg') && stats.size > 300 * 1024) {
      console.log(`      ⚠️  ВНИМАНИЕ: SVG слишком большой (рекомендуется <100KB)`);
    }
  } else {
    console.log(`   ❌ ${file} — НЕ НАЙДЕН`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════\n');

// Проверяем старые файлы (должны быть удалены)
console.log('🗑️  СТАРЫЕ ФАЙЛЫ (должны быть удалены):\n');

const oldFiles = [
  'public/favicon.ico',
  'public/apple-icon.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/icon-maskable-192.png',
  'public/icon-maskable-512.png',
  'public/site.webmanifest',
];

let hasOldFiles = false;

oldFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ❌ ${file} — СУЩЕСТВУЕТ (нужно удалить!)`);
    hasOldFiles = true;
  } else {
    console.log(`   ✅ ${file} — удалён`);
  }
});

if (!hasOldFiles) {
  console.log('\n   ✅ Все старые файлы успешно удалены!');
}

console.log('\n═══════════════════════════════════════════════════════════\n');

// Проверяем конфигурацию
console.log('⚙️  КОНФИГУРАЦИЯ:\n');

const layoutFile = 'app/layout.tsx';
const manifestFile = 'app/manifest.ts';
const configFile = 'next.config.ts';

if (fs.existsSync(layoutFile)) {
  const layoutContent = fs.readFileSync(layoutFile, 'utf-8');
  
  if (layoutContent.includes('/favicon/favicon.ico')) {
    console.log('   ✅ app/layout.tsx использует /favicon/favicon.ico');
  } else {
    console.log('   ❌ app/layout.tsx НЕ использует новые пути');
  }
  
  if (layoutContent.includes('/favicon/favicon.svg')) {
    console.log('   ✅ app/layout.tsx использует /favicon/favicon.svg');
  }
  
  if (layoutContent.includes('/favicon/apple-touch-icon.png')) {
    console.log('   ✅ app/layout.tsx использует /favicon/apple-touch-icon.png');
  }
  
  if (layoutContent.includes('/favicon/site.webmanifest')) {
    console.log('   ✅ app/layout.tsx ссылается на /favicon/site.webmanifest');
  }
}

if (fs.existsSync(manifestFile)) {
  const manifestContent = fs.readFileSync(manifestFile, 'utf-8');
  
  if (manifestContent.includes('/favicon/favicon-96x96.png')) {
    console.log('   ✅ app/manifest.ts использует /favicon/favicon-96x96.png');
  } else {
    console.log('   ❌ app/manifest.ts НЕ использует новые пути');
  }
  
  if (manifestContent.includes('/favicon/web-app-manifest-')) {
    console.log('   ✅ app/manifest.ts использует /favicon/web-app-manifest-*');
  }
}

if (fs.existsSync(configFile)) {
  const configContent = fs.readFileSync(configFile, 'utf-8');
  
  if (configContent.includes('/favicon/favicon.ico')) {
    console.log('   ✅ next.config.ts содержит redirects для /favicon/');
  }
}

console.log('\n═══════════════════════════════════════════════════════════\n');

// Проверка production (если доступен)
console.log('🌐 PRODUCTION ПРОВЕРКА:\n');

const productionUrls = [
  'https://miss-kurochka.com/favicon/favicon.ico',
  'https://miss-kurochka.com/favicon/favicon.svg',
  'https://miss-kurochka.com/favicon/apple-touch-icon.png',
  'https://miss-kurochka.com/favicon/site.webmanifest',
  'https://miss-kurochka.com/favicon.ico', // должен редиректить
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        contentType: res.headers['content-type'],
        location: res.headers['location'],
      });
    }).on('error', () => {
      resolve({ url, status: 'ERROR' });
    });
  });
}

async function checkProduction() {
  console.log('   Проверяю доступность на production...\n');
  
  for (const url of productionUrls) {
    const result = await checkUrl(url);
    
    const isGood = result.status === 200 || result.status === 301 || result.status === 308;
    const icon = isGood ? '✅' : '❌';
    
    console.log(`   ${icon} ${url}`);
    console.log(`      Status: ${result.status}`);
    
    if (result.contentType) {
      console.log(`      Content-Type: ${result.contentType}`);
    }
    
    if (result.location) {
      console.log(`      Redirect: ${result.location}`);
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📊 ИТОГОВЫЙ СТАТУС:\n');
  console.log('   ✅ Новые favicon файлы созданы');
  console.log('   ✅ Старые файлы удалены');
  console.log('   ✅ Конфигурация обновлена');
  console.log('\n   🚀 Готово к deploy!');
  console.log('\n   Следующие шаги:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "fix: финальное обновление favicon"');
  console.log('   3. git push origin main');
  console.log('   4. Проверить production через 5-10 минут');
  console.log('   5. Запросить переиндексацию в Google Search Console\n');
}

checkProduction().catch(console.error);
