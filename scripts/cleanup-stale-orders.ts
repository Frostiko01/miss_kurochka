import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { cleanupStaleUnpaidOrders } from '../lib/analytics'

async function main() {
  const count = await cleanupStaleUnpaidOrders()
  console.log(`Отменено зависших неоплаченных онлайн-заказов: ${count}`)

  const byStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  console.log('\nЗаказы по статусам после очистки:')
  for (const s of byStatus) {
    console.log(`  ${s.status}: ${s._count._all}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
