import { prisma } from '../lib/prisma'

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      createdAt: true,
    }
  })

  console.log(`\nАдминистраторы в базе (${admins.length}):\n`)
  admins.forEach((a, i) => {
    console.log(`${i + 1}. Email: ${a.email}`)
    console.log(`   Имя: ${a.fullName}`)
    console.log(`   Статус: ${a.status}`)
    console.log(`   Создан: ${a.createdAt.toLocaleString('ru-RU')}`)
    console.log()
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
