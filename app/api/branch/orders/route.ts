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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = { branchId: branchUser.branchId };
    // Скрываем неоплаченные finik-заказы — пока не пришёл webhook с подтверждением,
    // заказ не должен показываться филиалу.
    where.NOT = { paymentMethod: "finik", status: "pending" };
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status !== "all") {
      where.status = status;
    }

    const [orders, newCount] = await Promise.all([
      prisma.order.findMany({
        where,
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
              comboOffer: true,
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
          branch: {
            select: { id: true, name: true, address: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.order.count({
        where: {
          branchId: branchUser.branchId,
          status: { in: ["pending", "confirmed"] },
          // Тот же фильтр и для счётчика «новых»
          NOT: { paymentMethod: "finik", status: "pending" },
        },
      }),
    ]);

    return NextResponse.json({ orders, newCount });
  } catch (error) {
    console.error("Branch orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// PATCH - Обновить статус заказа
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    // Поддерживаем оба варианта именования: id (новый, как в админке) и orderId (старый)
    const orderId = body.id || body.orderId;
    const { status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    const allowed = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivering",
      "completed",
      "cancelled",
    ];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
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
    const updateData: any = { status };
    if (status === "ready" && !order.readyAt) updateData.readyAt = new Date();
    if (status === "completed" && !order.deliveredAt) updateData.deliveredAt = new Date();
    if (status === "cancelled" && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = session.user.id;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
    console.error("Branch order PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
