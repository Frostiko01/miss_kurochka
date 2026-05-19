import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const includeMenuItem = {
  category: { select: { name: true } },
  images: { select: { imageUrl: true, isPrimary: true }, orderBy: { isPrimary: "desc" as const } },
  sizes: { orderBy: { sortOrder: "asc" as const } },
  spices: { orderBy: { sortOrder: "asc" as const } },
};

// GET - Список блюд
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (status !== "all") where.isActive = status === "active";

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: includeMenuItem,
      orderBy: { createdAt: "desc" },
    });

    // Конвертируем Decimal → Number
    const normalized = menuItems.map((item: any) => ({
      ...item,
      price: item.sizes?.[0] ? Number(item.sizes[0].price) : 0,
      weightGrams: item.sizes?.[0]?.weightGrams ?? null,
      sizes: (item.sizes || []).map((s: any) => ({ ...s, price: Number(s.price) })),
      spices: (item.spices || []).map((sp: any) => ({ ...sp, price: Number(sp.price) })),
    }));

    return NextResponse.json({ menuItems: normalized });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Создать блюдо
// body: {
//   categoryId, name, description?, cookingTimeMinutes?, imageUrl?, isActive?,
//   sizes: [{ name, price, weightGrams? }],   // обязательно хотя бы один
//   spices?: [{ name, price? }]
// }
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, name, description, cookingTimeMinutes, imageUrl, isActive, sizes, spices } = body;

    if (!categoryId || !name) {
      return NextResponse.json({ error: "Category and name are required" }, { status: 400 });
    }

    if (!Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json({ error: "At least one size with price is required" }, { status: 400 });
    }

    const menuItem = await (prisma.menuItem as any).create({
      data: {
        categoryId,
        name,
        description: description || null,
        cookingTimeMinutes: cookingTimeMinutes ? parseInt(cookingTimeMinutes) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Создаём размеры
    for (let i = 0; i < sizes.length; i++) {
      const s = sizes[i];
      await (prisma as any).menuItemSize.create({
        data: {
          menuItemId: menuItem.id,
          name: String(s.name).trim(),
          price: parseFloat(s.price),
          weightGrams: s.weightGrams ? parseInt(s.weightGrams) : null,
          isActive: true,
          sortOrder: i,
        },
      });
    }

    // Создаём специи
    if (Array.isArray(spices) && spices.length > 0) {
      for (let i = 0; i < spices.length; i++) {
        const sp = spices[i];
        await (prisma as any).menuItemSpice.create({
          data: {
            menuItemId: menuItem.id,
            name: String(sp.name).trim(),
            price: sp.price ? parseFloat(sp.price) : 0,
            isActive: true,
            sortOrder: i,
          },
        });
      }
    }

    if (imageUrl && imageUrl.trim()) {
      await prisma.menuItemImage.create({
        data: { menuItemId: menuItem.id, imageUrl: imageUrl.trim(), isPrimary: true },
      });
    }

    const created = await prisma.menuItem.findUnique({ where: { id: menuItem.id }, include: includeMenuItem });
    return NextResponse.json({ menuItem: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Обновить блюдо
// body: {
//   id, categoryId, name, description?, cookingTimeMinutes?, imageUrl?, isActive?,
//   sizes?: [{ id?, name, price, weightGrams? }],  // если передан — пересоздаём
//   spices?: [{ id?, name, price? }]               // если передан — пересоздаём
// }
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, categoryId, name, description, cookingTimeMinutes, imageUrl, isActive, sizes, spices } = body;

    if (!id || !categoryId || !name) {
      return NextResponse.json({ error: "ID, category and name are required" }, { status: 400 });
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description: description || null,
        cookingTimeMinutes: cookingTimeMinutes ? parseInt(cookingTimeMinutes) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Пересоздаём размеры если переданы
    if (Array.isArray(sizes)) {
      await (prisma as any).menuItemSize.deleteMany({ where: { menuItemId: id } });
      for (let i = 0; i < sizes.length; i++) {
        const s = sizes[i];
        await (prisma as any).menuItemSize.create({
          data: {
            menuItemId: id,
            name: String(s.name).trim(),
            price: parseFloat(s.price),
            weightGrams: s.weightGrams ? parseInt(s.weightGrams) : null,
            isActive: true,
            sortOrder: i,
          },
        });
      }
    }

    // Пересоздаём специи если переданы
    if (Array.isArray(spices)) {
      await (prisma as any).menuItemSpice.deleteMany({ where: { menuItemId: id } });
      for (let i = 0; i < spices.length; i++) {
        const sp = spices[i];
        await (prisma as any).menuItemSpice.create({
          data: {
            menuItemId: id,
            name: String(sp.name).trim(),
            price: sp.price ? parseFloat(sp.price) : 0,
            isActive: true,
            sortOrder: i,
          },
        });
      }
    }

    // Обновляем изображение
    if (imageUrl !== undefined) {
      await prisma.menuItemImage.deleteMany({ where: { menuItemId: id } });
      if (imageUrl && imageUrl.trim()) {
        await prisma.menuItemImage.create({
          data: { menuItemId: id, imageUrl: imageUrl.trim(), isPrimary: true },
        });
      }
    }

    const updated = await prisma.menuItem.findUnique({ where: { id }, include: includeMenuItem });
    return NextResponse.json({ menuItem: updated });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Удалить блюдо
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });
    }

    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
