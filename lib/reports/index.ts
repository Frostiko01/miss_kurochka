import { collectReportData } from './dataCollector'
import { generatePdfBuffer } from './pdfGenerator'
import { generateExcelBuffer } from './excelGenerator'
import { buildReportFileName } from './fileName'
import type { ReportFormatKey, ReportTypeKey } from './types'

interface GenerateArgs {
  type: ReportTypeKey
  format: ReportFormatKey
  periodStart: Date
  periodEnd: Date
  branchId?: string
  branchName?: string
}

export interface GeneratedReport {
  buffer: Buffer
  fileName: string
  contentType: string
}

export async function generateReport(args: GenerateArgs): Promise<GeneratedReport> {
  const data = await collectReportData({
    type: args.type,
    period: { start: args.periodStart, end: args.periodEnd },
    branchId: args.branchId,
    branchName: args.branchName,
  })

  let buffer: Buffer
  let contentType: string

  if (args.format === 'pdf') {
    buffer = generatePdfBuffer(data)
    contentType = 'application/pdf'
  } else {
    buffer = await generateExcelBuffer(data)
    contentType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }

  const fileName = buildReportFileName({
    type: args.type,
    format: args.format,
    periodStart: args.periodStart,
    periodEnd: args.periodEnd,
    branchName: args.branchName,
  })

  return { buffer, fileName, contentType }
}

export { buildReportFileName, buildContentDisposition } from './fileName'
export * from './types'
