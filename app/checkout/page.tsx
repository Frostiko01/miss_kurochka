'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Truck, Store, CreditCard, ArrowLeft, Plus, CheckCircle2 } from 'lucide-react'
import DeliveryMap from '@/components/DeliveryMap'

interface Address {
  id: string
  addressLine: string
  apartment?: string
  entrance?: string
  floor?: string
  intercom?: string
  comment?: string
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState<any>(null)
  const [addresses, setAddresses] = useState<Address[]>([])

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery')
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [customerComment, setCustomerComment] = useState('')

  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    addressLine: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
    comment: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/checkout')
    else if (status === 'authenticated') {
      fetchCart()
      fetchAddresses()
    }
  }, [status, router])

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      if (response.ok) {
        if (!data.cart || data.cart.items.length === 0) {
          router.push('/cart')
          return
        }
        setCart(data.cart)
      }
    } catch (error) {
      console.error('Ошибка:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses')
      const data = await response.json()
      if (response.ok && data.addresses) {
        setAddresses(data.addresses)
        if (data.addresses.length > 0) setSelectedAddress(data.addresses[0].id)
      }
    } catch (error) {
      console.error('Ошибка:', error)
    }
  }

  const calculateTotal = (): number => {
    if (!cart) return 0
    return cart.items.reduce((sum: number, item: any) => {
      // Комбо — фиксированная цена
      if (item.comboOffer) {
        return sum + Number(item.comboOffer.price) * item.quantity
      }
      if (!item.menuItem) return sum
      let itemPrice = Number(item.menuItem.price)
      item.modifiers.forEach((mod: any) => {
        itemPrice += Number(mod.modifierOption.price ?? mod.modifierOption.priceDelta ?? 0)
      })
      return sum + itemPrice * item.quantity
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (orderType === 'delivery' && !selectedAddress) {
      alert('Выберите адрес доставки')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          paymentMethod: 'card',
          customerName: session?.user?.fullName,
          customerPhone: session?.user?.phone,
          customerComment: customerComment || null,
          deliveryAddressId: orderType === 'delivery' ? selectedAddress : null,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        await fetch('/api/cart', { method: 'DELETE' })
        router.push(`/orders/${data.order.id}`)
      } else {
        alert(data.error || 'Ошибка создания заказа')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка создания заказа')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddAddress = async () => {
    if (!newAddress.addressLine) {
      alert('Укажите адрес')
      return
    }
    try {
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      })
      const data = await response.json()
      if (response.ok) {
        setAddresses([...addresses, data.address])
        setSelectedAddress(data.address.id)
        setShowNewAddress(false)
        setNewAddress({ addressLine: '', apartment: '', entrance: '', floor: '', intercom: '', comment: '', latitude: null, longitude: null })
      } else {
        alert(data.error || 'Ошибка')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка добавления адреса')
    }
  }

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
    <div className="min-h-screen bg-[var(--bg-muted)] py-6">
      <div className="container-page max-w-5xl">
        <button
          onClick={() => router.push('/cart')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          В корзину
        </button>

        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Оформление заказа</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-0.5">Заполните данные для доставки</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {/* Order type */}
            <div className="surface p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
                Тип заказа
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition ${
                    orderType === 'delivery'
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[var(--bg-muted)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Доставка
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition ${
                    orderType === 'pickup'
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[var(--bg-muted)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Самовывоз
                </button>
              </div>
            </div>

            {/* Address */}
            {orderType === 'delivery' && (
              <div className="surface p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
                  Адрес доставки
                </h2>

                {addresses.length > 0 && !showNewAddress ? (
                  <div className="space-y-2.5">
                    {addresses.map((address) => (
                      <div key={address.id} className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAddress(address.id)}
                          className={`w-full p-3.5 rounded-xl text-left transition border ${
                            selectedAddress === address.id
                              ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                              : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                          }`}
                        >
                          <p className="font-bold text-sm">{address.addressLine}</p>
                          {(address.apartment || address.entrance || address.floor) && (
                            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                              {address.apartment && `Кв. ${address.apartment}`}
                              {address.entrance && `, Подъезд ${address.entrance}`}
                              {address.floor && `, Этаж ${address.floor}`}
                            </p>
                          )}
                        </button>
                        {selectedAddress === address.id && (
                          <DeliveryMap address={address.addressLine} height="220px" />
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition border border-dashed border-[var(--border-strong)]"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить новый адрес
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="label">Адрес</label>
                      <input
                        type="text"
                        value={newAddress.addressLine}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                        placeholder="Улица, дом"
                        className="input"
                        required
                      />
                    </div>

                    {newAddress.addressLine && newAddress.addressLine.length > 3 && (
                      <DeliveryMap address={newAddress.addressLine} height="220px" />
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={newAddress.apartment}
                        onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                        placeholder="Квартира"
                        className="input"
                      />
                      <input
                        type="text"
                        value={newAddress.entrance}
                        onChange={(e) => setNewAddress({ ...newAddress, entrance: e.target.value })}
                        placeholder="Подъезд"
                        className="input"
                      />
                      <input
                        type="text"
                        value={newAddress.floor}
                        onChange={(e) => setNewAddress({ ...newAddress, floor: e.target.value })}
                        placeholder="Этаж"
                        className="input"
                      />
                      <input
                        type="text"
                        value={newAddress.intercom}
                        onChange={(e) => setNewAddress({ ...newAddress, intercom: e.target.value })}
                        placeholder="Домофон"
                        className="input"
                      />
                    </div>
                    <textarea
                      value={newAddress.comment}
                      onChange={(e) => setNewAddress({ ...newAddress, comment: e.target.value })}
                      placeholder="Комментарий к адресу"
                      rows={2}
                      className="textarea"
                    />
                    <div className="flex gap-2.5">
                      <button type="button" onClick={handleAddAddress} className="btn btn-primary flex-1">
                        Сохранить адрес
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddress(false)}
                          className="btn btn-secondary"
                        >
                          Отмена
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment */}
            <div className="surface p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
                Способ оплаты
              </h2>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-tint)]">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[var(--brand)]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Оплата при получении</p>
                  <p className="text-xs text-[var(--fg-muted)]">Наличными или картой курьеру</p>
                </div>
              </div>
            </div>

            {/* Comment */}
            <div className="surface p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
                Комментарий к заказу
              </h2>
              <textarea
                value={customerComment}
                onChange={(e) => setCustomerComment(e.target.value)}
                placeholder="Например: не звонить в дверь"
                rows={3}
                className="textarea"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="surface p-5 sticky top-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-4">
                Ваш заказ
              </h2>

              {cart?.branch && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--bg-muted)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold">
                    Филиал
                  </p>
                  <p className="text-sm font-bold mt-0.5">{cart.branch.name}</p>
                </div>
              )}

              <div className="space-y-1.5 mb-4">
                {cart?.items.map((item: any) => {
                  const name = item.menuItem?.name ?? item.comboOffer?.name ?? ''
                  const unitPrice = item.comboOffer
                    ? Number(item.comboOffer.price)
                    : Number(item.menuItem?.price ?? 0)
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[var(--fg-muted)] truncate pr-2">
                        {name} × {item.quantity}
                      </span>
                      <span className="font-semibold shrink-0">
                        {unitPrice * item.quantity} сом
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-[var(--border)] pt-3 mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">К оплате</span>
                  <span className="text-2xl font-extrabold text-[var(--brand)]">
                    {calculateTotal()} сом
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || (orderType === 'delivery' && !selectedAddress)}
                className="btn btn-primary w-full btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Оформление...' : 'Оформить заказ'}
              </button>

              <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-[#ecfdf5] border border-[#d1fae5]">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#065f46]">Быстрая доставка</p>
                  <p className="text-xs text-[#047857] mt-0.5">Доставим за 30 минут</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
