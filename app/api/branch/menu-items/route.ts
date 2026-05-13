import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Получить блюда
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const where: any = {
      category: {
        OR: [
          { branchId: branchUser.branchId },
          { branchId: null },
        ],
      },
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            branchId: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Создать блюдо
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      categoryId,
      name,
      description,
      price,
      weightGrams,
      cookingTimeMinutes,
      imageUrl,
      isActive,
    } = body;

    console.log("📝 Branch creating menu item:", { name, categoryId, branchId: branchUser.branchId });

    // Проверяем, что категория доступна филиалу
    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Разрешаем добавлять в глобальные категории (branchId = null) и свои категории
    if (category.branchId && category.branchId !== branchUser.branchId) {
      return NextResponse.json(
        { error: "Cannot add items to other branch categories" },
        { status: 403 }
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price,
        weightGrams,
        cookingTimeMinutes,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Добавляем изображение только если оно действительно предоставлено (не пустая строка)
    if (imageUrl && imageUrl.trim() !== '') {
      await prisma.menuItemImage.create({
        data: {
          menuItemId: menuItem.id,
          imageUrl: imageUrl.trim(),
          isPrimary: true,
        },
      });
    }

    console.log("✅ Menu item created:", menuItem.id);
    return NextResponse.json({ menuItem }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Обновить блюдо
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      id,
      categoryId,
      name,
      description,
      price,
      weightGrams,
      cookingTimeMinutes,
      imageUrl,
      isActive,
    } = body;

    console.log("🔄 Branch updating menu item:", { id, branchId: branchUser.branchId });

    // Проверяем существование блюда
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // РАЗРЕШАЕМ редактировать блюда из глобальных категорий (branchId = null)
    // Запрещаем только редактирование блюд из категорий ДРУГИХ филиалов
    if (
      existingItem.category.branchId &&
      existingItem.category.branchId !== branchUser.branchId
    ) {
      console.log("❌ Cannot edit items from other branches");
      return NextResponse.json(
        { error: "Cannot edit items from other branches" },
        { status: 403 }
      );
    }

    // Проверяем новую категорию
    if (categoryId !== existingItem.categoryId) {
      const newCategory = await prisma.menuCategory.findUnique({
        where: { id: categoryId },
      });

      if (!newCategory) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      // Разрешаем перемещать в глобальные категории и свои категории
      if (newCategory.branchId && newCategory.branchId !== branchUser.branchId) {
        return NextResponse.json(
          { error: "Cannot move to other branch category" },
          { status: 403 }
        );
      }
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        price,
        weightGrams,
        cookingTimeMinutes,
        isActive,
      },
    });

    // Обновляем изображение
    if (imageUrl !== undefined) {
      // Удаляем все старые изображения
      await prisma.menuItemImage.deleteMany({
        where: { menuItemId: id },
      });

      // Создаем новое, если оно не пустое
      if (imageUrl && imageUrl.trim() !== '') {
        await prisma.menuItemImage.create({
          data: {
            menuItemId: id,
            imageUrl: imageUrl.trim(),
            isPrimary: true,
          },
        });
      }
    }

    console.log("✅ Menu item updated:", menuItem.id);
    return NextResponse.json({ menuItem });
  } catch (error) {
    console.error("❌ Error updating menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить блюдо
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "branch") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    });

    if (!branchUser) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id } = body;

    console.log("🗑️ Branch deleting menu item:", { id, branchId: branchUser.branchId });

    // Проверяем существование блюда
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // РАЗРЕШАЕМ удалять блюда из глобальных категорий (branchId = null)
    // Запрещаем только удаление блюд из категорий ДРУГИХ филиалов
    if (
      existingItem.category.branchId &&
      existingItem.category.branchId !== branchUser.branchId
    ) {
      console.log("❌ Cannot delete items from other branches");
      return NextResponse.json(
        { error: "Cannot delete items from other branches" },
        { status: 403 }
      );
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    console.log("✅ Menu item deleted:", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
