import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Публичный API для получения меню
 * GET /api/menu?branchId=xxx
 * 
 * Возвращает:
 * - Все активные категории (глобальные + все категории филиалов)
 * - Все активные блюда в этих категориях
 * - Учитывает стоп-лист выбранного филиала (если указан)
 * - Группирует по типам категорий (regular, combo, mini_combo)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    // Получаем ВСЕ активные категории (независимо от филиала)
    const categories = await prisma.menuCategory.findMany({
      where: {
        status: "active",
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Получаем все активные блюда из этих категорий
    const categoryIds = categories.map((c) => c.id);

    const menuItems = await prisma.menuItem.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            branchId: true,
          },
        },
        images: {
          orderBy: {
            isPrimary: "desc",
          },
        },
        modifiers: {
          include: {
            modifierGroup: {
              include: {
                options: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        },
        stopList: branchId
          ? {
              where: {
                branchId,
                restoredAt: null, // Только активные записи стоп-листа
              },
              select: {
                id: true,
                reason: true,
                expectedReturnAt: true,
              },
            }
          : undefined,
      },
    });

    // Фильтруем блюда, которые в стоп-листе
    const availableItems = menuItems.filter((item) => {
      if (!branchId) return true; // Если филиал не выбран, показываем все
      return item.stopList.length === 0; // Показываем только если не в стоп-листе
    });

    // Группируем по категориям
    const categoriesWithItems = categories.map((category) => {
      const items = availableItems
        .filter((item) => item.categoryId === category.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          nameI18n: item.nameI18n,
          description: item.description,
          descriptionI18n: item.descriptionI18n,
          price: item.price,
          weightGrams: item.weightGrams,
          volumeMl: item.volumeMl,
          cookingTimeMinutes: item.cookingTimeMinutes,
          calories: item.calories,
          proteins: item.proteins,
          fats: item.fats,
          carbohydrates: item.carbohydrates,
          ingredients: item.ingredients,
          allergens: item.allergens,
          spicyLevel: item.spicyLevel,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          isFeatured: item.isFeatured,
          isNew: item.isNew,
          images: item.images.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          })),
          modifiers: item.modifiers.map((mod) => ({
            id: mod.id,
            sortOrder: mod.sortOrder,
            group: {
              id: mod.modifierGroup.id,
              name: mod.modifierGroup.name,
              nameI18n: mod.modifierGroup.nameI18n,
              selectionType: mod.modifierGroup.selectionType,
              isRequired: mod.modifierGroup.isRequired,
              minSelections: mod.modifierGroup.minSelections,
              maxSelections: mod.modifierGroup.maxSelections,
              options: mod.modifierGroup.options.map((opt) => ({
                id: opt.id,
                name: opt.name,
                nameI18n: opt.nameI18n,
                priceDelta: opt.priceDelta,
                isDefault: opt.isDefault,
              })),
            },
          })),
        }));

      return {
        id: category.id,
        name: category.name,
        nameI18n: category.nameI18n,
        description: category.description,
        imageUrl: category.imageUrl,
        type: category.type,
        sortOrder: category.sortOrder,
        isGlobal: category.branchId === null,
        branch: category.branch,
        itemsCount: items.length,
        items,
      };
    });

    // Группируем по типам
    const grouped = {
      regular: categoriesWithItems.filter((c) => c.type === "regular"),
      combo: categoriesWithItems.filter((c) => c.type === "combo"),
      mini_combo: categoriesWithItems.filter((c) => c.type === "mini_combo"),
    };

    return NextResponse.json({
      categories: categoriesWithItems,
      grouped,
      totalCategories: categoriesWithItems.length,
      totalItems: availableItems.length,
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
