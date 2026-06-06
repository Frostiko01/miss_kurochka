import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { geocodeAddress } from "@/lib/branchSelector";

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
      latitude,
      longitude,
    } = body;

    if (!addressLine) {
      return NextResponse.json(
        { error: "Не указан адрес" },
        { status: 400 }
      );
    }

    // Парсим координаты, если они переданы
    const lat =
      typeof latitude === "number"
        ? latitude
        : typeof latitude === "string" && latitude !== ""
          ? Number(latitude)
          : null;
    const lng =
      typeof longitude === "number"
        ? longitude
        : typeof longitude === "string" && longitude !== ""
          ? Number(longitude)
          : null;

    // Проверяем валидность координат (в пределах Кыргызстана, не 0,0)
    const isValidCoord = (la: number | null, ln: number | null) =>
      la !== null &&
      ln !== null &&
      !isNaN(la) &&
      !isNaN(ln) &&
      la !== 0 &&
      ln !== 0 &&
      la >= 39 &&
      la <= 44 &&
      ln >= 69 &&
      ln <= 81;

    let finalLat = isValidCoord(lat, lng) ? lat : null;
    let finalLng = isValidCoord(lat, lng) ? lng : null;

    // Если координат нет (адрес введён вручную без карты) — геокодируем текст,
    // чтобы заказ сразу уходил в ближайший филиал и расстояние считалось верно.
    if (finalLat === null || finalLng === null) {
      try {
        const geo = await geocodeAddress(addressLine);
        if (geo) {
          finalLat = geo.lat;
          finalLng = geo.lng;
        }
      } catch (e) {
        console.warn("[addresses] Geocode failed, saving without coords:", e);
      }
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
        latitude: finalLat,
        longitude: finalLng,
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
