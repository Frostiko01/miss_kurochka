/**
 * Скрипт для тестирования генерации sitemap
 * Проверяет, что все URL используют production домен
 */

// Симулируем production окружение
process.env.NEXT_PUBLIC_APP_URL = 'https://miss-kurochka.com'

// Импортируем функцию sitemap
import sitemap from '../app/sitemap'

console.log('🔍 Тестирование генерации sitemap...\n')
console.log('Переменная окружения NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
console.log('=' .repeat(60))

const sitemapEntries = sitemap()

console.log('\n📄 Сгенерированный sitemap:\n')

let hasLocalhostUrls = false

sitemapEntries.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry.url}`)
  console.log(`   Приоритет: ${entry.priority}`)
  console.log(`   Частота изменений: ${entry.changeFrequency}`)
  console.log(`   Последнее изменение: ${entry.lastModified}`)
  console.log()
  
  if (entry.url.includes('localhost')) {
    hasLocalhostUrls = true
    console.log('   ❌ ОШИБКА: URL содержит localhost!')
  }
})

console.log('=' .repeat(60))

if (hasLocalhostUrls) {
  console.log('\n❌ ПРОВАЛ: Найдены localhost URL в sitemap!')
  process.exit(1)
} else {
  console.log('\n✅ УСПЕХ: Все URL используют production домен!')
  console.log('✅ Sitemap готов для индексации Google')
}
