'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
  CheckCircle2,
  Truck,
  Store,
  CreditCard,
  MapPin,
  Phone,
  ArrowRight,
  Banknote,
  MessageCircle,
} from 'lucide-react'
import PanLoader from '@/components/PanLoader'

const PAYMENT_LABEL: Record<string, string> = {
  card: 'Картой',
  cash: 'Наличными',
  online: 'Онлайн',
  finik: 'Finik',
}

const PAYMENT_ICON: Record<string, React.ReactNode> = {
  card: <CreditCard className="w-3.5 h-3.5" />,
  cash: <Banknote className="w-3.5 h-3.5" />,
  online: <CreditCard className="w-3.5 h-3.5" />,
  finik: <CreditCard className="w-3.5 h-3.5" />,
}

const ORDER_TYPE_LABEL: Record<string, string> = {
  delivery: 'Доставка',
  pickup: 'Самовывоз',
}

interface OrderItem {
  id: string
  itemName: string
  quantity: number
  unitPrice: number | string
  totalPrice: number | string
  modifiers?: Array<{ modifierOption?: { name: string } }>
}

interface Payment {
  paymentMethod: string
  amount: number | string
  status: string
}

interface DeliveryAddress {
  addressLine: string
  apartment?: string | null
  entrance?: string | null
  floor?: string | null
  intercom?: string | null
}

interface Branch {
  name: string
  address: string
  phone?: string | null
}

interface Order {
  id: string
  orderNumber: string
  orderType: string
  paymentMethod: string
  totalAmount: number | string
  createdAt: string
  customerName: string
  customerPhone: string
  customerComment?: string | null
  items: OrderItem[]
  payments: Payment[]
  branch: Branch
  deliveryAddress?: DeliveryAddress | null
}

export default function OrderReceiptPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [animDone, setAnimDone] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && params.id) fetchOrder()
  }, [status, params.id])

  useEffect(() => {
    const timer = setTimeout(() => setAnimDone(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/user/orders/${String(params.id)}`)
      const data = await res.json()
      if (res.ok) setOrder(data.order as Order)
      else router.push('/orders')
    } catch {
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center px-4">
        <PanLoader
          size={128}
          text="Платеж успешно обработан"
          subtext="Готовим вашу курочку..."
        />
      </div>
    )
  }

  const totalAmount = Number(order.totalAmount)
  // Способ оплаты — из payments[0] или из поля paymentMethod заказа
  const payMethod = order.payments?.[0]?.paymentMethod ?? order.paymentMethod ?? 'card'

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] flex flex-col items-center justify-start py-8 px-4">
      {/* Printer wrapper */}
      <div className="w-full max-w-sm">

        {/* Printer top */}
        <div
          className="relative z-10 mx-3 h-4 rounded-t-lg"
          style={{ background: '#1a1a1a', border: '4px solid #111', borderBottom: 'none' }}
        />

        {/* Paper container */}
        <div className="relative overflow-hidden" style={{ height: animDone ? 'auto' : 520 }}>

          {/* Printer bottom bar */}
          <div
            className="relative z-10 mx-3 h-4 rounded-b-lg"
            style={{ background: '#1a1a1a', border: '4px solid #111', borderTop: 'none' }}
          />

          {/* Paper */}
          <div
            className="relative z-20 mx-3 bg-white shadow-lg"
            style={{
              animation: animDone ? 'none' : 'receiptPrint 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
              transform: animDone ? 'translateY(0)' : undefined,
            }}
          >
            <div className="px-6 pt-8 pb-2">

              {/* Success icon */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'var(--brand)' }}
                >
                  <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-[var(--fg)]">
                  Заказ оформлен!
                </h1>
                <p className="text-sm text-[var(--fg-muted)] mt-1 text-center">
                  Мы уже готовим вашу курочку
                </p>
              </div>

              <div className="border-t-2 border-dashed border-[var(--border-strong)] my-4" />

              {/* Order number */}
              <div className="text-center mb-4">
                <p className="text-[10px] uppercase tracking-widest text-[var(--fg-subtle)] font-bold mb-1">
                  Номер заказа
                </p>
                <p className="text-4xl font-extrabold tracking-tight text-[var(--fg)]">
                  #{order.orderNumber}
                </p>
                <p className="text-xs text-[var(--fg-subtle)] mt-1">
                  {new Date(order.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="border-t-2 border-dashed border-[var(--border-strong)] my-4" />

              {/* Type + Payment row */}
              <div className="flex justify-between gap-3 mb-4">
                <div className="flex-1 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--fg-subtle)] font-bold mb-1">
                    Тип
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {order.orderType === 'delivery'
                      ? <Truck className="w-3.5 h-3.5 text-[var(--brand)]" />
                      : <Store className="w-3.5 h-3.5 text-[var(--brand)]" />
                    }
                    <span className="text-sm font-bold">
                      {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}
                    </span>
                  </div>
                </div>
                <div className="w-px bg-[var(--border)]" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--fg-subtle)] font-bold mb-1">
                    Оплата
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[var(--brand)]">
                      {PAYMENT_ICON[payMethod] ?? <CreditCard className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-sm font-bold">
                      {PAYMENT_LABEL[payMethod] ?? 'При получении'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Branch */}
              {order.branch && (
                <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-[var(--bg-muted)]">
                  <MapPin className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--fg)]">{order.branch.name}</p>
                    <p className="text-[11px] text-[var(--fg-muted)] truncate">{order.branch.address}</p>
                  </div>
                </div>
              )}

              {/* Delivery address */}
              {order.orderType === 'delivery' && order.deliveryAddress && (
                <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-[var(--brand-soft)]">
                  <Truck className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--brand)] font-bold mb-0.5">
                      Адрес доставки
                    </p>
                    <p className="text-xs font-bold text-[var(--fg)]">
                      {order.deliveryAddress.addressLine}
                    </p>
                    {(order.deliveryAddress.apartment || order.deliveryAddress.floor) && (
                      <p className="text-[11px] text-[var(--fg-muted)]">
                        {order.deliveryAddress.apartment && `Кв. ${order.deliveryAddress.apartment}`}
                        {order.deliveryAddress.entrance && `, под. ${order.deliveryAddress.entrance}`}
                        {order.deliveryAddress.floor && `, эт. ${order.deliveryAddress.floor}`}
                        {order.deliveryAddress.intercom && `, домофон ${order.deliveryAddress.intercom}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer */}
              <div className="flex items-center gap-2 mb-3 text-xs text-[var(--fg-muted)]">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">{order.customerName}</span>
                {order.customerPhone && order.customerPhone !== 'Не указан' && (
                  <span>· {order.customerPhone}</span>
                )}
              </div>

              <div className="border-t-2 border-dashed border-[var(--border-strong)] my-4" />

              {/* Items */}
              <div className="space-y-2.5 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--fg)] leading-tight">
                        {item.itemName}
                      </p>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-[11px] text-[var(--fg-subtle)] mt-0.5">
                          {item.modifiers
                            .map((m) => m.modifierOption?.name)
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                        {item.quantity} × {Number(item.unitPrice).toLocaleString('ru-RU')} сом
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-[var(--fg)] shrink-0 tabular-nums">
                      {Number(item.totalPrice).toLocaleString('ru-RU')} сом
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-[var(--border-strong)] my-4" />

              {/* Total */}
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-base font-bold text-[var(--fg)]">Итого</span>
                <span
                  className="text-3xl font-extrabold tabular-nums"
                  style={{ color: 'var(--brand)' }}
                >
                  {totalAmount.toLocaleString('ru-RU')} сом
                </span>
              </div>

              {/* Payment status */}
              <div className="flex items-center justify-between mb-6 text-xs">
                <span className="text-[var(--fg-muted)] font-semibold">Статус оплаты</span>
                <span
                  className="font-extrabold px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      order.payments?.[0]?.status === 'completed'
                        ? '#d1fae5'
                        : '#fef3c7',
                    color:
                      order.payments?.[0]?.status === 'completed'
                        ? '#047857'
                        : '#b45309',
                  }}
                >
                  {order.payments?.[0]?.status === 'completed'
                    ? 'Оплачено'
                    : 'При получении'}
                </span>
              </div>

              {/* Thank you */}
              <div className="text-center mb-2">
                <p className="text-sm font-bold text-[var(--fg-muted)]">Спасибо за заказ!</p>
                <p className="text-xs text-[var(--fg-subtle)] mt-0.5">Miss Kurochka</p>
              </div>

            </div>

            {/* Jagged bottom edge */}
            <div className="jagged-receipt" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="w-full max-w-sm mt-6 space-y-3 px-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}
      >
        <button
          onClick={() => router.push(`/orders/${order.id}`)}
          className="btn btn-primary w-full"
        >
          Отследить заказ
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push('/home')}
          className="btn btn-secondary w-full"
        >
          На главную
        </button>
        
        {/* Кнопка WhatsApp */}
        {order.branch?.whatsappNumber && (
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn w-full transition-all active:scale-[0.98]"
            style={{
              background: '#25D366',
              color: 'white',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '14px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
            }}
          >
            <MessageCircle className="w-4 h-4" />
            💬 Написать в WhatsApp
          </a>
        )}
        
        {order.branch?.phone && (
          <a
            href={`tel:${order.branch.phone}`}
            className="btn btn-ghost w-full flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Позвонить в филиал
          </a>
        )}
      </div>

      <style jsx global>{`
        @keyframes receiptPrint {
          0% { transform: translateY(-88%); }
          100% { transform: translateY(0%); }
        }

        .jagged-receipt {
          position: relative;
          height: 20px;
          width: 100%;
          margin-top: -1px;
          overflow: hidden;
        }

        .jagged-receipt::after {
          content: '';
          display: block;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background:
            linear-gradient(45deg, transparent 33.333%, #ffffff 33.333%, #ffffff 66.667%, transparent 66.667%),
            linear-gradient(-45deg, transparent 33.333%, #ffffff 33.333%, #ffffff 66.667%, transparent 66.667%);
          background-size: 14px 40px;
          background-position: 0 -20px;
        }
      `}</style>
    </div>
  )
  
  // Функция для генерации ссылки WhatsApp
  function getWhatsAppLink() {
    if (!order?.branch?.whatsappNumber) return '#'
    
    // Очищаем номер от всех символов кроме цифр
    const cleanNumber = order.branch.whatsappNumber.replace(/\D/g, '')
    
    // Формируем текст сообщения
    let message = `Здравствуйте.\n\nУ меня вопрос по заказу №${order.orderNumber}.`
    
    // Добавляем адрес доставки если есть
    if (order.orderType === 'delivery' && order.deliveryAddress) {
      message += `\n\nАдрес доставки: ${order.deliveryAddress.addressLine}`
      if (order.deliveryAddress.apartment) {
        message += `, кв. ${order.deliveryAddress.apartment}`
      }
    }
    
    // Добавляем филиал
    message += `\n\nФилиал: ${order.branch.name}`
    message += `\n\nСпасибо.`
    
    // Кодируем сообщение для URL
    const encodedMessage = encodeURIComponent(message)
    
    // Возвращаем ссылку
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
  }
}
