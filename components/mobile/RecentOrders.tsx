'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, UtensilsCrossed, Truck, Store } from 'lucide-react'

interface OrderPreview {
  id: string
  orderNumber: string
  status: string
  orderType: 'pickup' | 'delivery'
  totalAmount: number | string
  createdAt: string
  items: {
    id: string
    quantity: number
    menuItem?: { name: string; images?: { imageUrl: string }[] } | null
    comboOffer?: { name: string; imageUrl?: string | null } | null
  }[]
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Новый',       color: '#b45309', bg: '#fef3c7' },
  confirmed:  { label: 'Принят',      color: '#1d4ed8', bg: '#dbeafe' },
  preparing:  { label: 'Готовится',   color: '#c2410c', bg: '#ffedd5' },
  ready:      { label: 'Готов',       color: '#047857', bg: '#d1fae5' },
  delivering: { label: 'В пути',      color: '#7e22ce', bg: '#f3e8ff' },
  completed:  { label: 'Получен',     color: '#047857', bg: '#d1fae5' },
  cancelled:  { label: 'Отменён',     color: '#b91c1c', bg: '#fee2e2' },
}

interface Props {
  isAuthenticated: boolean
}

export default function RecentOrders({ isAuthenticated }: Props) {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      Promise.resolve().then(() => setLoading(false))
      return
    }
    let cancelled = false
    fetch('/api/orders')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const list: OrderPreview[] = data?.orders ?? []
        // Только активные / последние 3
        const sorted = list
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
        setOrders(sorted)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  if (!isAuthenticated || (!loading && orders.length === 0)) return null

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-base font-extrabold tracking-tight">Ваши заказы</h2>
        <button
          onClick={() => router.push('/orders')}
          className="text-xs font-bold text-[var(--brand)] inline-flex items-center"
        >
          Все
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          orders.map((order) => {
            const meta = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending
            const firstItem = order.items[0]
            const itemImage =
              firstItem?.menuItem?.images?.[0]?.imageUrl ??
              firstItem?.comboOffer?.imageUrl ??
              null
            const totalCount = order.items.reduce((s, i) => s + i.quantity, 0)
            const TypeIcon = order.orderType === 'delivery' ? Truck : Store

            return (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[var(--border)] active:scale-[0.99] transition-transform text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] overflow-hidden shrink-0 flex items-center justify-center">
                  {itemImage ? (
                    <img src={itemImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="w-5 h-5 text-[var(--fg-subtle)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <TypeIcon className="w-3 h-3 text-[var(--fg-subtle)]" />
                    <span className="text-[11px] font-bold text-[var(--fg-subtle)]">
                      {order.orderNumber}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide"
                      style={{ color: meta.color, backgroundColor: meta.bg }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">
                    {firstItem?.menuItem?.name ??
                      firstItem?.comboOffer?.name ??
                      'Заказ'}
                    {totalCount > 1 && (
                      <span className="text-[var(--fg-muted)] font-semibold">
                        {' '}и ещё {totalCount - 1}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold leading-none">
                    {Number(order.totalAmount)}
                  </div>
                  <div className="text-[10px] text-[var(--fg-muted)] font-semibold mt-0.5">
                    сом
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[var(--border)]">
      <div className="w-12 h-12 rounded-xl skeleton shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-1/3 skeleton" />
        <div className="h-3 w-2/3 skeleton" />
      </div>
    </div>
  )
}
