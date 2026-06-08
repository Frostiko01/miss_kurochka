import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET - Получить все комбо-наборы
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const typeFilter = searchParams.get("type") || "all";

    const where: Prisma.ComboOfferWhereInput = {};
    if (status !== "all") where.isActive = status === "active";
    if (typeFilter === "regular") where.type = "regular";
    else if (typeFilter === "mini") where.type = "mini";

    const combos = await prisma.comboOffer.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        comboItems: {
          orderBy: { sortOrder: "asc" },
          include: { menuItem: { select: { id: true, name: true } } },
        },
      },
    });

    const normalized = combos.map((combo) => ({
      ...combo,
      items: combo.comboItems.map((ci) => ci.menuItem.name),
    }));

    return NextResponse.json({ combos: normalized });
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json({ error: "Failed to fetch combos" }, { status: 500 });
  }
}

// POST - Создать комбо
// body: { name, description, menuItemIds: string[], price, oldPrice, imageUrl, isActive, sortOrder }
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, menuItemIds, price, oldPrice, imageUrl, isActive, sortOrder, type } = body;

    if (!name || !price || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
      return NextResponse.json({ error: "menuItemIds must be a non-empty array" }, { status: 400 });
    }

    const combo = await prisma.comboOffer.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        imageUrl: imageUrl.trim(),
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        type: type === "mini" ? "mini" : "regular",
        comboItems: {
          create: menuItemIds.map((menuItemId: string, index: number) => ({
            menuItemId,
            quantity: 1,
            sortOrder: index,
          })),
        },
      },
      include: {
        comboItems: {
          orderBy: { sortOrder: "asc" },
          include: { menuItem: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json({
      combo: { ...combo, items: combo.comboItems.map((ci) => ci.menuItem.name) },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating combo:", error);
    return NextResponse.json({ error: "Failed to create combo" }, { status: 500 });
  }
}

// PUT - Обновить комбо
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, menuItemIds, price, oldPrice, imageUrl, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "Combo ID is required" }, { status: 400 });
    }

    await prisma.comboOffer.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        imageUrl: imageUrl && imageUrl.trim() !== "" ? imageUrl.trim() : undefined,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    if (Array.isArray(menuItemIds)) {
      await prisma.comboOfferItem.deleteMany({ where: { comboOfferId: id } });
      await prisma.comboOfferItem.createMany({
        data: menuItemIds.map((menuItemId: string, index: number) => ({
          comboOfferId: id,
          menuItemId,
          quantity: 1,
          sortOrder: index,
        })),
      });
    }

    const updated = await prisma.comboOffer.findUnique({
      where: { id },
      include: {
        comboItems: {
          orderBy: { sortOrder: "asc" },
          include: { menuItem: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json({
      combo: { ...updated, items: updated!.comboItems.map((ci) => ci.menuItem.name) },
    });
  } catch (error) {
    console.error("Error updating combo:", error);
    return NextResponse.json({ error: "Failed to update combo" }, { status: 500 });
  }
}

// DELETE - Удалить комбо
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Combo ID is required" }, { status: 400 });
    }

    await prisma.comboOffer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting combo:", error);
    return NextResponse.json({ error: "Failed to delete combo" }, { status: 500 });
  }
}
