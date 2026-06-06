import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/serverCache";

export const dynamic = "force-dynamic";

// GET - Получить активные комбо для главной страницы (публичный API)
export async function GET(request: NextRequest) {
  try {
    const combos = await cached("combo-offers:active", 60_000, () =>
      prisma.comboOffer.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          nameI18n: true,
          description: true,
          price: true,
          oldPrice: true,
          imageUrl: true,
          sortOrder: true,
          type: true,
          comboItems: {
            orderBy: { sortOrder: "asc" },
            select: {
              menuItem: { select: { id: true, name: true } },
            },
          },
        },
      }),
    );

    const normalized = combos.map((combo) => ({
      id: combo.id,
      name: combo.name,
      nameI18n: combo.nameI18n,
      description: combo.description,
      price: Number(combo.price),
      oldPrice: combo.oldPrice ? Number(combo.oldPrice) : null,
      imageUrl: combo.imageUrl,
      sortOrder: combo.sortOrder,
      type: combo.type,
      items: combo.comboItems.map((ci) => ci.menuItem.name),
    }));

    const response = NextResponse.json({ combos: normalized });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("Error fetching combo offers:", error);
    return NextResponse.json({ error: "Failed to fetch combo offers" }, { status: 500 });
  }
}
