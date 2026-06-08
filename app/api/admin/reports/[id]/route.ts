import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReport, buildContentDisposition } from '@/lib/reports'
import type { ReportFormatKey, ReportTypeKey } from '@/lib/reports/types'

interface Params {
  params: Promise<{ id: string }>
}

// GET — повторное скачивание
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const record = await prisma.reportDownload.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    let branchName: string | undefined
    if (record.branchId) {
      const br = await prisma.branch.findUnique({
        where: { id: record.branchId },
        select: { name: true },
      })
      branchName = br?.name
    }

    const report = await generateReport({
      type: record.reportType as ReportTypeKey,
      format: record.format as ReportFormatKey,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      branchId: record.branchId ?? undefined,
      branchName,
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
    console.error('Admin report re-download error:', error)
    return NextResponse.json(
      { error: 'Ошибка при перескачивании' },
      { status: 500 },
    )
  }
}

// DELETE — удалить запись
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await prisma.reportDownload.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin report delete error:', error)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}
