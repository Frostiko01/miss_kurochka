import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Получить адреса пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const addresses = await prisma.deliveryAddress.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Ошибка получения адресов" },
      { status: 500 }
    );
  }
}

// POST - Добавить новый адрес
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const {
      addressLine,
      apartment,
      entrance,
      floor,
      intercom,
      comment,
    } = body;

    if (!addressLine) {
      return NextResponse.json(
        { error: "Не указан адрес" },
        { status: 400 }
      );
    }

    const address = await prisma.deliveryAddress.create({
      data: {
        userId: session.user.id,
        addressLine,
        apartment: apartment || null,
        entrance: entrance || null,
        floor: floor || null,
        intercom: intercom || null,
        comment: comment || null,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Ошибка создания адреса" },
      { status: 500 }
    );
  }
}

// DELETE - Удалить адрес
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return NextResponse.json(
        { error: "Не указан адрес" },
        { status: 400 }
      );
    }

    // Проверяем что адрес принадлежит пользователю
    const address = await prisma.deliveryAddress.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Адрес не найден" },
        { status: 404 }
      );
    }

    await prisma.deliveryAddress.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ message: "Адрес удален" });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Ошибка удаления адреса" },
      { status: 500 }
    );
  }
}
