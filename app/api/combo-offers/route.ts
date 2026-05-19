import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Получить активные комбо для главной страницы (публичный API)
export async function GET(request: NextRequest) {
  try {
    const combos = await prisma.comboOffer.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        comboItems: {
          orderBy: { sortOrder: "asc" },
          include: {
            menuItem: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Нормализуем: items — массив названий блюд для отображения на карточке
    const normalized = combos.map((combo) => ({
      ...combo,
      price: Number(combo.price),
      oldPrice: combo.oldPrice ? Number(combo.oldPrice) : null,
      items: combo.comboItems.map((ci) => ci.menuItem.name),
    }));

    return NextResponse.json({ combos: normalized });
  } catch (error) {
    console.error("Error fetching combo offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch combo offers" },
      { status: 500 }
    );
  }
}
