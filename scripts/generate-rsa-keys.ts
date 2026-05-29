/**
 * Скрипт для генерации пары RSA ключей (приватный и публичный)
 * Используется для локального тестирования интеграции с Finik Pay
 * 
 * ВАЖНО: Эти ключи только для разработки!
 * Для production используйте ключи, выданные Finik Pay
 * 
 * Запуск: npx tsx scripts/generate-rsa-keys.ts
 */

import { generateKeyPairSync } from 'crypto'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

console.log('🔐 Генерация пары RSA ключей для Finik Pay...\n')

try {
  // Генерируем пару ключей RSA 2048 бит
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  // Сохраняем ключи в файлы
  const keysDir = resolve(process.cwd(), 'keys')
  
  // Создаем директорию если её нет
  try {
    const fs = require('fs')
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true })
    }
  } catch (e) {
    // Директория уже существует
  }

  const privateKeyPath = resolve(keysDir, 'finik-private-key.pem')
  const publicKeyPath = resolve(keysDir, 'finik-public-key.pem')

  writeFileSync(privateKeyPath, privateKey)
  writeFileSync(publicKeyPath, publicKey)

  console.log('✅ Ключи успешно сгенерированы!\n')
  
  console.log('📁 Файлы сохранены:')
  console.log(`  Приватный ключ: ${privateKeyPath}`)
  console.log(`  Публичный ключ:  ${publicKeyPath}\n`)

  console.log('🔑 Публичный ключ (отправьте в Finik Pay):')
  console.log('─'.repeat(70))
  console.log(publicKey)
  console.log('─'.repeat(70))
  console.log()

  console.log('🔒 Приватный ключ (добавьте в .env):')
  console.log('─'.repeat(70))
  console.log('FINIK_PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"')
  console.log('─'.repeat(70))
  console.log()

  console.log('⚠️  ВАЖНО:')
  console.log('  1. Публичный ключ отправьте в Finik Pay для регистрации')
  console.log('  2. Приватный ключ добавьте в .env файл')
  console.log('  3. НЕ коммитьте приватный ключ в Git!')
  console.log('  4. Добавьте keys/ в .gitignore')
  console.log()

  console.log('📋 Следующие шаги:')
  console.log('  1. Отправьте публичный ключ в Finik Pay')
  console.log('  2. Получите от Finik Pay:')
  console.log('     - FINIK_API_KEY')
  console.log('     - FINIK_ACCOUNT_ID')
  console.log('  3. Обновите .env файл с полученными данными')
  console.log()

} catch (error) {
  console.error('❌ Ошибка при генерации ключей:', error)
  process.exit(1)
}
