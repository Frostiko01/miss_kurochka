import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReport, buildContentDisposition } from '@/lib/reports'
import type { ReportFormatKey, ReportTypeKey } from '@/lib/reports/types'

interface Params {
  params: Promise<{ id: string }>
}

// GET — повторное скачивание отчета по ID из истории
export async function GET(_request: NextRequest, { params }: Params) {
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

    const { id } = await params
    const record = await prisma.reportDownload.findUnique({ where: { id } })
    if (!record || record.branchId !== branchUser.branchId) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    const report = await generateReport({
      type: record.reportType as ReportTypeKey,
      format: record.format as ReportFormatKey,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      branchId: branchUser.branchId,
      branchName: branchUser.branch.name,
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
    console.error('Branch report re-download error:', error)
    return NextResponse.json(
      { error: 'Ошибка при перескачивании отчета' },
      { status: 500 },
    )
  }
}

// DELETE — удалить запись из истории
export async function DELETE(_request: NextRequest, { params }: Params) {
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

    const { id } = await params
    const record = await prisma.reportDownload.findUnique({ where: { id } })
    if (!record || record.branchId !== branchUser.branchId) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    await prisma.reportDownload.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Branch report delete error:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления записи' },
      { status: 500 },
    )
  }
}
