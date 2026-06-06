import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cached } from '@/lib/serverCache'

export const dynamic = "force-dynamic";

// GET /api/branches - Получить все активные филиалы
export async function GET() {
  try {
    const branches = await cached("branches:active", 120_000, () =>
      prisma.branch.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          city: true,
          averageCookingTime: true,
          minOrderAmount: true,
          schedules: {
            orderBy: { dayOfWeek: 'asc' },
            select: {
              id: true,
              dayOfWeek: true,
              openTime: true,
              closeTime: true,
            },
          },
          deliveryZones: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              deliveryFee: true,
              minOrderAmount: true,
              estimatedMinutes: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    )

    const response = NextResponse.json({ success: true, branches, data: branches })
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch branches' }, { status: 500 })
  }
}
