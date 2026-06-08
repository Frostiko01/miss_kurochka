import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const includeMenuItem = {
  category: { select: { name: true, branchId: true } },
  images: { where: { isPrimary: true }, take: 1 },
  sizes: { orderBy: { sortOrder: "asc" as const } },
  spices: { orderBy: { sortOrder: "asc" as const } },
};

// GET - Список блюд филиала
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({ where: { userId: session.user.id } });
    if (!branchUser) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: Prisma.MenuItemWhereInput = {
      // Филиал видит свои блюда (branchId === его филиал) и глобальные
      // блюда администратора (branchId === null). Чужие блюда скрыты.
      OR: [{ branchId: branchUser.branchId }, { branchId: null }],
    };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    let orderBy: Prisma.MenuItemOrderByWithRelationInput = { createdAt: sortOrder };
    if (sortBy === "name") orderBy = { name: sortOrder };

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: includeMenuItem,
      orderBy,
    });

    // Конвертируем Decimal → Number
    const normalized = menuItems.map((item) => ({
      ...item,
      price: item.sizes?.[0] ? Number(item.sizes[0].price) : 0,
      weightGrams: item.sizes?.[0]?.weightGrams ?? null,
      sizes: (item.sizes || []).map((s) => ({ ...s, price: Number(s.price) })),
      spices: (item.spices || []).map((sp) => ({ ...sp, price: Number(sp.price) })),
    }));

    return NextResponse.json({ menuItems: normalized });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Создать блюдо
// body: { categoryId, name, description?, cookingTimeMinutes?, imageUrl?, isActive?,
//         sizes: [{ name, price, weightGrams? }], spices?: [{ name, price? }] }
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({ where: { userId: session.user.id } });
    if (!branchUser) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const body = await request.json();
    const { categoryId, name, description, cookingTimeMinutes, imageUrl, isActive, sizes, spices } = body;

    if (!categoryId || !name) {
      return NextResponse.json({ error: "Category and name are required" }, { status: 400 });
    }
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json({ error: "At least one size with price is required" }, { status: 400 });
    }

    const category = await prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (category.branchId && category.branchId !== branchUser.branchId) {
      return NextResponse.json({ error: "Cannot add items to other branch categories" }, { status: 403 });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        categoryId,
        // Привязываем блюдо к филиалу — оно будет видно только этому филиалу.
        branchId: branchUser.branchId,
        name,
        description: description || null,
        cookingTimeMinutes: cookingTimeMinutes ? parseInt(cookingTimeMinutes) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Создаём размеры
    for (let i = 0; i < sizes.length; i++) {
      const s = sizes[i];
      await prisma.menuItemSize.create({
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
        await prisma.menuItemSpice.create({
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
    console.log("✅ Menu item created:", menuItem.id);
    return NextResponse.json({ menuItem: created }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Обновить блюдо
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({ where: { userId: session.user.id } });
    if (!branchUser) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const body = await request.json();
    const { id, categoryId, name, description, cookingTimeMinutes, imageUrl, isActive, sizes, spices } = body;

    if (!id) return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });

    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existingItem) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

    // Запрещаем редактировать блюда, принадлежащие другому филиалу.
    // Глобальные блюда (branchId === null) филиал тоже не редактирует.
    if (existingItem.branchId !== branchUser.branchId) {
      return NextResponse.json({ error: "Cannot edit items from other branches" }, { status: 403 });
    }
    if (existingItem.category.branchId && existingItem.category.branchId !== branchUser.branchId) {
      return NextResponse.json({ error: "Cannot edit items from other branches" }, { status: 403 });
    }

    if (categoryId && categoryId !== existingItem.categoryId) {
      const newCategory = await prisma.menuCategory.findUnique({ where: { id: categoryId } });
      if (!newCategory) return NextResponse.json({ error: "Category not found" }, { status: 404 });
      if (newCategory.branchId && newCategory.branchId !== branchUser.branchId) {
        return NextResponse.json({ error: "Cannot move to other branch category" }, { status: 403 });
      }
    }

    await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description: description || null,
        cookingTimeMinutes: cookingTimeMinutes ? parseInt(cookingTimeMinutes) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    if (Array.isArray(sizes)) {
      await prisma.menuItemSize.deleteMany({ where: { menuItemId: id } });
      for (let i = 0; i < sizes.length; i++) {
        const s = sizes[i];
        await prisma.menuItemSize.create({
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

    if (Array.isArray(spices)) {
      await prisma.menuItemSpice.deleteMany({ where: { menuItemId: id } });
      for (let i = 0; i < spices.length; i++) {
        const sp = spices[i];
        await prisma.menuItemSpice.create({
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

    if (imageUrl !== undefined) {
      await prisma.menuItemImage.deleteMany({ where: { menuItemId: id } });
      if (imageUrl && imageUrl.trim()) {
        await prisma.menuItemImage.create({
          data: { menuItemId: id, imageUrl: imageUrl.trim(), isPrimary: true },
        });
      }
    }

    const updated = await prisma.menuItem.findUnique({ where: { id }, include: includeMenuItem });
    console.log("✅ Menu item updated:", id);
    return NextResponse.json({ menuItem: updated });
  } catch (error) {
    console.error("❌ Error updating menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Удалить блюдо
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({ where: { userId: session.user.id } });
    if (!branchUser) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 });

    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existingItem) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

    // Удалять можно только собственные блюда филиала.
    if (existingItem.branchId !== branchUser.branchId) {
      return NextResponse.json({ error: "Cannot delete items from other branches" }, { status: 403 });
    }
    if (existingItem.category.branchId && existingItem.category.branchId !== branchUser.branchId) {
      return NextResponse.json({ error: "Cannot delete items from other branches" }, { status: 403 });
    }

    await prisma.menuItem.delete({ where: { id } });
    console.log("✅ Menu item deleted:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting menu item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
