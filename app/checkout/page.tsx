'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Truck, Store, CreditCard, Banknote } from 'lucide-react'
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
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState<any>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  
  // Форма заказа
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [customerComment, setCustomerComment] = useState('')
  
  // Новый адрес
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    addressLine: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
    comment: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/checkout')
    } else if (status === 'authenticated') {
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
      console.error('Ошибка загрузки корзины:', error)
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
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0].id)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки адресов:', error)
    }
  }

  const calculateTotal = (): number => {
    if (!cart) return 0
    return cart.items.reduce((sum: number, item: any) => {
      let itemPrice = Number(item.menuItem.price)
      item.modifiers.forEach((mod: any) => {
        itemPrice += Number(mod.modifierOption.price)
      })
      return sum + (itemPrice * item.quantity)
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
          paymentMethod,
          customerName: session?.user?.fullName,
          customerPhone: session?.user?.phone,
          customerComment: customerComment || null,
          deliveryAddressId: orderType === 'delivery' ? selectedAddress : null
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Очищаем корзину
        await fetch('/api/cart', { method: 'DELETE' })
        // Перенаправляем на страницу заказа
        router.push(`/orders/${data.order.id}`)
      } else {
        alert(data.error || 'Ошибка создания заказа')
      }
    } catch (error) {
      console.error('Ошибка создания заказа:', error)
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
        body: JSON.stringify(newAddress)
      })

      const data = await response.json()

      if (response.ok) {
        setAddresses([...addresses, data.address])
        setSelectedAddress(data.address.id)
        setShowNewAddress(false)
        setNewAddress({
          addressLine: '',
          apartment: '',
          entrance: '',
          floor: '',
          intercom: '',
          comment: ''
        })
      } else {
        alert(data.error || 'Ошибка добавления адреса')
      }
    } catch (error) {
      console.error('Ошибка добавления адреса:', error)
      alert('Ошибка добавления адреса')
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d62300] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/cart')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Оформление заказа</h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Заполните данные для доставки
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Форма */}
          <div className="lg:col-span-2 space-y-6">
            {/* Тип заказа */}
            <div className={`rounded-2xl shadow-xl p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
              <h2 className={`text-xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Тип заказа
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    orderType === 'delivery'
                      ? 'bg-[#d62300] text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                  Доставка
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    orderType === 'pickup'
                      ? 'bg-[#d62300] text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Store className="w-5 h-5" />
                  Самовывоз
                </button>
              </div>
            </div>

            {/* Адрес доставки */}
            {orderType === 'delivery' && (
              <div className={`rounded-2xl shadow-xl p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
                <h2 className={`text-xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Адрес доставки
                </h2>
                
                {addresses.length > 0 && !showNewAddress ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div key={address.id} className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setSelectedAddress(address.id)}
                          className={`w-full p-4 rounded-xl text-left transition-all ${
                            selectedAddress === address.id
                              ? 'bg-[#d62300] text-white shadow-xl'
                              : theme === 'dark'
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <p className="font-bold mb-1">{address.addressLine}</p>
                          {(address.apartment || address.entrance || address.floor) && (
                            <p className="text-sm opacity-90">
                              {address.apartment && `Кв. ${address.apartment}`}
                              {address.entrance && `, Подъезд ${address.entrance}`}
                              {address.floor && `, Этаж ${address.floor}`}
                            </p>
                          )}
                        </button>
                        
                        {/* Карта для выбранного адреса */}
                        {selectedAddress === address.id && (
                          <div className="mt-3">
                            <DeliveryMap 
                              address={address.addressLine}
                              height="250px"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(true)}
                      className={`w-full p-4 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      + Добавить новый адрес
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newAddress.addressLine}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                      placeholder="Улица, дом"
                      className={`w-full px-4 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border-2 focus:border-[#d62300] focus:outline-none`}
                      required
                    />
                    
                    {/* Карта для нового адреса */}
                    {newAddress.addressLine && newAddress.addressLine.length > 3 && (
                      <div className="mb-4">
                        <DeliveryMap 
                          address={newAddress.addressLine}
                          height="250px"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={newAddress.apartment}
                        onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                        placeholder="Квартира"
                        className={`px-4 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border-2 focus:border-[#d62300] focus:outline-none`}
                      />
                      <input
                        type="text"
                        value={newAddress.entrance}
                        onChange={(e) => setNewAddress({ ...newAddress, entrance: e.target.value })}
                        placeholder="Подъезд"
                        className={`px-4 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border-2 focus:border-[#d62300] focus:outline-none`}
                      />
                      <input
                        type="text"
                        value={newAddress.floor}
                        onChange={(e) => setNewAddress({ ...newAddress, floor: e.target.value })}
                        placeholder="Этаж"
                        className={`px-4 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border-2 focus:border-[#d62300] focus:outline-none`}
                      />
                      <input
                        type="text"
                        value={newAddress.intercom}
                        onChange={(e) => setNewAddress({ ...newAddress, intercom: e.target.value })}
                        placeholder="Домофон"
                        className={`px-4 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border-2 focus:border-[#d62300] focus:outline-none`}
                      />
                    </div>
                    <textarea
                      value={newAddress.comment}
                      onChange={(e) => setNewAddress({ ...newAddress, comment: e.target.value })}
                      placeholder="Комментарий к адресу"
                      rows={2}
                      className={`w-full px-4 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border-2 focus:border-[#d62300] focus:outline-none`}
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        className="flex-1 py-3 bg-[#d62300] text-white rounded-xl font-bold hover:shadow-xl transition-all"
                      >
                        Сохранить адрес
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddress(false)}
                          className={`px-6 py-3 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          Отмена
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Способ оплаты */}
            <div className={`rounded-2xl shadow-xl p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
              <h2 className={`text-xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Способ оплаты
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'cash'
                      ? 'bg-[#d62300] text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  Наличные
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'card'
                      ? 'bg-[#d62300] text-white shadow-xl scale-105'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Картой
                </button>
              </div>
            </div>

            {/* Комментарий */}
            <div className={`rounded-2xl shadow-xl p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
              <h2 className={`text-xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Комментарий к заказу
              </h2>
              <textarea
                value={customerComment}
                onChange={(e) => setCustomerComment(e.target.value)}
                placeholder="Например: не звонить в дверь, есть ребенок"
                rows={3}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border-2 focus:border-[#d62300] focus:outline-none`}
              />
            </div>
          </div>

          {/* Итого */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl shadow-xl p-6 sticky top-24 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
              <h2 className={`text-xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ваш заказ</h2>
              
              {cart?.branch && (
                <div className={`mb-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                  <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Филиал:</p>
                  <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{cart.branch.name}</p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {cart?.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {item.menuItem.name} × {item.quantity}
                    </span>
                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {item.menuItem.price * item.quantity} сом
                    </span>
                  </div>
                ))}
              </div>

              <div className={`border-t-2 pt-4 mb-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Итого:</span>
                  <span className="text-3xl font-black text-[#d62300]">{calculateTotal()} сом</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || (orderType === 'delivery' && !selectedAddress)}
                className="w-full py-4 bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white rounded-xl font-black text-lg uppercase shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Оформление...' : 'Оформить заказ'}
              </button>

              <div className={`mt-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-green-900/20 border border-green-800' : 'bg-green-50'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className={`text-sm font-bold mb-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-800'}`}>Быстрая доставка</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-green-500' : 'text-green-700'}`}>Доставим ваш заказ за 30 минут</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
