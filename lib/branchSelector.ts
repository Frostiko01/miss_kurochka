import { prisma } from '@/lib/prisma'

interface Coord {
  lat: number
  lng: number
}

/**
 * Расстояние между двумя точками в километрах (формула гаверсинусов).
 */
export function haversineKm(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371 // радиус Земли в км
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(sa))
}

/**
 * Геокодирование через Nominatim (OpenStreetMap) — бесплатно, без ключа.
 * Возвращает первое совпадение с приоритетом по Кыргызстану.
 */
export async function geocodeAddress(address: string): Promise<Coord | null> {
  try {
    // Добавляем "Бишкек" к запросу, если его нет — это даёт более точные результаты
    const enrichedQuery = /бишкек|bishkek/i.test(address)
      ? address
      : `${address}, Бишкек`

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      enrichedQuery,
    )}&limit=1&accept-language=ru&countrycodes=kg`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'miss-kurochka-app/1.0 (orders@miss-kurochka.kg)',
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.warn('[geocodeAddress] Nominatim returned', res.status)
      return null
    }
    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    if (!Array.isArray(data) || data.length === 0) {
      console.log('[geocodeAddress] No results for:', enrichedQuery)
      return null
    }
    const lat = parseFloat(data[0].lat)
    const lng = parseFloat(data[0].lon)
    if (isNaN(lat) || isNaN(lng)) return null
    console.log('[geocodeAddress] Geocoded:', enrichedQuery, '→', lat, lng)
    return { lat, lng }
  } catch (e) {
    console.error('[geocodeAddress] Error:', e)
    return null
  }
}

/**
 * Находит ближайший филиал к заданным координатам из списка.
 * Возвращает null если ни у одного филиала нет координат.
 */
function findNearestBranch(
  coord: Coord,
  branches: Array<{ id: string; latitude: any; longitude: any }>,
  reason: 'nearest_by_coord' | 'nearest_by_geocode',
): { branchId: string; distanceKm: number; reason: typeof reason } | null {
  let best: { id: string; distance: number } | null = null

  for (const b of branches) {
    if (b.latitude === null || b.longitude === null) continue
    const branchCoord = { lat: Number(b.latitude), lng: Number(b.longitude) }
    const distance = haversineKm(coord, branchCoord)
    if (!best || distance < best.distance) {
      best = { id: b.id, distance }
    }
  }

  if (!best) return null
  return { branchId: best.id, distanceKm: best.distance, reason }
}

interface PickBranchArgs {
  // Адрес доставки (если known)
  customerCoord?: Coord | null
  // Текстовый адрес для геокодирования если координат нет
  addressText?: string | null
  // Филиал, явно указанный пользователем (для самовывоза)
  preferredBranchId?: string | null
}

interface PickBranchResult {
  branchId: string
  reason: 'preferred' | 'nearest_by_coord' | 'nearest_by_geocode' | 'fallback_first'
  distanceKm?: number
}

/**
 * Подбирает оптимальный филиал для заказа:
 * 1. Если pickup и пользователь выбрал филиал → используем его
 * 2. Если есть координаты → ищем ближайший по гаверсинусу
 * 3. Если нет координат, но есть текст → геокодируем и ищем ближайший
 * 4. Иначе берём ближайший к центру Бишкека (или первый активный)
 */
export async function pickBestBranch(
  args: PickBranchArgs,
): Promise<PickBranchResult | null> {
  // Все активные филиалы с координатами
  const branches = await prisma.branch.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { name: 'asc' },
  })

  if (branches.length === 0) return null

  // 1) Явно выбранный филиал (самовывоз)
  if (args.preferredBranchId) {
    const found = branches.find((b) => b.id === args.preferredBranchId)
    if (found) {
      return { branchId: found.id, reason: 'preferred' }
    }
  }

  // 2) Поиск ближайшего по координатам
  let coord: Coord | null = args.customerCoord ?? null

  if (coord) {
    const nearest = findNearestBranch(coord, branches, 'nearest_by_coord')
    if (nearest) {
      console.log(
        `[pickBestBranch] Nearest by coord: ${nearest.branchId}, ${nearest.distanceKm.toFixed(2)} km`,
      )
      return { branchId: nearest.branchId, reason: nearest.reason, distanceKm: nearest.distanceKm }
    }
  }

  // 3) Если координат нет — геокодируем текст адреса
  if (!coord && args.addressText) {
    coord = await geocodeAddress(args.addressText)
    if (coord) {
      const nearest = findNearestBranch(coord, branches, 'nearest_by_geocode')
      if (nearest) {
        console.log(
          `[pickBestBranch] Nearest by geocode: ${nearest.branchId}, ${nearest.distanceKm.toFixed(2)} km`,
        )
        return { branchId: nearest.branchId, reason: nearest.reason, distanceKm: nearest.distanceKm }
      }
    }
  }

  // 4) Fallback — ищем ближайший к центру Бишкека (42.8746, 74.5698)
  // Это лучше чем просто первый по алфавиту
  const bishkekCenter: Coord = { lat: 42.8746, lng: 74.5698 }
  const nearestToCenter = findNearestBranch(bishkekCenter, branches, 'nearest_by_coord')
  if (nearestToCenter) {
    console.log(`[pickBestBranch] Fallback to nearest center branch: ${nearestToCenter.branchId}`)
    return { branchId: nearestToCenter.branchId, reason: 'fallback_first' }
  }

  return { branchId: branches[0].id, reason: 'fallback_first' }
}
