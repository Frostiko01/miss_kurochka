import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import type { PoolConfig } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

/**
 * Парсим DATABASE_URL руками, чтобы передать пароль строкой.
 * Иначе если пароль состоит только из цифр (например "12345"),
 * pg-pool интерпретирует его как число и роняет SCRAM auth.
 */
function buildPoolConfig(): PoolConfig {
  const url = process.env.DATABASE_URL ?? ''
  
  // Если DATABASE_URL пустой или не задан (например, во время сборки), используем fallback
  if (!url || url.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[lib/prisma] DATABASE_URL not set, using fallback config')
    }
    return {
      user: 'postgres',
      password: '12345',
      host: 'localhost',
      port: 5432,
      database: 'miss_kurochka',
    }
  }
  
  try {
    const parsed = new URL(url)
    return {
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password ?? ''), // всегда строка
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.pathname.replace(/^\//, ''),
      ssl: parsed.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : undefined,
    }
  } catch (e) {
    console.error('[lib/prisma] Failed to parse DATABASE_URL, falling back', e)
    // Безопасный фолбэк для локальной разработки
    return {
      user: 'postgres',
      password: '12345',
      host: 'localhost',
      port: 5432,
      database: 'miss_kurochka',
    }
  }
}

const pool = globalForPrisma.pool ?? new Pool(buildPoolConfig())
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}
