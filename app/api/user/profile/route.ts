import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH - Обновить профиль пользователя (телефон, имя)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { phone, fullName } = body;

    // Формируем объект обновления (только переданные поля)
    const updateData: any = {};

    if (typeof phone === "string") {
      // Простая валидация: только цифры и +, длина 10-15
      const cleaned = phone.replace(/[^+\d]/g, "");
      if (cleaned && (cleaned.length < 10 || cleaned.length > 15)) {
        return NextResponse.json(
          { error: "Некорректный номер телефона" },
          { status: 400 }
        );
      }
      updateData.phone = cleaned || null;
    }

    if (typeof fullName === "string" && fullName.trim()) {
      if (fullName.trim().length < 2) {
        return NextResponse.json(
          { error: "Имя должно содержать минимум 2 символа" },
          { status: 400 }
        );
      }
      updateData.fullName = fullName.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Нет данных для обновления" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json({ user, message: "Профиль обновлён" });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления профиля" },
      { status: 500 }
    );
  }
}
