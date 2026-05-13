import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Получить все комбо-наборы (глобальные + своего филиала)
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
    const status = searchParams.get("status") || "all";

    const where: any = {
      OR: [
        { branchId: null }, // Глобальные комбо
        { branchId: branchUser.branchId }, // Комбо филиала
      ],
    };

    if (status !== "all") {
      where.isActive = status === "active";
    }

    const combos = await prisma.comboOffer.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ combos });
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json(
      { error: "Failed to fetch combos" },
      { status: 500 }
    );
  }
}

// POST - Создать комбо для своего филиала
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
    const { name, description, items, price, oldPrice, imageUrl, isActive, sortOrder } = body;

    if (!name || !items || items.length === 0 || !price || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const combo = await prisma.comboOffer.create({
      data: {
        name,
        description: description || null,
        items,
        price,
        oldPrice: oldPrice || null,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        branchId: branchUser.branchId, // Привязываем к филиалу
      },
    });

    return NextResponse.json({ combo }, { status: 201 });
  } catch (error) {
    console.error("Error creating combo:", error);
    return NextResponse.json(
      { error: "Failed to create combo" },
      { status: 500 }
    );
  }
}

// PUT - Обновить комбо (только свои)
export async function PUT(request: NextRequest) {
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
    const { id, name, description, items, price, oldPrice, imageUrl, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Combo ID is required" },
        { status: 400 }
      );
    }

    // Проверяем что комбо принадлежит этому филиалу
    const existingCombo = await prisma.comboOffer.findUnique({
      where: { id },
    });

    if (!existingCombo || existingCombo.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Combo not found or access denied" },
        { status: 404 }
      );
    }

    const combo = await prisma.comboOffer.update({
      where: { id },
      data: {
        name,
        description: description || null,
        items,
        price,
        oldPrice: oldPrice || null,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ combo });
  } catch (error) {
    console.error("Error updating combo:", error);
    return NextResponse.json(
      { error: "Failed to update combo" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить комбо (только свои)
export async function DELETE(request: NextRequest) {
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
        { error: "Combo ID is required" },
        { status: 400 }
      );
    }

    // Проверяем что комбо принадлежит этому филиалу
    const existingCombo = await prisma.comboOffer.findUnique({
      where: { id },
    });

    if (!existingCombo || existingCombo.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Combo not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.comboOffer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting combo:", error);
    return NextResponse.json(
      { error: "Failed to delete combo" },
      { status: 500 }
    );
  }
}
