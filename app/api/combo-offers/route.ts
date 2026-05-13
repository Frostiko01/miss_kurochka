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
    });

    return NextResponse.json({ combos });
  } catch (error) {
    console.error("Error fetching combo offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch combo offers" },
      { status: 500 }
    );
  }
}
