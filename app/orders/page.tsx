'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Package, Truck, Store, ArrowLeft, ChevronRight } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтвержден',
  preparing: 'Готовится',
  ready: 'Готов',
  delivering: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  preparing: 'badge-warning',
  ready: 'badge-success',
  delivering: 'badge-info',
  completed: 'badge',
  cancelled: 'badge-danger',
}

export default function OrdersPage() {
  const { status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/orders')
    else if (status === 'authenticated') fetchOrders()
  }, [status, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      if (response.ok) setOrders(data.orders)
    } catch (error) {
      console.error('Ошибка:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true
    if (filter === 'active')
      return ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)
    if (filter === 'completed') return order.status === 'completed'
    if (filter === 'cancelled') return order.status === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--fg-muted)] font-semibold">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] py-6 px-4">
      <div className="container-page max-w-4xl">
        <button
          onClick={() => router.push('/home')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </button>

        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Мои заказы</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">История ваших заказов</p>
        </div>

        {/* Filters */}
        <div className="surface p-1 mb-4 inline-flex flex-wrap gap-1">
          {[
            { key: 'all', label: 'Все' },
            { key: 'active', label: 'Активные' },
            { key: 'completed', label: 'Завершённые' },
            { key: 'cancelled', label: 'Отменённые' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                filter === key
                  ? 'bg-[var(--brand)] text-white'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="surface p-12 text-center">
            <div className="w-14 h-14 bg-[var(--bg-muted)] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7 text-[var(--fg-subtle)]" />
            </div>
            <h2 className="text-lg font-extrabold mb-1">
              {filter === 'all' ? 'Заказов пока нет' : 'Нет заказов в этой категории'}
            </h2>
            <p className="text-sm text-[var(--fg-muted)] mb-5">Оформите первый заказ из меню</p>
            <button onClick={() => router.push('/')} className="btn btn-primary">
              Перейти в меню
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="card card-hover p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-base font-extrabold">Заказ #{order.orderNumber}</h3>
                      <span className={`badge ${STATUS_BADGE[order.status] || 'badge'}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--fg-subtle)]">
                      {new Date(order.createdAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-extrabold text-[var(--brand)]">
                      {order.totalAmount} сом
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-2 text-[var(--fg-muted)]">
                    {order.orderType === 'delivery' ? (
                      <>
                        <Truck className="w-3.5 h-3.5" />
                        <span className="font-semibold">Доставка</span>
                      </>
                    ) : (
                      <>
                        <Store className="w-3.5 h-3.5" />
                        <span className="font-semibold">Самовывоз</span>
                      </>
                    )}
                  </div>
                  <div className="text-[var(--fg-muted)]">
                    <span className="font-semibold">Филиал: </span>
                    {order.branch.name}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 4).map((item: any) => (
                      <div
                        key={item.id}
                        className="w-9 h-9 rounded-lg overflow-hidden border-2 border-white bg-[var(--bg-muted)]"
                      >
                        {item.menuItem.images && item.menuItem.images.length > 0 ? (
                          <img
                            src={item.menuItem.images[0].imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">
                            🍗
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-[var(--fg-muted)]">
                    {order.items.length} {order.items.length === 1 ? 'товар' : 'товаров'}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-auto text-[var(--fg-subtle)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
