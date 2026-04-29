import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/branches - Получить все активные филиалы
export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: {
        status: 'active',
      },
      include: {
        schedules: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
        deliveryZones: {
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: branches,
    })
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch branches',
      },
      { status: 500 }
    )
  }
}
