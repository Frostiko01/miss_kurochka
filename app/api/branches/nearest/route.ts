import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pickBestBranch, haversineKm } from '@/lib/branchSelector'

// POST /api/branches/nearest
// body: { latitude?: number; longitude?: number; addressLine?: string }
// Возвращает ближайший к координатам/адресу активный филиал
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude, addressLine } = body as {
      latitude?: number | null
      longitude?: number | null
      addressLine?: string | null
    }

    const customerCoord =
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude)
        ? { lat: latitude, lng: longitude }
        : null

    const picked = await pickBestBranch({
      customerCoord,
      addressText: addressLine ?? null,
    })

    if (!picked) {
      return NextResponse.json({ error: 'Нет активных филиалов' }, { status: 404 })
    }

    const branch = await prisma.branch.findUnique({
      where: { id: picked.branchId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        latitude: true,
        longitude: true,
        averageCookingTime: true,
        minOrderAmount: true,
      },
    })

    if (!branch) {
      return NextResponse.json({ error: 'Филиал не найден' }, { status: 404 })
    }

    let distanceKm: number | undefined = picked.distanceKm
    if (
      customerCoord &&
      branch.latitude !== null &&
      branch.longitude !== null &&
      distanceKm === undefined
    ) {
      distanceKm = haversineKm(customerCoord, {
        lat: Number(branch.latitude),
        lng: Number(branch.longitude),
      })
    }

    return NextResponse.json({
      branch: {
        ...branch,
        latitude: branch.latitude !== null ? Number(branch.latitude) : null,
        longitude: branch.longitude !== null ? Number(branch.longitude) : null,
        minOrderAmount:
          branch.minOrderAmount !== null ? Number(branch.minOrderAmount) : null,
      },
      distanceKm: distanceKm ?? null,
      reason: picked.reason,
    })
  } catch (error) {
    console.error('Nearest branch error:', error)
    return NextResponse.json(
      { error: 'Ошибка определения филиала' },
      { status: 500 },
    )
  }
}
