import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReport, buildContentDisposition } from '@/lib/reports'
import type {
  ReportFormatKey,
  ReportTypeKey,
} from '@/lib/reports/types'

const VALID_TYPES: ReportTypeKey[] = [
  'sales',
  'orders',
  'order_items',
  'menu_items',
  'customers',
  'popular_items',
  'full',
]
const VALID_FORMATS: ReportFormatKey[] = ['pdf', 'excel']

// POST — сгенерировать отчет и записать в историю
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'branch') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
      include: { branch: true },
    })
    if (!branchUser) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, format, periodStart, periodEnd } = body as {
      type: ReportTypeKey
      format: ReportFormatKey
      periodStart: string
      periodEnd: string
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Неверный тип отчета' }, { status: 400 })
    }
    if (!VALID_FORMATS.includes(format)) {
      return NextResponse.json({ error: 'Неверный формат' }, { status: 400 })
    }

    const start = new Date(periodStart)
    const end = new Date(periodEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Неверные даты' }, { status: 400 })
    }
    if (start > end) {
      return NextResponse.json(
        { error: 'Начало периода должно быть раньше конца' },
        { status: 400 },
      )
    }
    // Включаем весь день конца периода
    end.setHours(23, 59, 59, 999)

    const report = await generateReport({
      type,
      format,
      periodStart: start,
      periodEnd: end,
      branchId: branchUser.branchId,
      branchName: branchUser.branch.name,
    })

    // Сохраняем в историю
    await prisma.reportDownload.create({
      data: {
        userId: session.user.id,
        branchId: branchUser.branchId,
        reportType: type,
        format,
        periodStart: start,
        periodEnd: end,
        fileName: report.fileName,
        fileSize: report.buffer.length,
        scope: 'branch',
        parameters: { type, format } as any,
      },
    })

    return new NextResponse(report.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': report.contentType,
        'Content-Disposition': buildContentDisposition(report.fileName),
        'Content-Length': String(report.buffer.length),
      },
    })
  } catch (error) {
    console.error('Branch report generation error:', error)
    const message =
      error instanceof Error ? error.message : 'Ошибка при генерации отчета'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}

// GET — список истории скачиваний
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'branch') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branchUser = await prisma.branchUser.findFirst({
      where: { userId: session.user.id },
    })
    if (!branchUser) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    const history = await prisma.reportDownload.findMany({
      where: { branchId: branchUser.branchId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      history: history.map((h) => ({
        id: h.id,
        reportType: h.reportType,
        format: h.format,
        periodStart: h.periodStart.toISOString(),
        periodEnd: h.periodEnd.toISOString(),
        fileName: h.fileName,
        fileSize: h.fileSize,
        createdAt: h.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Branch report history error:', error)
    return NextResponse.json(
      { error: 'Ошибка получения истории' },
      { status: 500 },
    )
  }
}
