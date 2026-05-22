import ExcelJS from 'exceljs'
import type { ReportData } from './types'

const fmtDate = (d: Date) =>
  d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

export async function generateExcelBuffer(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Miss Kurochka'
  workbook.created = data.generatedAt

  // Лист с шапкой
  const overviewSheet = workbook.addWorksheet('Обзор')
  overviewSheet.columns = [
    { header: '', key: 'label', width: 30 },
    { header: '', key: 'value', width: 60 },
  ]

  overviewSheet.addRow(['Отчет', data.title])
  overviewSheet.addRow(['Филиал', data.branchName ?? 'Все филиалы'])
  overviewSheet.addRow([
    'Период',
    `${fmtDate(data.period.start)} — ${fmtDate(data.period.end)}`,
  ])
  overviewSheet.addRow(['Сформирован', data.generatedAt.toLocaleString('ru-RU')])
  overviewSheet.getColumn('label').font = { bold: true }

  // Стилизация шапки
  for (let i = 1; i <= 4; i++) {
    const row = overviewSheet.getRow(i)
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle' }
    })
  }

  // Каждая секция — отдельный лист
  for (const section of data.sections) {
    const sheetName = section.title.slice(0, 28).replace(/[\\/?*[\]:]/g, ' ')
    const sheet = workbook.addWorksheet(sheetName)

    // Заголовок секции
    sheet.mergeCells(1, 1, 1, Math.max(section.columns.length, 1))
    const titleCell = sheet.getCell(1, 1)
    titleCell.value = section.title
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF282F4E' },
    }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 24

    // Заголовки колонок
    const headerRow = sheet.addRow(section.columns)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4047EE' },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    // Данные
    if (section.rows.length === 0) {
      const emptyRow = sheet.addRow(['Нет данных за выбранный период'])
      sheet.mergeCells(emptyRow.number, 1, emptyRow.number, section.columns.length)
      emptyRow.font = { italic: true, color: { argb: 'FF999999' } }
      emptyRow.alignment = { horizontal: 'center' }
    } else {
      for (const row of section.rows) {
        const r = sheet.addRow(row)
        r.eachCell((cell) => {
          cell.border = {
            top: { style: 'hair', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'hair', color: { argb: 'FFEEEEEE' } },
            left: { style: 'hair', color: { argb: 'FFEEEEEE' } },
            right: { style: 'hair', color: { argb: 'FFEEEEEE' } },
          }
        })
      }
    }

    // Автоподбор ширины колонок
    sheet.columns.forEach((col, idx) => {
      let maxLen = section.columns[idx]?.length ?? 10
      for (const row of section.rows) {
        const v = row[idx]
        const len = String(v ?? '').length
        if (len > maxLen) maxLen = len
      }
      col.width = Math.min(Math.max(maxLen + 2, 12), 50)
    })

    // Итоги
    if (section.summary && section.summary.length > 0) {
      sheet.addRow([])
      const summaryHeader = sheet.addRow(['Итоги'])
      summaryHeader.font = { bold: true, size: 12 }

      for (const s of section.summary) {
        const row = sheet.addRow([s.label, s.value])
        row.getCell(1).font = { bold: true }
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
