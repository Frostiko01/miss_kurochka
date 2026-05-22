import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ReportData } from './types'

const fmtDate = (d: Date) =>
  d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

// Транслитерация кириллицы для PDF (jsPDF без шрифта не поддерживает кириллицу)
const TRANSLIT_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh', З: 'Z',
  И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
  С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'H', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Sch',
  Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
  '«': '"', '»': '"', '—': '-', '–': '-', '№': 'No.',
}

function tr(s: string | number | undefined | null): string {
  if (s === null || s === undefined) return ''
  const str = String(s)
  let out = ''
  for (const ch of str) {
    out += TRANSLIT_MAP[ch] ?? ch
  }
  return out
}

export function generatePdfBuffer(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 40

  // Заголовок
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(tr(`Miss Kurochka — ${data.title}`), pageWidth / 2, y, { align: 'center' })
  y += 20

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (data.branchName) {
    doc.text(tr(`Filial: ${data.branchName}`), pageWidth / 2, y, { align: 'center' })
    y += 14
  } else {
    doc.text(tr('Vse filialy'), pageWidth / 2, y, { align: 'center' })
    y += 14
  }
  doc.text(
    tr(`Period: ${fmtDate(data.period.start)} — ${fmtDate(data.period.end)}`),
    pageWidth / 2,
    y,
    { align: 'center' },
  )
  y += 14
  doc.text(
    tr(`Sformirovan: ${data.generatedAt.toLocaleString('ru-RU')}`),
    pageWidth / 2,
    y,
    { align: 'center' },
  )
  y += 24

  // Секции
  for (const section of data.sections) {
    if (y > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage()
      y = 40
    }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(tr(section.title), 40, y)
    y += 12

    if (section.rows.length === 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text(tr('Net dannyh za vybrannyy period'), 40, y + 10)
      y += 30
    } else {
      autoTable(doc, {
        startY: y + 5,
        head: [section.columns.map((c) => tr(c))],
        body: section.rows.map((r) => r.map((c) => tr(c))),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [40, 47, 78], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 40, right: 40 },
      })
      // @ts-ignore - lastAutoTable добавляется плагином
      y = (doc as any).lastAutoTable.finalY + 12
    }

    if (section.summary && section.summary.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(tr('Itogi:'), 40, y)
      y += 12
      doc.setFont('helvetica', 'normal')
      for (const s of section.summary) {
        doc.text(tr(`• ${s.label}: ${s.value}`), 50, y)
        y += 12
      }
      y += 10
    }
  }

  // Футер с номерами страниц
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      tr(`Stranitsa ${i} iz ${pageCount}`),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' },
    )
  }

  const arrBuffer = doc.output('arraybuffer')
  return Buffer.from(arrBuffer)
}
