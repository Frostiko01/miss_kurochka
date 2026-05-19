import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: id,
        customerId: session.user.id,
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                images: {
                  where: {
                    isPrimary: true,
                  },
                },
              },
            },
            comboOffer: true,
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
          },
        },
        payments: true,
        branch: true,
        deliveryAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Заказ не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Ошибка получения заказа" },
      { status: 500 }
    );
  }
}
