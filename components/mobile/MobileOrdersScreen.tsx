'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Truck,
  Store,
  ChevronRight,
  RefreshCcw,
  UtensilsCrossed,
} from 'lucide-react'
import MobileSubScreen from './MobileSubScreen'

type Tab = 'active' | 'completed' | 'cancelled'

interface OrderItem {
  id: string
  quantity: number
  menuItem?: { name: string; images?: { imageUrl: string }[] } | null
  comboOffer?: { name: string; imageUrl?: string | null } | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  orderType: 'delivery' | 'pickup'
  totalAmount: number | string
  createdAt: string
  items: OrderItem[]
  branch?: { name?: string } | null
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; tab: Tab }> = {
  pending:    { label: 'Новый',     color: '#b45309', bg: '#fef3c7', tab: 'active' },
  confirmed:  { label: 'Принят',    color: '#1d4ed8', bg: '#dbeafe', tab: 'active' },
  preparing:  { label: 'Готовится', color: '#c2410c', bg: '#ffedd5', tab: 'active' },
  ready:      { label: 'Готов',     color: '#047857', bg: '#d1fae5', tab: 'active' },
  delivering: { label: 'В пути',    color: '#7e22ce', bg: '#f3e8ff', tab: 'active' },
  completed:  { label: 'Получен',   color: '#047857', bg: '#d1fae5', tab: 'completed' },
  cancelled:  { label: 'Отменён',   color: '#b91c1c', bg: '#fee2e2', tab: 'cancelled' },
}

export default function MobileOrdersScreen() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('active')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/orders')
      const d = await r.json()
      if (r.ok) setOrders(d.orders ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/orders')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        if (d?.orders) setOrders(d.orders)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const acc: Record<Tab, number> = { active: 0, completed: 0, cancelled: 0 }
    orders.forEach((o) => {
      const t = STATUS_META[o.status]?.tab
      if (t) acc[t] += 1
    })
    return acc
  }, [orders])

  const filtered = useMemo(
    () => orders.filter((o) => STATUS_META[o.status]?.tab === tab),
    [orders, tab],
  )

  return (
    <MobileSubScreen
      title="Заказы"
      back={false}
      rightSlot={
        <button
          onClick={fetchOrders}
          aria-label="Обновить"
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-[var(--bg-muted)] active:scale-95 transition-all"
        >
          <RefreshCcw
            className={`w-[18px] h-[18px] text-[var(--fg)] ${loading ? 'animate-spin' : ''}`}
            strokeWidth={2}
          />
        </button>
      }
    >
      {/* Segmented control */}
      <div className="px-4 pt-3">
        <div
          className="flex p-1 rounded-2xl"
          style={{ background: 'var(--bg-muted)' }}
        >
          <SegBtn active={tab === 'active'} onClick={() => setTab('active')} count={counts.active}>
            Активные
          </SegBtn>
          <SegBtn active={tab === 'completed'} onClick={() => setTab('completed')} count={counts.completed}>
            Завершённые
          </SegBtn>
          <SegBtn active={tab === 'cancelled'} onClick={() => setTab('cancelled')} count={counts.cancelled}>
            Отменённые
          </SegBtn>
        </div>
      </div>

      {/* List */}
      <div
        className="px-4 pt-4 space-y-2.5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 100px)' }}
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} onGoMenu={() => router.push('/menu')} />
        ) : (
          filtered.map((o) => <OrderCard key={o.id} order={o} onClick={() => router.push(`/orders/${o.id}`)} />)
        )}
      </div>
    </MobileSubScreen>
  )
}

function SegBtn({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
      style={{
        background: active ? '#fff' : 'transparent',
        color: active ? 'var(--fg)' : 'var(--fg-muted)',
        boxShadow: active ? '0 2px 8px rgba(15,15,16,0.08)' : 'none',
      }}
    >
      <span>{children}</span>
      {count > 0 && (
        <span
          className="min-w-[16px] h-4 px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center"
          style={{
            background: active ? 'var(--brand-soft)' : 'var(--border)',
            color: active ? 'var(--brand)' : 'var(--fg-muted)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pending
  const TypeIcon = order.orderType === 'delivery' ? Truck : Store
  const totalCount = order.items.reduce((s, i) => s + i.quantity, 0)
  const firstItem = order.items[0]
  const itemImage =
    firstItem?.menuItem?.images?.[0]?.imageUrl ??
    firstItem?.comboOffer?.imageUrl ??
    null
  const date = new Date(order.createdAt)

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-[var(--border)] p-3 text-left active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 1px 3px rgba(15,15,16,0.04)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0 flex items-center justify-center">
          {itemImage ? (
            <img src={itemImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <UtensilsCrossed className="w-5 h-5 text-[var(--fg-subtle)]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--fg-subtle)]">
              #{order.orderNumber}
            </span>
            <span className="text-[var(--fg-subtle)] text-[11px]">·</span>
            <span className="text-[11px] font-semibold text-[var(--fg-subtle)]">
              {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-sm font-extrabold mt-0.5 truncate">
            {firstItem?.menuItem?.name ?? firstItem?.comboOffer?.name ?? 'Заказ'}
            {totalCount > 1 && (
              <span className="text-[var(--fg-muted)] font-bold"> и ещё {totalCount - 1}</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide"
              style={{ color: meta.color, backgroundColor: meta.bg }}
            >
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--fg-muted)]">
              <TypeIcon className="w-3 h-3" />
              {order.orderType === 'delivery' ? 'Доставка' : 'Самовывоз'}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-2">
          <div>
            <div className="text-sm font-extrabold leading-none">{Number(order.totalAmount)}</div>
            <div className="text-[10px] text-[var(--fg-muted)] font-bold mt-0.5">сом</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)]" />
        </div>
      </div>

      {/* Reorder/Track button (active only) */}
      {meta.tab === 'active' && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-extrabold"
        >
          <Package className="w-3.5 h-3.5" />
          Отследить заказ
        </div>
      )}
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-3 flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl skeleton shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-1/3 skeleton" />
        <div className="h-3 w-2/3 skeleton" />
        <div className="h-2.5 w-1/2 skeleton" />
      </div>
    </div>
  )
}

function EmptyState({ tab, onGoMenu }: { tab: Tab; onGoMenu: () => void }) {
  const labels: Record<Tab, { title: string; subtitle: string }> = {
    active: { title: 'Нет активных заказов', subtitle: 'Закажите что-нибудь вкусное' },
    completed: { title: 'История пуста', subtitle: 'Здесь появятся ваши завершённые заказы' },
    cancelled: { title: 'Отменённых заказов нет', subtitle: 'И это хорошо' },
  }
  const meta = labels[tab]
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center mb-3">
        <Package className="w-7 h-7 text-[var(--fg-subtle)]" />
      </div>
      <h3 className="text-base font-extrabold mb-1">{meta.title}</h3>
      <p className="text-sm text-[var(--fg-muted)] mb-5">{meta.subtitle}</p>
      {tab === 'active' && (
        <button onClick={onGoMenu} className="btn btn-primary inline-flex">
          Перейти в меню
        </button>
      )}
    </div>
  )
}
