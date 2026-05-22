import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReport } from '@/lib/reports'
import type { ReportFormatKey, ReportTypeKey } from '@/lib/reports/types'

const VALID_TYPES: ReportTypeKey[] = [
  'sales',
  'orders',
  'menu_items',
  'customers',
  'popular_items',
  'full',
]
const VALID_FORMATS: ReportFormatKey[] = ['pdf', 'excel']

// POST — генерация отчета (любой филиал или все)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, format, periodStart, periodEnd, branchId } = body as {
      type: ReportTypeKey
      format: ReportFormatKey
      periodStart: string
      periodEnd: string
      branchId?: string | null
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
    end.setHours(23, 59, 59, 999)

    let branchName: string | undefined
    if (branchId) {
      const br = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { name: true },
      })
      if (!br) {
        return NextResponse.json({ error: 'Филиал не найден' }, { status: 404 })
      }
      branchName = br.name
    }

    const report = await generateReport({
      type,
      format,
      periodStart: start,
      periodEnd: end,
      branchId: branchId ?? undefined,
      branchName,
    })

    await prisma.reportDownload.create({
      data: {
        userId: session.user.id,
        branchId: branchId ?? null,
        reportType: type,
        format,
        periodStart: start,
        periodEnd: end,
        fileName: report.fileName,
        fileSize: report.buffer.length,
        scope: branchId ? 'branch' : 'all_branches',
        parameters: { type, format, branchId: branchId ?? null } as any,
      },
    })

    return new NextResponse(report.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': report.contentType,
        'Content-Disposition': `attachment; filename="${report.fileName}"`,
        'Content-Length': String(report.buffer.length),
      },
    })
  } catch (error) {
    console.error('Admin report generation error:', error)
    const message =
      error instanceof Error ? error.message : 'Ошибка при генерации отчета'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}

// GET — история скачиваний (все, с фильтром по филиалу)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const branchFilter = url.searchParams.get('branchId')

    const where: any = {}
    if (branchFilter === 'all') {
      where.branchId = null
    } else if (branchFilter) {
      where.branchId = branchFilter
    }

    const history = await prisma.reportDownload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const branchIds = Array.from(
      new Set(history.map((h) => h.branchId).filter((b): b is string => !!b)),
    )
    const userIds = Array.from(new Set(history.map((h) => h.userId)))

    const [branches, users] = await Promise.all([
      branchIds.length > 0
        ? prisma.branch.findMany({
            where: { id: { in: branchIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, fullName: true, email: true },
          })
        : Promise.resolve([]),
    ])

    const branchMap = new Map(branches.map((b) => [b.id, b.name]))
    const userMap = new Map(users.map((u) => [u.id, u.fullName]))

    return NextResponse.json({
      history: history.map((h) => ({
        id: h.id,
        reportType: h.reportType,
        format: h.format,
        scope: h.scope,
        periodStart: h.periodStart.toISOString(),
        periodEnd: h.periodEnd.toISOString(),
        fileName: h.fileName,
        fileSize: h.fileSize,
        createdAt: h.createdAt.toISOString(),
        branchId: h.branchId,
        branchName: h.branchId ? branchMap.get(h.branchId) ?? 'Удален' : 'Все филиалы',
        userId: h.userId,
        userName: userMap.get(h.userId) ?? '—',
      })),
    })
  } catch (error) {
    console.error('Admin report history error:', error)
    return NextResponse.json(
      { error: 'Ошибка получения истории' },
      { status: 500 },
    )
  }
}
