/**
 * Скрипт для проверки приватного ключа Finik
 * Запуск: npx tsx scripts/test-finik-key.ts
 */

import { Signer } from '@mancho.devs/authorizer'
import * as fs from 'fs'
import * as path from 'path'

// Загружаем переменные окружения
import * as dotenv from 'dotenv'
dotenv.config()

interface RequestData {
  httpMethod: string
  path: string
  headers: Record<string, string>
  queryStringParameters?: Record<string, string> | null
  body?: Record<string, unknown> | string | null
}

async function testFinikKey() {
  console.log('🔍 Проверка конфигурации Finik...\n')

  // 1. Проверяем переменные окружения
  const env = process.env.FINIK_ENV || 'beta'
  const apiKey = process.env.FINIK_API_KEY
  const accountId = process.env.FINIK_ACCOUNT_ID
  const privateKeyEnv = process.env.FINIK_PRIVATE_KEY

  console.log('📋 Переменные окружения:')
  console.log(`  FINIK_ENV: ${env}`)
  console.log(`  FINIK_API_KEY: ${apiKey ? '✅ Установлен' : '❌ Не установлен'}`)
  console.log(`  FINIK_ACCOUNT_ID: ${accountId ? '✅ Установлен' : '❌ Не установлен'}`)
  console.log(`  FINIK_PRIVATE_KEY: ${privateKeyEnv ? '✅ Установлен' : '❌ Не установлен'}`)

  if (privateKeyEnv) {
    console.log(`  Длина ключа: ${privateKeyEnv.length} символов`)
    console.log(`  Начало ключа: ${privateKeyEnv.substring(0, 30)}...`)
  }

  console.log('\n')

  // 2. Проверяем файл с ключом
  const keyFilePath = 'C:/FinikKeys/finik_private.pem'
  console.log('📁 Проверка файла с ключом:')
  console.log(`  Путь: ${keyFilePath}`)

  if (fs.existsSync(keyFilePath)) {
    console.log('  ✅ Файл существует')
    const keyFromFile = fs.readFileSync(keyFilePath, 'utf-8')
    console.log(`  Длина ключа из файла: ${keyFromFile.length} символов`)
    console.log(`  Начало ключа: ${keyFromFile.substring(0, 50)}...`)
    console.log(`  Конец ключа: ...${keyFromFile.substring(keyFromFile.length - 50)}`)

    // Проверяем формат
    if (keyFromFile.includes('BEGIN RSA PRIVATE KEY')) {
      console.log('  ✅ Формат: RSA PRIVATE KEY')
    } else if (keyFromFile.includes('BEGIN PRIVATE KEY')) {
      console.log('  ✅ Формат: PRIVATE KEY')
    } else {
      console.log('  ⚠️ Неизвестный формат ключа')
    }

    // 3. Тестируем подпись
    console.log('\n🔐 Тестирование генерации подписи...')

    const testRequest: RequestData = {
      httpMethod: 'POST',
      path: '/v1/payment',
      headers: {
        Host: env === 'prod' ? 'api.acquiring.averspay.kg' : 'beta.api.acquiring.averspay.kg',
        'x-api-key': apiKey || 'test-key',
        'x-api-timestamp': Date.now().toString(),
      },
      queryStringParameters: null,
      body: {
        Amount: 100,
        CardType: 'FINIK_QR',
        PaymentId: 'test-payment-id',
      },
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signature = await new Signer(testRequest as any).sign(keyFromFile)
      console.log('  ✅ Подпись успешно сгенерирована!')
      console.log(`  Подпись: ${signature.substring(0, 50)}...`)
      console.log(`  Длина подписи: ${signature.length} символов`)

      // Сохраняем правильный формат ключа для .env
      console.log('\n📝 Правильный формат для .env файла:')
      const envFormat = keyFromFile.replace(/\n/g, '\\n')
      console.log(`FINIK_PRIVATE_KEY="${envFormat}"`)

      // Сохраняем в файл для удобства
      const outputPath = path.join(process.cwd(), 'finik_key_for_env.txt')
      fs.writeFileSync(outputPath, `FINIK_PRIVATE_KEY="${envFormat}"`, 'utf-8')
      console.log(`\n✅ Сохранено в файл: ${outputPath}`)
      console.log('Скопируйте содержимое этого файла в ваш .env')

    } catch (error) {
      console.error('  ❌ Ошибка при генерации подписи:')
      console.error('  ', error)
      if (error instanceof Error) {
        console.error('  Сообщение:', error.message)
        console.error('  Stack:', error.stack)
      }
    }
  } else {
    console.log('  ❌ Файл не найден')
    console.log('\n💡 Инструкция:')
    console.log('  1. Убедитесь, что файл finik_private.pem находится в C:/FinikKeys/')
    console.log('  2. Или укажите правильный путь к файлу')
  }

  console.log('\n✅ Проверка завершена')
}

testFinikKey().catch(console.error)
