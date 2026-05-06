import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaForAuth: PrismaClient | undefined
}

// Prisma Client с adapter для основного использования
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

// Отдельный Prisma Client для NextAuth
// NextAuth adapter требует стандартный Prisma Client с обычным adapter
const poolForAuth = new Pool({ connectionString: process.env.DATABASE_URL })
const adapterForAuth = new PrismaPg(poolForAuth)

export const prismaForAuth = globalForPrisma.prismaForAuth ?? new PrismaClient({ 
  adapter: adapterForAuth 
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaForAuth = prismaForAuth
}
