import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/banners
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        creator: { select: { fullName: true, email: true } },
      },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Banners GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/banners
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, subtitle, imageUrl, linkTarget, sortOrder, isActive, startsAt, expiresAt } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "Заголовок и изображение обязательны" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        linkTarget: linkTarget || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error("Banners POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/banners — обновить баннер
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, subtitle, imageUrl, linkTarget, sortOrder, isActive, startsAt, expiresAt } = body;

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        linkTarget: linkTarget || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banners PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/banners — переключить isActive
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banners PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/banners
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banners DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
