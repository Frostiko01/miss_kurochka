/**
 * Скрипт для тестирования генерации robots.txt
 * Проверяет, что sitemap URL использует production домен
 */

// Симулируем production окружение
process.env.NEXT_PUBLIC_APP_URL = 'https://miss-kurochka.com'

// Импортируем функцию robots
import robots from '../app/robots'

console.log('🤖 Тестирование генерации robots.txt...\n')
console.log('Переменная окружения NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
console.log('=' .repeat(60))

const robotsConfig = robots()

console.log('\n📄 Сгенерированный robots.txt:\n')

console.log('User-agent: *')
robotsConfig.rules.forEach(rule => {
  console.log(`Allow: ${rule.allow}`)
  rule.disallow?.forEach(path => {
    console.log(`Disallow: ${path}`)
  })
})
console.log(`\nSitemap: ${robotsConfig.sitemap}`)

console.log('\n' + '='.repeat(60))

if (robotsConfig.sitemap?.includes('localhost')) {
  console.log('\n❌ ПРОВАЛ: Sitemap URL содержит localhost!')
  process.exit(1)
} else {
  console.log('\n✅ УСПЕХ: Sitemap URL использует production домен!')
  console.log('✅ robots.txt готов для индексации Google')
}
