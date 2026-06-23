const https = require('https');
const fs = require('fs');

console.log('🔍 ПРОВЕРКА GOOGLE FAVICON FIX\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Проверка локальных файлов
console.log('📁 ЛОКАЛЬНЫЕ ФАЙЛЫ:\n');

const localChecks = [
  { path: 'public/favicon.ico', required: true, description: 'Корневой favicon для Google' },
  { path: 'public/favicon/favicon.ico', required: true, description: 'Backup favicon' },
  { path: 'app/favicon.ico', required: false, shouldNotExist: true, description: 'ДОЛЖЕН БЫТЬ УДАЛЁН' },
];

localChecks.forEach(check => {
  const exists = fs.existsSync(check.path);
  
  if (check.shouldNotExist) {
    if (!exists) {
      console.log(`   ✅ ${check.path} — УДАЛЁН (${check.description})`);
    } else {
      console.log(`   ❌ ${check.path} — СУЩЕСТВУЕТ! КОНФЛИКТ! (${check.description})`);
      const stats = fs.statSync(check.path);
      console.log(`      Размер: ${(stats.size / 1024).toFixed(2)} KB`);
    }
  } else {
    if (exists) {
      const stats = fs.statSync(check.path);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ✅ ${check.path} — ${sizeKB} KB (${check.description})`);
      
      if (check.path === 'public/favicon.ico' && stats.size > 20 * 1024) {
        console.log(`      ⚠️  ВНИМАНИЕ: Размер >20KB (рекомендуется <15KB для Google)`);
      }
    } else if (check.required) {
      console.log(`   ❌ ${check.path} — НЕ НАЙДЕН! КРИТИЧНО! (${check.description})`);
    }
  }
});

console.log('\n═══════════════════════════════════════════════════════════\n');

// Проверка конфигурации
console.log('⚙️  КОНФИГУРАЦИЯ:\n');

const layoutFile = 'app/layout.tsx';
const configFile = 'next.config.ts';

if (fs.existsSync(layoutFile)) {
  const layoutContent = fs.readFileSync(layoutFile, 'utf-8');
  
  // Должно использовать /favicon.ico (не /favicon/favicon.ico)
  if (layoutContent.includes("{ url: '/favicon.ico'")) {
    console.log('   ✅ app/layout.tsx использует /favicon.ico (корневой путь)');
  } else if (layoutContent.includes("{ url: '/favicon/favicon.ico'")) {
    console.log('   ⚠️  app/layout.tsx использует /favicon/favicon.ico (не оптимально для Google)');
  } else {
    console.log('   ❌ app/layout.tsx не содержит правильный favicon путь');
  }
  
  if (layoutContent.includes("shortcut: '/favicon.ico'")) {
    console.log('   ✅ app/layout.tsx shortcut указывает на /favicon.ico');
  }
}

if (fs.existsSync(configFile)) {
  const configContent = fs.readFileSync(configFile, 'utf-8');
  
  // НЕ должно быть redirect для /favicon.ico
  if (!configContent.includes("source: '/favicon.ico'")) {
    console.log('   ✅ next.config.ts НЕ содержит redirect для /favicon.ico (правильно!)');
  } else {
    console.log('   ⚠️  next.config.ts содержит redirect для /favicon.ico (лишний запрос!)');
  }
}

console.log('\n═══════════════════════════════════════════════════════════\n');

// Проверка production
console.log('🌐 PRODUCTION ПРОВЕРКА:\n');
console.log('   Проверяю доступность на production...\n');

async function checkUrl(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      // Читаем тело ответа для получения размера
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const size = Buffer.concat(data).length;
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          contentLength: res.headers['content-length'] || size,
          location: res.headers['location'],
        });
      });
    }).on('error', () => {
      resolve({ url, status: 'ERROR' });
    });
  });
}

async function checkProduction() {
  // 1. Проверка /favicon.ico (КРИТИЧНО)
  console.log('   📍 КРИТИЧЕСКАЯ ПРОВЕРКА: /favicon.ico\n');
  
  const faviconRoot = await checkUrl('https://miss-kurochka.com/favicon.ico');
  
  if (faviconRoot.status === 200) {
    console.log('   ✅ https://miss-kurochka.com/favicon.ico');
    console.log(`      Status: ${faviconRoot.status} (прямой доступ без redirect!)`);
    console.log(`      Content-Type: ${faviconRoot.contentType}`);
    console.log(`      Size: ${(faviconRoot.contentLength / 1024).toFixed(2)} KB`);
    
    if (faviconRoot.contentLength < 20 * 1024) {
      console.log('      ✅ Размер оптимален для Google (<20KB)');
    } else {
      console.log('      ⚠️  Размер большой (>20KB), может быть проблемой для Google');
    }
  } else if (faviconRoot.status === 308 || faviconRoot.status === 301) {
    console.log('   ⚠️  https://miss-kurochka.com/favicon.ico');
    console.log(`      Status: ${faviconRoot.status} REDIRECT`);
    console.log(`      Location: ${faviconRoot.location}`);
    console.log('      ⚠️  ПРОБЛЕМА: Google предпочитает прямой доступ без redirect!');
  } else {
    console.log('   ❌ https://miss-kurochka.com/favicon.ico');
    console.log(`      Status: ${faviconRoot.status}`);
    console.log('      ❌ КРИТИЧНО: Favicon недоступен!');
  }
  
  console.log('\n   📍 Дополнительные пути:\n');
  
  // 2. Проверка backup путей
  const urls = [
    'https://miss-kurochka.com/favicon/favicon.ico',
    'https://miss-kurochka.com/favicon/favicon.svg',
    'https://miss-kurochka.com/favicon/site.webmanifest',
  ];
  
  for (const url of urls) {
    const result = await checkUrl(url);
    
    const isGood = result.status === 200;
    const icon = isGood ? '✅' : '❌';
    
    console.log(`   ${icon} ${url}`);
    console.log(`      Status: ${result.status}`);
    
    if (result.contentType) {
      console.log(`      Content-Type: ${result.contentType}`);
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // 3. Google S2 API check
  console.log('🔍 GOOGLE S2 FAVICON API:\n');
  
  const googleS2 = await checkUrl('https://www.google.com/s2/favicons?sz=64&domain=miss-kurochka.com');
  
  console.log('   URL: https://www.google.com/s2/favicons?sz=64&domain=miss-kurochka.com');
  console.log(`   Status: ${googleS2.status}`);
  console.log(`   Size: ${googleS2.contentLength} bytes`);
  
  // Размер дефолтного глобуса Google ~280-350 bytes
  // Наш favicon должен быть ~15KB
  if (googleS2.contentLength < 500) {
    console.log('   ❌ Возвращается дефолтный ГЛОБУС (размер ~280-350 bytes)');
    console.log('   ⏰ Google ещё не проиндексировал новый favicon');
    console.log('   📅 Ожидаемое время: 3-7 дней после deploy');
  } else {
    console.log('   ✅ Возвращается НАШ FAVICON!');
    console.log('   🎉 Google успешно проиндексировал favicon!');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  // Итоговый отчёт
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ:\n');
  
  const checks = {
    localFiles: fs.existsSync('public/favicon.ico') && !fs.existsSync('app/favicon.ico'),
    rootAccess: faviconRoot.status === 200,
    noRedirect: faviconRoot.status === 200 && !faviconRoot.location,
    rightSize: faviconRoot.contentLength && faviconRoot.contentLength < 20 * 1024,
    backupPaths: true, // упрощение для отчёта
  };
  
  if (checks.localFiles && checks.rootAccess && checks.noRedirect && checks.rightSize) {
    console.log('   ✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
    console.log('   ✅ Favicon оптимизирован для Google');
    console.log('   ✅ Прямой доступ без redirect');
    console.log('   ✅ Размер под лимитом');
    console.log('   ✅ Конфликтующие файлы удалены\n');
    
    if (googleS2.contentLength < 500) {
      console.log('   ⏰ ОЖИДАНИЕ ИНДЕКСАЦИИ GOOGLE:');
      console.log('   - Запросите переиндексацию в Google Search Console');
      console.log('   - Ожидаемое время: 3-7 дней');
      console.log('   - Проверяйте Google S2 API ежедневно');
    } else {
      console.log('   🎉 FAVICON УЖЕ ПРОИНДЕКСИРОВАН GOOGLE!');
    }
  } else {
    console.log('   ⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:\n');
    
    if (!checks.localFiles) {
      console.log('   ❌ Проблемы с локальными файлами');
    }
    if (!checks.rootAccess) {
      console.log('   ❌ Favicon недоступен в корне');
    }
    if (!checks.noRedirect) {
      console.log('   ❌ Есть redirect (нужен прямой доступ)');
    }
    if (!checks.rightSize) {
      console.log('   ❌ Favicon слишком большой');
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  console.log('📚 СЛЕДУЮЩИЕ ШАГИ:\n');
  console.log('   1. Откройте test-favicon-visual.html для визуальной проверки');
  console.log('   2. Проверьте favicon на читаемость на 16x16');
  console.log('   3. Откройте Google Search Console');
  console.log('   4. Запросите переиндексацию для miss-kurochka.com');
  console.log('   5. Проверяйте Google S2 API через несколько дней\n');
  
  console.log('📖 Подробная документация: GOOGLE_FAVICON_FIX.md\n');
}

checkProduction().catch(console.error);
