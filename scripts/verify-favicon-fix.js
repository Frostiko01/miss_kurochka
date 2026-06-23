const https = require('https');

console.log('🔍 ПРОВЕРКА ИСПРАВЛЕНИЙ FAVICON\n');

const checks = [
  { name: 'favicon.ico', url: 'https://miss-kurochka.com/favicon.ico' },
  { name: 'favicon-16x16.png', url: 'https://miss-kurochka.com/favicon-16x16.png' },
  { name: 'favicon-32x32.png', url: 'https://miss-kurochka.com/favicon-32x32.png' },
  { name: 'apple-touch-icon.png', url: 'https://miss-kurochka.com/apple-touch-icon.png' },
  { name: 'icon-192.png', url: 'https://miss-kurochka.com/icon-192.png' },
  { name: 'icon-512.png', url: 'https://miss-kurochka.com/icon-512.png' },
  { name: 'manifest.webmanifest', url: 'https://miss-kurochka.com/manifest.webmanifest' },
  { name: 'site.webmanifest (redirect)', url: 'https://miss-kurochka.com/site.webmanifest' },
];

async function checkUrl(check) {
  return new Promise((resolve) => {
    https.get(check.url, (res) => {
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
      });
      res.on('end', () => {
        resolve({
          name: check.name,
          url: check.url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          size: (size / 1024).toFixed(2) + ' KB',
          location: res.headers['location'] || null,
        });
      });
    }).on('error', (err) => {
      resolve({
        name: check.name,
        url: check.url,
        status: 'ERROR',
        error: err.message,
      });
    });
  });
}

async function runChecks() {
  console.log('Проверяю файлы на production...\n');
  
  let allGood = true;

  for (const check of checks) {
    const result = await checkUrl(check);
    
    const isGood = result.status === 200 || (result.name.includes('redirect') && result.status === 301);
    const icon = isGood ? '✅' : '❌';
    
    if (!isGood) allGood = false;
    
    console.log(`${icon} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status}`);
    
    if (result.contentType) {
      console.log(`   Content-Type: ${result.contentType}`);
    }
    
    if (result.size && result.status === 200) {
      console.log(`   Size: ${result.size}`);
      
      // Проверка размера
      const sizeKB = parseFloat(result.size);
      if (result.name === 'favicon.ico' && sizeKB > 10) {
        console.log(`   ⚠️  ВНИМАНИЕ: Размер слишком большой! Рекомендуется <10KB`);
      }
    }
    
    if (result.location) {
      console.log(`   Redirect: ${result.location}`);
    }
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    
    console.log('');
  }

  console.log('─'.repeat(60));
  
  if (allGood) {
    console.log('✅ ВСЕ ФАЙЛЫ ДОСТУПНЫ!\n');
    console.log('Следующие шаги:');
    console.log('1. Запросить переиндексацию в Google Search Console');
    console.log('2. Проверить favicon через https://realfavicongenerator.net/favicon_checker');
    console.log('3. Подождать 1-2 недели для индексации Google');
  } else {
    console.log('❌ ЕСТЬ ПРОБЛЕМЫ!\n');
    console.log('Проверьте что:');
    console.log('1. Файлы созданы в public/');
    console.log('2. Проект задеплоен на production');
    console.log('3. Кэш CDN очищен');
  }
}

runChecks().catch(console.error);
