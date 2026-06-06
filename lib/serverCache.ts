/**
 * Простой in-memory кэш с TTL для серверных API-роутов.
 *
 * Нужен, чтобы не дёргать БД на каждый запрос для редко меняющихся данных
 * (меню, комбо, филиалы). Кэш живёт в памяти процесса Node — для контейнерного
 * деплоя (один длительный процесс) этого достаточно и даёт огромный прирост:
 * тяжёлый запрос выполняется раз в TTL, остальные отдаются из памяти за ~1мс.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

/**
 * Возвращает закэшированное значение по ключу или вычисляет его через factory,
 * кэширует на ttlMs миллисекунд и возвращает.
 *
 * Защита от «stampede»: если несколько запросов пришли одновременно с пустым
 * кэшем — все ждут один и тот же промис, БД дёргается один раз.
 */
const inflight = new Map<string, Promise<unknown>>()

export async function cached<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expiresAt > now) {
    return hit.value as T
  }

  // Уже выполняется такой же запрос — переиспользуем его промис
  const pending = inflight.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const promise = (async () => {
    try {
      const value = await factory()
      store.set(key, { value, expiresAt: Date.now() + ttlMs })
      return value
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise as Promise<T>
}

/**
 * Сбрасывает кэш. Без аргумента — весь, с префиксом — по совпадению начала ключа.
 * Вызывать после изменения данных в админке/филиале (создание/правка блюд и т.п.).
 */
export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) store.delete(key)
  }
}
