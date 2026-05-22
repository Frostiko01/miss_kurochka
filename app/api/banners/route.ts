import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/banners — публичный API активных баннеров для лендинга
export async function GET() {
  try {
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        linkTarget: true,
        sortOrder: true,
      },
    });

    const response = NextResponse.json({ banners });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("Public banners GET error:", error);
    return NextResponse.json({ banners: [] });
  }
}
