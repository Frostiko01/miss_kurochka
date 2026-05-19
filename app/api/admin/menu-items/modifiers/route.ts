import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/menu-items/modifiers?menuItemId=xxx
 * Получить группы модификаторов блюда
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get("menuItemId");

    if (!menuItemId) {
      return NextResponse.json({ error: "menuItemId required" }, { status: 400 });
    }

    const modifiers = await prisma.menuItemModifier.findMany({
      where: { menuItemId },
      include: {
        modifierGroup: {
          include: {
            options: {
              where: { isActive: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ modifiers });
  } catch (error) {
    console.error("Error fetching modifiers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/menu-items/modifiers
 * Создать группу модификаторов и привязать к блюду
 * Body: { menuItemId, groupName, selectionType, isRequired, options: [{name, priceDelta}] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { menuItemId, groupName, selectionType = "single", isRequired = false, options = [] } = body;

    if (!menuItemId || !groupName) {
      return NextResponse.json({ error: "menuItemId and groupName required" }, { status: 400 });
    }

    if (!options || options.length < 1) {
      return NextResponse.json({ error: "Добавьте хотя бы одну опцию" }, { status: 400 });
    }

    // Создаём группу модификаторов
    const group = await prisma.modifierGroup.create({
      data: {
        name: groupName,
        selectionType,
        isRequired,
        isActive: true,
        options: {
          create: options.map((opt: { name: string; priceDelta: number }, i: number) => ({
            name: opt.name,
            priceDelta: Number(opt.priceDelta) || 0,
            isActive: true,
            isDefault: i === 0,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    // Привязываем группу к блюду
    const link = await prisma.menuItemModifier.create({
      data: {
        menuItemId,
        modifierGroupId: group.id,
        sortOrder: 0,
      },
    });

    return NextResponse.json({ group, link }, { status: 201 });
  } catch (error) {
    console.error("Error creating modifier group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/menu-items/modifiers?modifierGroupId=xxx&menuItemId=xxx
 * Удалить группу модификаторов и отвязать от блюда
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modifierGroupId = searchParams.get("modifierGroupId");
    const menuItemId = searchParams.get("menuItemId");

    if (!modifierGroupId || !menuItemId) {
      return NextResponse.json({ error: "modifierGroupId and menuItemId required" }, { status: 400 });
    }

    // Удаляем связь
    await prisma.menuItemModifier.deleteMany({
      where: { menuItemId, modifierGroupId },
    });

    // Удаляем группу (каскадно удалит опции)
    await prisma.modifierGroup.delete({
      where: { id: modifierGroupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting modifier group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
