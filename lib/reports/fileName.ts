import type { ReportFormatKey, ReportTypeKey } from './types'

const TYPE_SLUGS: Record<ReportTypeKey, string> = {
  sales: 'sales',
  orders: 'orders',
  order_items: 'order-items',
  menu_items: 'menu',
  customers: 'customers',
  popular_items: 'popular',
  full: 'full',
}

const fmt = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

export function buildReportFileName(args: {
  type: ReportTypeKey
  format: ReportFormatKey
  periodStart: Date
  periodEnd: Date
  branchName?: string | null
}): string {
  const type = TYPE_SLUGS[args.type]
  const ext = args.format === 'pdf' ? 'pdf' : 'xlsx'
  const branch = args.branchName
    ? args.branchName
        .toLowerCase()
        .replace(/[^a-zа-я0-9]+/giu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30) || 'branch'
    : 'all-branches'
  return `report-${type}-${branch}-${fmt(args.periodStart)}-${fmt(args.periodEnd)}.${ext}`
}
