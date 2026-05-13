import { prisma } from '../lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  })

  console.log('📋 Пользователи в базе данных:')
  users.forEach(user => {
    console.log(`  - ${user.fullName} (${user.email}) - ${user.role}`)
    console.log(`    ID: ${user.id}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
