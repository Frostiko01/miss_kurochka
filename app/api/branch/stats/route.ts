import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
      include: { branch: true },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const branchId = branchUser.branchId;

    // Получаем сегодняшнюю дату
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Заказы сегодня
    const todayOrders = await prisma.order.count({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Выручка сегодня
    const todayRevenue = await prisma.order.aggregate({
      where: {
        branchId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["completed", "ready", "delivering"],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Активные блюда (не в стоп-листе)
    const activeItems = await prisma.menuItem.count({
      where: {
        isActive: true,
        category: {
          OR: [
            { branchId: branchId },
            { branchId: null },
          ],
        },
        stopList: {
          none: {
            branchId,
            restoredAt: null,
          },
        },
      },
    });

    // Блюда в стоп-листе
    const stopListItems = await prisma.stopList.count({
      where: {
        branchId,
        restoredAt: null,
      },
    });

    return NextResponse.json({
      todayOrders,
      todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
      activeItems,
      stopListItems,
    });
  } catch (error) {
    console.error("Error fetching branch stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
