import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/menu - Получить все категории с блюдами
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    const categories = await prisma.menuCategory.findMany({
      where: {
        status: 'active',
        ...(branchId && { branchId }),
      },
      include: {
        menuItems: {
          where: {
            isActive: true,
          },
          include: {
            images: {
              where: {
                isPrimary: true,
              },
            },
            modifiers: {
              include: {
                modifierGroup: {
                  include: {
                    options: {
                      where: {
                        isActive: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menu',
      },
      { status: 500 }
    )
  }
}
