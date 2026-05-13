import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Получить заказы только своего филиала
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Получаем только заказы этого филиала
    const orders = await prisma.order.findMany({
      where: {
        branchId: branchUser.branchId,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameI18n: true,
              },
            },
            modifiers: {
              include: {
                modifierOption: {
                  select: {
                    id: true,
                    name: true,
                    nameI18n: true,
                    priceDelta: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Branch orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// PUT - Обновить статус заказа
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Получаем филиал пользователя
    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Проверяем что заказ принадлежит этому филиалу
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    // Обновляем статус
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "ready" && { readyAt: new Date() }),
        ...(status === "completed" && { deliveredAt: new Date() }),
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        items: {
          include: {
            menuItem: true,
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("Branch order PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
