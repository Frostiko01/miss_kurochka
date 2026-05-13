'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface ModifierOption {
  id: string
  name: string
  priceDelta: number
  group: {
    id: string
    name: string
  }
}

interface CartItemModifier {
  id: string
  modifierOption: ModifierOption
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  weightGrams: number | null
  images: Array<{ imageUrl: string; isPrimary: boolean }>
  category: {
    id: string
    name: string
  }
}

interface CartItem {
  id: string
  quantity: number
  itemComment: string | null
  menuItem: MenuItem
  modifiers: CartItemModifier[]
}

interface Cart {
  id: string
  items: CartItem[]
  branch: {
    id: string
    name: string
    address: string
  } | null
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  
  // Форма адреса доставки
  const [address, setAddress] = useState({
    street: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
    comment: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/cart')
    } else if (status === 'authenticated') {
      fetchCart()
    }
  }, [status, router])

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      
      if (response.ok) {
        setCart(data.cart)
      } else {
        console.error('Ошибка загрузки корзины:', data.error)
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (updating) return
    
    setUpdating(cartItemId)
    try {
      if (newQuantity === 0) {
        await removeItem(cartItemId)
      } else {
        const response = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setCart(data.cart)
        } else {
          console.error('Ошибка обновления количества:', data.error)
        }
      }
    } catch (error) {
      console.error('Ошибка обновления количества:', error)
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (cartItemId: string) => {
    if (updating) return
    
    setUpdating(cartItemId)
    try {
      const response = await fetch(`/api/cart/items?id=${cartItemId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setCart(data.cart)
      } else {
        console.error('Ошибка удаления позиции:', data.error)
      }
    } catch (error) {
      console.error('Ошибка удаления позиции:', error)
    } finally {
      setUpdating(null)
    }
  }

  const calculateItemTotal = (item: CartItem): number => {
    let total = Number(item.menuItem.price)
    
    item.modifiers.forEach(mod => {
      total += Number(mod.modifierOption.priceDelta)
    })
    
    return total * item.quantity
  }

  const calculateTotal = (): number => {
    if (!cart) return 0
    return cart.items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#d62300] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Загружаем корзину...</p>
        </div>
      </div>
    )
  }

  const isEmpty = !cart || cart.items.length === 0
  const totalAmount = calculateTotal()

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Корзина пуста
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Добавьте товары из меню,<br />чтобы сделать заказ
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#d62300] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#b01e00] transition-colors"
          >
            Перейти в меню
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Левая колонка - Тип заказа и адрес */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Тип заказа */}
            <div className="bg-[#2a3441] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">ТИП ЗАКАЗА</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                    orderType === 'delivery'
                      ? 'bg-[#d62300] text-white'
                      : 'bg-[#3a4553] text-gray-300 hover:bg-[#4a5563]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Доставка
                </button>
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                    orderType === 'pickup'
                      ? 'bg-[#d62300] text-white'
                      : 'bg-[#3a4553] text-gray-300 hover:bg-[#4a5563]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Самовывоз
                </button>
              </div>
            </div>

            {/* Адрес доставки */}
            {orderType === 'delivery' && (
              <div className="bg-[#2a3441] rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">АДРЕС ДОСТАВКИ</h2>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Улица, дом"
                      value={address.street}
                      onChange={(e) => setAddress({...address, street: e.target.value})}
                      className="w-full bg-[#3a4553] border-2 border-[#d62300] rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#ff4500]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Квартира"
                      value={address.apartment}
                      onChange={(e) => setAddress({...address, apartment: e.target.value})}
                      className="bg-[#3a4553] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#d62300]"
                    />
                    <input
                      type="text"
                      placeholder="Подъезд"
                      value={address.entrance}
                      onChange={(e) => setAddress({...address, entrance: e.target.value})}
                      className="bg-[#3a4553] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#d62300]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Этаж"
                      value={address.floor}
                      onChange={(e) => setAddress({...address, floor: e.target.value})}
                      className="bg-[#3a4553] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#d62300]"
                    />
                    <input
                      type="text"
                      placeholder="Домофон"
                      value={address.intercom}
                      onChange={(e) => setAddress({...address, intercom: e.target.value})}
                      className="bg-[#3a4553] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#d62300]"
                    />
                  </div>
                  <textarea
                    placeholder="Комментарий к адресу"
                    value={address.comment}
                    onChange={(e) => setAddress({...address, comment: e.target.value})}
                    rows={3}
                    className="w-full bg-[#3a4553] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#d62300] resize-none"
                  />
                  <button className="w-full bg-[#d62300] text-white py-3 rounded-xl font-semibold hover:bg-[#b01e00] transition-colors">
                    Сохранить адрес
                  </button>
                </div>
              </div>
            )}

            {/* Способ оплаты */}
            <div className="bg-[#2a3441] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">СПОСОБ ОПЛАТЫ</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-[#d62300] text-white'
                      : 'bg-[#3a4553] text-gray-300 hover:bg-[#4a5563]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Наличные
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-[#d62300] text-white'
                      : 'bg-[#3a4553] text-gray-300 hover:bg-[#4a5563]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Картой
                </button>
              </div>
            </div>
          </div>

          {/* Правая колонка - Заказ */}
          <div className="space-y-6">
            
            {/* Ваш заказ */}
            <div className="bg-[#2a3441] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">ВАШ ЗАКАЗ</h2>
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const itemTotal = calculateItemTotal(item)
                  const isUpdating = updating === item.id
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between text-gray-300">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{item.menuItem.name}</span>
                          <span className="text-gray-400">× {item.quantity}</span>
                        </div>
                        {item.modifiers.length > 0 && (
                          <div className="text-sm text-gray-400 mt-1">
                            {item.modifiers.map(mod => mod.modifierOption.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3a4553] hover:bg-[#4a5563] transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-8 text-center text-white font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3a4553] hover:bg-[#4a5563] transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-white font-bold min-w-[80px] text-right">
                          {itemTotal} сом
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="border-t border-gray-600 mt-6 pt-4">
                <div className="flex items-center justify-between text-xl">
                  <span className="text-white font-bold">Итого:</span>
                  <span className="text-[#d62300] font-bold text-2xl">{totalAmount} сом</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-[#d62300] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#b01e00] transition-colors mt-6"
              >
                ОФОРМИТЬ ЗАКАЗ
              </button>
              
              {orderType === 'delivery' && (
                <div className="mt-4 p-4 bg-[#1a4d3a] rounded-xl border border-green-600">
                  <div className="flex items-center gap-2 text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Быстрая доставка</span>
                  </div>
                  <p className="text-green-300 text-sm mt-1">
                    Доставим ваш заказ за 30 минут
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}