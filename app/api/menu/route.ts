import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickBestBranch } from "@/lib/branchSelector";
import { cached } from "@/lib/serverCache";

// Отключаем статическое кэширование Next.js — роут динамический (читает searchParams)
export const dynamic = "force-dynamic";

/**
 * Публичный API для получения меню
 * GET /api/menu?branchId=xxx
 * GET /api/menu?lat=42.87&lng=74.59   — автоопределение ближайшего филиала
 *
 * Возвращает:
 * - Все активные категории (глобальные + все категории филиалов)
 * - Все активные блюда в этих категориях
 * - Учитывает стоп-лист ближайшего/выбранного филиала
 * - Группирует по типам категорий (regular, combo, mini_combo)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let branchId = searchParams.get("branchId");

    // Если branchId не передан, но есть координаты — определяем ближайший филиал
    if (!branchId) {
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");
      if (lat && lng) {
        const picked = await pickBestBranch({
          customerCoord: { lat: parseFloat(lat), lng: parseFloat(lng) },
        });
        if (picked) branchId = picked.branchId;
      }
    }

    // Тяжёлый запрос меню кэшируем ГЛОБАЛЬНО (без стоп-листа) на 60 сек.
    // Стоп-лист зависит от филиала и должен быть всегда свежим, поэтому его
    // грузим отдельным лёгким запросом ниже и применяем фильтром.
    const categories = await cached("menu:categories:all", 60_000, () =>
      prisma.menuCategory.findMany({
        where: { status: "active" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          nameI18n: true,
          description: true,
          imageUrl: true,
          type: true,
          sortOrder: true,
          branchId: true,
          branch: { select: { id: true, name: true } },
          menuItems: {
            where: { isActive: true },
            select: {
              id: true,
              branchId: true,
              name: true,
              nameI18n: true,
              description: true,
              descriptionI18n: true,
              cookingTimeMinutes: true,
              ingredients: true,
              spicyLevel: true,
              isVegetarian: true,
              isVegan: true,
              isFeatured: true,
              isNew: true,
              images: {
                orderBy: { isPrimary: "desc" },
                select: { id: true, imageUrl: true, isPrimary: true },
              },
              sizes: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  name: true,
                  price: true,
                  weightGrams: true,
                  sortOrder: true,
                },
              },
              spices: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                select: { id: true, name: true, price: true, sortOrder: true },
              },
              modifiers: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  sortOrder: true,
                  modifierGroup: {
                    select: {
                      id: true,
                      name: true,
                      nameI18n: true,
                      selectionType: true,
                      isRequired: true,
                      minSelections: true,
                      maxSelections: true,
                      options: {
                        where: { isActive: true },
                        orderBy: { createdAt: "asc" },
                        select: {
                          id: true,
                          name: true,
                          nameI18n: true,
                          priceDelta: true,
                          isDefault: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    );

    // Стоп-лист филиала — отдельный лёгкий запрос, всегда актуальный (не кэшируется).
    let stopSet: Set<string> | null = null;
    if (branchId) {
      const stops = await prisma.stopList.findMany({
        where: { branchId, restoredAt: null },
        select: { menuItemId: true },
      });
      stopSet = new Set(stops.map((s) => s.menuItemId));
    }

    // Формируем ответ
    const categoriesWithItems = categories.map((category) => {
      const items = category.menuItems
        .filter((item) => {
          // Индивидуальное меню филиала: показываем глобальные блюда
          // (branchId === null) и блюда выбранного филиала. Чужие — скрываем.
          if (item.branchId && item.branchId !== branchId) return false;
          if (!stopSet) return true;
          // Скрываем блюда из актуального стоп-листа филиала
          return !stopSet.has(item.id);
        })
        .map((item) => ({
          id: item.id,
          name: item.name,
          nameI18n: item.nameI18n,
          description: item.description,
          descriptionI18n: item.descriptionI18n,
          cookingTimeMinutes: item.cookingTimeMinutes,
          ingredients: item.ingredients,
          spicyLevel: item.spicyLevel,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          isFeatured: item.isFeatured,
          isNew: item.isNew,
          images: item.images,
          sizes: item.sizes.map((s) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            weightGrams: s.weightGrams,
            sortOrder: s.sortOrder,
          })),
          spices: item.spices.map((sp) => ({
            id: sp.id,
            name: sp.name,
            price: Number(sp.price),
            sortOrder: sp.sortOrder,
          })),
          price: item.sizes.length > 0 ? Number(item.sizes[0].price) : 0,
          weightGrams: item.sizes[0]?.weightGrams ?? null,
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

    const grouped = {
      regular: categoriesWithItems.filter((c) => c.type === "regular"),
      combo: categoriesWithItems.filter((c) => c.type === "combo"),
      mini_combo: categoriesWithItems.filter((c) => c.type === "mini_combo"),
    };

    const response = NextResponse.json({
      categories: categoriesWithItems,
      grouped,
      totalCategories: categoriesWithItems.length,
      totalItems: categoriesWithItems.reduce((sum, c) => sum + c.itemsCount, 0),
      resolvedBranchId: branchId ?? null,
    });

    // HTTP-кэш: браузер и CDN кэшируют на 60 сек, stale-while-revalidate 300 сек
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
