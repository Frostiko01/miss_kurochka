/**
 * Тестовый скрипт для проверки интеграции с Finik Pay
 * Запуск: npx tsx scripts/test-finik-payment.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Загружаем переменные окружения из .env
dotenv.config({ path: resolve(process.cwd(), '.env') })

import { createFinikPayment } from '../lib/finik'

async function testFinikPayment() {
  console.log('🧪 Тестирование создания платежа Finik Pay...\n')

  console.log('📋 Конфигурация:')
  console.log('  FINIK_ENV:', process.env.FINIK_ENV || 'beta')
  console.log('  FINIK_API_KEY:', process.env.FINIK_API_KEY ? `✓ ${process.env.FINIK_API_KEY.substring(0, 10)}...` : '✗ Отсутствует')
  console.log('  FINIK_ACCOUNT_ID:', process.env.FINIK_ACCOUNT_ID ? `✓ ${process.env.FINIK_ACCOUNT_ID}` : '✗ Отсутствует')
  console.log('  FINIK_PRIVATE_KEY:', process.env.FINIK_PRIVATE_KEY ? `✓ Установлен (${process.env.FINIK_PRIVATE_KEY.length} символов)` : '✗ Отсутствует')
  console.log()

  if (!process.env.FINIK_API_KEY || !process.env.FINIK_ACCOUNT_ID) {
    console.error('❌ Ошибка: FINIK_API_KEY и FINIK_ACCOUNT_ID должны быть установлены в .env')
    process.exit(1)
  }

  try {
    console.log('🔄 Создание тестового платежа на 5 сом...')
    
    const paymentUrl = await createFinikPayment({
      amount: 5,
      workId: 'test-order-' + Date.now(),
      workTopic: 'Test payment for Miss Kurochka',
      userId: 'test-user-123',
    })

    console.log('\n✅ Платеж успешно создан!')
    console.log('🔗 URL платежной страницы:', paymentUrl)
    console.log()
    console.log('💡 Откройте этот URL в браузере для тестирования оплаты')
  } catch (error) {
    console.error('\n❌ Ошибка при создании платежа:')
    if (error instanceof Error) {
      console.error('  Сообщение:', error.message)
      if (error.stack) {
        console.error('\n  Stack trace:')
        console.error(error.stack)
      }
    } else {
      console.error('  ', error)
    }
    process.exit(1)
  }
}

testFinikPayment()
