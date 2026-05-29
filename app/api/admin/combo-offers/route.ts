import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Получить все комбо
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const typeFilter = searchParams.get("type") || "all";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "sortOrder";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const where: any = {};
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;
    if (typeFilter === "regular") where.type = "regular";
    else if (typeFilter === "mini") where.type = "mini";
    if (search) where.name = { contains: search, mode: "insensitive" };

    let orderBy: any = [{ sortOrder: sortOrder }, { createdAt: "desc" }];
    if (sortBy === "name") orderBy = { name: sortOrder };
    else if (sortBy === "price") orderBy = { price: sortOrder };
    else if (sortBy === "createdAt") orderBy = { createdAt: sortOrder };

    const combos = await prisma.comboOffer.findMany({
      where,
      orderBy,
      include: {
        comboItems: {
          orderBy: { sortOrder: "asc" },
          include: {
            menuItem: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Нормализуем: items — массив названий для совместимости с UI
    const normalized = combos.map((combo) => ({
      ...combo,
      type: combo.type,
      items: combo.comboItems.map((ci) => ci.menuItem.name),
    }));

    return NextResponse.json({ combos: normalized });
  } catch (error) {
    console.error("Error fetching combo offers:", error);
    return NextResponse.json({ error: "Failed to fetch combo offers" }, { status: 500 });
  }
}

// POST - Создать комбо
// body: { name, description, menuItemIds: string[], price, oldPrice, imageUrl, isActive, sortOrder }
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, menuItemIds, price, oldPrice, imageUrl, isActive, sortOrder, type } = body;

    if (!name || !price || !imageUrl) {
      return NextResponse.json({ error: "Name, price, and image are required" }, { status: 400 });
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
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        type: type === 'mini' ? 'mini' : 'regular',
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
    console.error("❌ Error creating combo offer:", error);
    return NextResponse.json({ error: "Failed to create combo offer" }, { status: 500 });
  }
}

// PUT - Обновить комбо
// body: { id, name, description, menuItemIds?: string[], price, oldPrice, imageUrl, isActive, sortOrder }
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, menuItemIds, price, oldPrice, imageUrl, isActive, sortOrder, type } = body;

    if (!id) {
      return NextResponse.json({ error: "Combo ID is required" }, { status: 400 });
    }

    // Обновляем основные поля
    const combo = await prisma.comboOffer.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        imageUrl: imageUrl && imageUrl.trim() !== "" ? imageUrl.trim() : undefined,
        isActive,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
        type: type === 'mini' ? 'mini' : 'regular',
      },
    });

    // Если переданы новые блюда — пересоздаём состав
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
    console.error("❌ Error updating combo offer:", error);
    return NextResponse.json({ error: "Failed to update combo offer" }, { status: 500 });
  }
}

// DELETE - Удалить комбо
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
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
    console.error("❌ Error deleting combo offer:", error);
    return NextResponse.json({ error: "Failed to delete combo offer" }, { status: 500 });
  }
}
