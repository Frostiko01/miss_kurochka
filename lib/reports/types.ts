// Типы для системы отчетов

export type ReportTypeKey =
  | 'sales'
  | 'orders'
  | 'order_items'
  | 'menu_items'
  | 'customers'
  | 'popular_items'
  | 'full'

export type ReportFormatKey = 'pdf' | 'excel'

export type ReportScopeKey = 'branch' | 'all_branches'

export interface ReportPeriod {
  start: Date
  end: Date
}

export interface ReportRequest {
  type: ReportTypeKey
  format: ReportFormatKey
  scope: ReportScopeKey
  periodStart: string // ISO
  periodEnd: string // ISO
  branchId?: string // для админа: фильтр по конкретному филиалу
}

export interface ReportSection {
  title: string
  columns: string[]
  rows: (string | number)[][]
  summary?: { label: string; value: string }[]
}

export interface ReportData {
  title: string
  branchName?: string
  period: ReportPeriod
  generatedAt: Date
  sections: ReportSection[]
}

export const REPORT_TYPE_LABELS: Record<ReportTypeKey, string> = {
  sales: 'Отчет по продажам',
  orders: 'Отчет по заказам',
  order_items: 'Детализация по блюдам',
  menu_items: 'Отчет по блюдам',
  customers: 'Отчет по клиентам',
  popular_items: 'Популярные блюда',
  full: 'Полный отчет',
}

export const REPORT_FORMAT_LABELS: Record<ReportFormatKey, string> = {
  pdf: 'PDF',
  excel: 'Excel',
}
