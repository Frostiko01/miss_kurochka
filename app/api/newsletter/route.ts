import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Схема валидации email
const newsletterSchema = z.object({
  email: z.string().email('Неверный формат email'),
})

// POST /api/newsletter - подписка на рассылку
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидация
    const validation = newsletterSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Ошибка валидации данных' },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Проверка существует ли уже такой email
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: 'Этот email уже подписан на рассылку' },
          { status: 400 }
        )
      } else {
        // Реактивация подписки
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true },
        })
        return NextResponse.json({
          success: true,
          message: 'Подписка успешно возобновлена!',
        })
      }
    }

    // Создание новой подписки
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Вы успешно подписались на рассылку!',
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Не удалось оформить подписку' },
      { status: 500 }
    )
  }
}
