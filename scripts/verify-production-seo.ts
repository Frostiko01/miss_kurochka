/**
 * Полная проверка SEO конфигурации для production
 * Проверяет все файлы на наличие localhost ссылок
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🔍 ПОЛНАЯ ПРОВЕРКА PRODUCTION SEO КОНФИГУРАЦИИ')
console.log('='.repeat(70))

let hasErrors = false
const expectedDomain = 'https://miss-kurochka.com'
const localhostPatterns = [
  /localhost/gi,
  /127\.0\.0\.1/gi,
  /http:\/\/.*:3000/gi
]

interface CheckResult {
  file: string
  status: 'OK' | 'WARNING' | 'ERROR'
  message: string
}

const results: CheckResult[] = []

// 1. Проверка .env файла
console.log('\n📄 1. Проверка .env файла...')
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8')
  
  // Проверка NEXT_PUBLIC_APP_URL
  const appUrlMatch = envContent.match(/NEXT_PUBLIC_APP_URL=["']?([^"'\n]+)["']?/)
  if (appUrlMatch) {
    const url = appUrlMatch[1]
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      results.push({
        file: '.env',
        status: 'ERROR',
        message: `NEXT_PUBLIC_APP_URL содержит localhost: ${url}`
      })
      hasErrors = true
    } else if (url.endsWith('/')) {
      results.push({
        file: '.env',
        status: 'WARNING',
        message: `NEXT_PUBLIC_APP_URL имеет trailing slash: ${url}`
      })
    } else {
      results.push({
        file: '.env',
        status: 'OK',
        message: `NEXT_PUBLIC_APP_URL: ${url}`
      })
    }
  } else {
    results.push({
      file: '.env',
      status: 'WARNING',
      message: 'NEXT_PUBLIC_APP_URL не найден (будет использован fallback)'
    })
  }
  
  // Проверка NEXTAUTH_URL
  const nextauthUrlMatch = envContent.match(/NEXTAUTH_URL=["']?([^"'\n]+)["']?/)
  if (nextauthUrlMatch) {
    const url = nextauthUrlMatch[1]
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      results.push({
        file: '.env',
        status: 'ERROR',
        message: `NEXTAUTH_URL содержит localhost: ${url}`
      })
      hasErrors = true
    } else {
      results.push({
        file: '.env',
        status: 'OK',
        message: `NEXTAUTH_URL: ${url}`
      })
    }
  }
}

// 2. Проверка app/sitemap.ts
console.log('\n📍 2. Проверка app/sitemap.ts...')
if (existsSync('app/sitemap.ts')) {
  const sitemapContent = readFileSync('app/sitemap.ts', 'utf-8')
  
  // Проверка fallback значения
  if (sitemapContent.includes("'https://miss-kurochka.com'") || 
      sitemapContent.includes('"https://miss-kurochka.com"')) {
    results.push({
      file: 'app/sitemap.ts',
      status: 'OK',
      message: 'Fallback использует правильный production URL'
    })
  } else {
    results.push({
      file: 'app/sitemap.ts',
      status: 'ERROR',
      message: 'Fallback не использует production URL'
    })
    hasErrors = true
  }
  
  // Проверка на hardcoded localhost
  let hasLocalhost = false
  localhostPatterns.forEach(pattern => {
    if (pattern.test(sitemapContent)) {
      hasLocalhost = true
    }
  })
  
  if (hasLocalhost) {
    results.push({
      file: 'app/sitemap.ts',
      status: 'ERROR',
      message: 'Найдены hardcoded localhost ссылки'
    })
    hasErrors = true
  }
}

// 3. Проверка app/robots.ts
console.log('\n🤖 3. Проверка app/robots.ts...')
if (existsSync('app/robots.ts')) {
  const robotsContent = readFileSync('app/robots.ts', 'utf-8')
  
  // Проверка fallback значения
  if (robotsContent.includes("'https://miss-kurochka.com'") || 
      robotsContent.includes('"https://miss-kurochka.com"')) {
    results.push({
      file: 'app/robots.ts',
      status: 'OK',
      message: 'Fallback использует правильный production URL'
    })
  } else {
    results.push({
      file: 'app/robots.ts',
      status: 'ERROR',
      message: 'Fallback не использует production URL'
    })
    hasErrors = true
  }
}

// 4. Проверка app/layout.tsx
console.log('\n📱 4. Проверка app/layout.tsx...')
if (existsSync('app/layout.tsx')) {
  const layoutContent = readFileSync('app/layout.tsx', 'utf-8')
  
  // Проверка metadataBase
  if (layoutContent.includes('metadataBase:') && 
      (layoutContent.includes("'https://miss-kurochka.com'") || 
       layoutContent.includes('"https://miss-kurochka.com"'))) {
    results.push({
      file: 'app/layout.tsx',
      status: 'OK',
      message: 'metadataBase использует правильный production URL'
    })
  } else if (!layoutContent.includes('metadataBase:')) {
    results.push({
      file: 'app/layout.tsx',
      status: 'WARNING',
      message: 'metadataBase не найден'
    })
  }
  
  // Проверка robots metadata
  if (layoutContent.includes('index: true')) {
    results.push({
      file: 'app/layout.tsx',
      status: 'OK',
      message: 'Индексация разрешена (index: true)'
    })
  } else if (layoutContent.includes('index: false') || 
             layoutContent.includes('noindex')) {
    results.push({
      file: 'app/layout.tsx',
      status: 'ERROR',
      message: 'Индексация запрещена! Google не проиндексирует сайт'
    })
    hasErrors = true
  }
}

// 5. Проверка Dockerfile
console.log('\n🐳 5. Проверка Dockerfile...')
if (existsSync('Dockerfile')) {
  const dockerfileContent = readFileSync('Dockerfile', 'utf-8')
  
  // Проверка default NEXT_PUBLIC_APP_URL
  const dockerAppUrlMatch = dockerfileContent.match(/ENV NEXT_PUBLIC_APP_URL=["']?([^"'\n]+)["']?/)
  if (dockerAppUrlMatch) {
    const url = dockerAppUrlMatch[1]
    if (url === 'https://miss-kurochka.com') {
      results.push({
        file: 'Dockerfile',
        status: 'OK',
        message: 'NEXT_PUBLIC_APP_URL использует production URL'
      })
    } else if (url.includes('localhost')) {
      results.push({
        file: 'Dockerfile',
        status: 'WARNING',
        message: `NEXT_PUBLIC_APP_URL в Dockerfile: ${url} (будет переопределено при запуске)`
      })
    }
  }
}

// 6. Проверка .env.production.example
console.log('\n📝 6. Проверка .env.production.example...')
if (existsSync('.env.production.example')) {
  const envProdContent = readFileSync('.env.production.example', 'utf-8')
  
  if (envProdContent.includes('https://miss-kurochka.com') && 
      !envProdContent.includes('https://miss-kurochka.com/')) {
    results.push({
      file: '.env.production.example',
      status: 'OK',
      message: 'Production example использует правильный URL'
    })
  }
}

// Вывод результатов
console.log('\n' + '='.repeat(70))
console.log('📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ:\n')

let okCount = 0
let warningCount = 0
let errorCount = 0

results.forEach(result => {
  let icon = ''
  switch (result.status) {
    case 'OK':
      icon = '✅'
      okCount++
      break
    case 'WARNING':
      icon = '⚠️'
      warningCount++
      break
    case 'ERROR':
      icon = '❌'
      errorCount++
      break
  }
  
  console.log(`${icon} ${result.file}`)
  console.log(`   ${result.message}\n`)
})

console.log('='.repeat(70))
console.log(`\n📈 Статистика: ${okCount} OK, ${warningCount} предупреждений, ${errorCount} ошибок\n`)

if (hasErrors) {
  console.log('❌ ПРОВАЛ: Найдены критические ошибки!')
  console.log('\n🔧 Исправьте ошибки и запустите проверку снова.')
  process.exit(1)
} else if (warningCount > 0) {
  console.log('⚠️  ВНИМАНИЕ: Найдены предупреждения, но критических ошибок нет.')
  console.log('✅ Конфигурация готова для production.')
} else {
  console.log('✅ УСПЕХ: Все проверки пройдены!')
  console.log('✅ Конфигурация полностью готова для production.')
  console.log('\n🚀 Можно деплоить!')
}

console.log('\n📖 Инструкции по деплою: см. SITEMAP_FIX_DEPLOYMENT.md')
