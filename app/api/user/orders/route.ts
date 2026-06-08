import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET - Получить историю заказов пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Фильтр по статусу
    const where: Prisma.OrderWhereInput = {
      customerId: session.user.id,
    };

    if (status !== "all") {
      where.status = status as Prisma.OrderWhereInput["status"];
    }

    // Получаем заказы с полной информацией
    const orders = await prisma.order.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                category: {
                  select: {
                    name: true,
                  },
                },
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    imageUrl: true,
                  },
                },
              },
            },
            comboOffer: true,
            modifiers: {
              include: {
                modifierOption: {
                  select: {
                    id: true,
                    name: true,
                    group: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            paymentMethod: true,
            amount: true,
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Подсчёт общего количества заказов
    const totalCount = await prisma.order.count({ where });

    return NextResponse.json({
      orders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
