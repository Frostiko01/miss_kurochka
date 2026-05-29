import { prisma } from '../lib/prisma'

async function main() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['ADMIN_TELEGRAM_BOT_TOKEN', 'ADMIN_TELEGRAM_USER_ID'] } }
  })
  console.log('Settings in DB:', JSON.stringify(settings, null, 2))
  console.log('\nTotal found:', settings.length)
  
  if (settings.length === 0) {
    console.log('\n❌ Настройки Telegram НЕ найдены в базе данных!')
    console.log('Нужно запустить: npx tsx scripts/sync-telegram-to-db.ts')
  } else {
    const token = settings.find(s => s.key === 'ADMIN_TELEGRAM_BOT_TOKEN')
    const userId = settings.find(s => s.key === 'ADMIN_TELEGRAM_USER_ID')
    console.log('\nBot Token:', token ? token.value.substring(0, 15) + '...' : 'НЕТ')
    console.log('User ID:', userId ? userId.value : 'НЕТ')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
