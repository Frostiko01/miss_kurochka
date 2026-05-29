/**
 * Next.js Instrumentation — выполняется один раз при старте сервера.
 * Прогреваем Prisma соединение чтобы первый пользовательский запрос
 * не ждал установки пула соединений.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { prisma } = await import('./lib/prisma')
      // Лёгкий запрос для прогрева пула соединений
      await prisma.$queryRaw`SELECT 1`
      console.log('[instrumentation] Prisma connection pool warmed up')
    } catch (e) {
      console.warn('[instrumentation] Failed to warm up Prisma:', e)
    }
  }
}
