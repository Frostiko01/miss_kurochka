import { prisma } from '../lib/prisma'

async function main() {
  const tokenSetting = await prisma.systemSetting.findUnique({
    where: { key: 'ADMIN_TELEGRAM_BOT_TOKEN' }
  })
  const userIdSetting = await prisma.systemSetting.findUnique({
    where: { key: 'ADMIN_TELEGRAM_USER_ID' }
  })

  if (!tokenSetting || !userIdSetting) {
    console.error('❌ Настройки не найдены в БД')
    return
  }

  const botToken = tokenSetting.value
  const chatId = userIdSetting.value

  console.log(`Bot Token: ${botToken.substring(0, 15)}...`)
  console.log(`Chat ID: ${chatId}`)

  // 1. Проверяем бота
  console.log('\n1. Проверяем бота...')
  const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
  const meData = await meRes.json()
  console.log('getMe:', JSON.stringify(meData, null, 2))

  if (!meData.ok) {
    console.error('❌ Токен бота неверный!')
    return
  }

  // 2. Отправляем тестовое сообщение
  console.log('\n2. Отправляем тестовое сообщение...')
  const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🔐 Тест 2FA: ваш код 123456\n\nЕсли вы видите это сообщение — Telegram работает корректно.`,
    }),
  })
  const sendData = await sendRes.json()
  console.log('sendMessage:', JSON.stringify(sendData, null, 2))

  if (sendData.ok) {
    console.log('\n✅ Сообщение отправлено успешно!')
  } else {
    console.error('\n❌ Ошибка отправки:', sendData.description)
    if (sendData.error_code === 400 && sendData.description?.includes('chat not found')) {
      console.log('\n💡 Причина: пользователь не начал диалог с ботом.')
      console.log('   Откройте Telegram, найдите бота и отправьте /start')
    }
    if (sendData.error_code === 403) {
      console.log('\n💡 Причина: бот заблокирован пользователем или не начат диалог.')
      console.log('   Откройте Telegram, найдите бота и отправьте /start')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
