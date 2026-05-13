import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Публичный API для получения дополнительных предложений (соусы и т.д.)
 * GET /api/additional-offers?category=sauce
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    const offers = await prisma.additionalOffer.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Группируем по категориям
    const grouped = offers.reduce((acc: any, offer) => {
      if (!acc[offer.category]) {
        acc[offer.category] = [];
      }
      acc[offer.category].push(offer);
      return acc;
    }, {});

    return NextResponse.json({
      offers,
      grouped,
      categories: Object.keys(grouped),
    });
  } catch (error) {
    console.error("Error fetching additional offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch additional offers" },
      { status: 500 }
    );
  }
}
