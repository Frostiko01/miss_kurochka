import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Получаем стоп-лист
    const stopList = await prisma.stopList.findMany({
      where: {
        branchId,
        restoredAt: null,
      },
      include: {
        menuItem: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
            images: {
              where: {
                isPrimary: true,
              },
              take: 1,
            },
            sizes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          },
        },
        stopper: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        stoppedAt: "desc",
      },
    });

    // Добавляем виртуальное поле price (цена первого размера) для совместимости
    const normalized = stopList.map((entry: any) => ({
      ...entry,
      menuItem: entry.menuItem
        ? {
            ...entry.menuItem,
            price: entry.menuItem.sizes?.[0] ? Number(entry.menuItem.sizes[0].price) : 0,
            sizes: (entry.menuItem.sizes || []).map((s: any) => ({ ...s, price: Number(s.price) })),
          }
        : entry.menuItem,
    }));

    return NextResponse.json({ stopList: normalized });
  } catch (error) {
    console.error("Error fetching stop list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Добавление блюда в стоп-лист
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { menuItemId, reason, expectedReturnAt } = body;

    if (!menuItemId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Проверяем, что блюдо еще не в стоп-листе
    const existing = await prisma.stopList.findFirst({
      where: {
        branchId: branchUser.branchId,
        menuItemId,
        restoredAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Item already in stop list" },
        { status: 400 }
      );
    }

    // Добавляем в стоп-лист
    const stopListEntry = await prisma.stopList.create({
      data: {
        branchId: branchUser.branchId,
        menuItemId,
        reason: reason || null,
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
        stoppedBy: session.user.id,
      },
    });

    return NextResponse.json({ stopListEntry });
  } catch (error) {
    console.error("Error adding to stop list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Восстановление блюда из стоп-листа
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Проверяем, что запись принадлежит этому филиалу
    const stopListEntry = await prisma.stopList.findUnique({
      where: { id },
    });

    if (!stopListEntry || stopListEntry.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Stop list entry not found or access denied" },
        { status: 404 }
      );
    }

    // Восстанавливаем блюдо
    const updated = await prisma.stopList.update({
      where: { id },
      data: {
        restoredAt: new Date(),
        restoredBy: session.user.id,
      },
    });

    return NextResponse.json({ stopListEntry: updated });
  } catch (error) {
    console.error("Error restoring from stop list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
