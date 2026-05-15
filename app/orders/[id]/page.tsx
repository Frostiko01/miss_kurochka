'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Truck, Store, CreditCard, Clock, CheckCircle, ChefHat, ArrowLeft, Phone } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
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

export default function OrderDetailPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/orders')
    else if (status === 'authenticated' && params.id) fetchOrder()
  }, [status, params.id, router])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/user/orders/${params.id}`)
      const data = await response.json()
      if (response.ok) setOrder(data.order)
      else router.push('/orders')
    } catch (error) {
      console.error('Ошибка:', error)
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    const steps: Array<{ key: string; label: string; icon: React.ReactNode }> = [
      { key: 'pending', label: 'Ожидает', icon: <Clock className="w-4 h-4" /> },
      { key: 'confirmed', label: 'Подтверждён', icon: <CheckCircle className="w-4 h-4" /> },
      { key: 'preparing', label: 'Готовится', icon: <ChefHat className="w-4 h-4" /> },
      { key: 'ready', label: 'Готов', icon: <CheckCircle className="w-4 h-4" /> },
    ]
    if (order?.orderType === 'delivery')
      steps.push({ key: 'delivering', label: 'В пути', icon: <Truck className="w-4 h-4" /> })
    steps.push({ key: 'completed', label: 'Завершён', icon: <CheckCircle className="w-4 h-4" /> })
    return steps
  }

  const getCurrentStepIndex = () => {
    const steps = getStatusSteps()
    return steps.findIndex((step) => step.key === order?.status)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--fg-muted)] font-semibold">Загрузка заказа...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const steps = getStatusSteps()
  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] py-6">
      <div className="container-page max-w-4xl">
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          К заказам
        </button>

        {/* Header */}
        <div className="surface p-5 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Заказ #{order.orderNumber}</h1>
              <p className="text-sm text-[var(--fg-muted)] mt-0.5">
                {new Date(order.createdAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span className={`badge ${STATUS_BADGE[order.status] || 'badge'} text-sm py-1.5 px-3`}>
              {STATUS_LABEL[order.status] || order.status}
            </span>
          </div>
        </div>

        {/* Progress */}
        {order.status !== 'cancelled' && (
          <div className="surface p-5 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-5">
              Статус заказа
            </h2>
            <div className="relative pt-2">
              <div className="absolute top-[18px] left-4 right-4 h-0.5 bg-[var(--bg-muted)] rounded">
                <div
                  className="h-full bg-[var(--brand)] rounded transition-all duration-500"
                  style={{
                    width:
                      currentStepIndex < 0
                        ? '0%'
                        : `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="relative flex justify-between">
                {steps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex
                  return (
                    <div key={step.key} className="flex flex-col items-center" style={{ flex: '0 0 auto' }}>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                          isCompleted
                            ? 'bg-[var(--brand)] text-white'
                            : 'bg-[var(--bg-muted)] text-[var(--fg-subtle)]'
                        } ${isCurrent ? 'ring-4 ring-[var(--brand)]/15' : ''}`}
                      >
                        {step.icon}
                      </div>
                      <p
                        className={`text-[11px] font-semibold mt-2 text-center ${
                          isCompleted ? 'text-[var(--fg)]' : 'text-[var(--fg-subtle)]'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="surface p-5 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-4">
            Информация
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoBlock title="Филиал">
              <p className="text-sm font-bold">{order.branch.name}</p>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">{order.branch.address}</p>
              {order.branch.phone && (
                <p className="text-xs text-[var(--fg-muted)]">{order.branch.phone}</p>
              )}
            </InfoBlock>
            <InfoBlock title="Тип и оплата">
              <p className="text-sm font-bold flex items-center gap-1.5">
                {order.orderType === 'delivery' ? (
                  <>
                    <Truck className="w-3.5 h-3.5" />
                    Доставка
                  </>
                ) : (
                  <>
                    <Store className="w-3.5 h-3.5" />
                    Самовывоз
                  </>
                )}
              </p>
              <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5 mt-1">
                <CreditCard className="w-3 h-3" />
                Оплата картой
              </p>
            </InfoBlock>

            {order.orderType === 'delivery' && order.deliveryAddress && (
              <div className="sm:col-span-2">
                <InfoBlock title="Адрес доставки">
                  <p className="text-sm font-bold">{order.deliveryAddress.addressLine}</p>
                  {(order.deliveryAddress.apartment ||
                    order.deliveryAddress.entrance ||
                    order.deliveryAddress.floor) && (
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                      {order.deliveryAddress.apartment && `Кв. ${order.deliveryAddress.apartment}`}
                      {order.deliveryAddress.entrance && `, Подъезд ${order.deliveryAddress.entrance}`}
                      {order.deliveryAddress.floor && `, Этаж ${order.deliveryAddress.floor}`}
                      {order.deliveryAddress.intercom && `, Домофон ${order.deliveryAddress.intercom}`}
                    </p>
                  )}
                </InfoBlock>
              </div>
            )}

            {order.customerComment && (
              <div className="sm:col-span-2">
                <InfoBlock title="Комментарий">
                  <p className="text-sm">{order.customerComment}</p>
                </InfoBlock>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="surface p-5 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-4">
            Состав заказа
          </h2>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div
                key={item.id}
                className="flex gap-3 py-3 border-b border-[var(--border)] last:border-0"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0">
                  {item.menuItem.images && item.menuItem.images.length > 0 ? (
                    <img
                      src={item.menuItem.images[0].imageUrl}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold">{item.menuItem.name}</h3>
                  {item.modifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.modifiers.map((mod: any) => (
                        <span key={mod.id} className="badge text-[10px]">
                          {mod.modifierOption.name}
                          {mod.priceDelta > 0 && ` +${mod.priceDelta}`}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-[var(--fg-muted)] mt-1.5">
                    {item.quantity} × {item.unitPrice} сом
                  </p>
                </div>
                <p className="text-sm font-extrabold shrink-0">{item.totalPrice} сом</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-baseline justify-between">
            <span className="text-base font-bold">Итого</span>
            <span className="text-2xl font-extrabold text-[var(--brand)]">
              {order.totalAmount} сом
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => router.push('/home')} className="btn btn-secondary">
            На главную
          </button>
          {order.branch.phone && (
            <a href={`tel:${order.branch.phone}`} className="btn btn-primary">
              <Phone className="w-4 h-4" />
              Позвонить в филиал
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3.5 rounded-xl bg-[var(--bg-muted)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold mb-1">
        {title}
      </p>
      {children}
    </div>
  )
}
