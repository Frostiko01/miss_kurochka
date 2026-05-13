'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Truck, Store, CreditCard, Banknote, Clock, CheckCircle, ChefHat } from 'lucide-react'

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { theme } = useTheme()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/orders')
    } else if (status === 'authenticated' && params.id) {
      fetchOrder()
    }
  }, [status, params.id, router])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/user/orders/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrder(data.order)
      } else {
        router.push('/orders')
      }
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтвержден',
      preparing: 'Готовится',
      ready: 'Готов',
      delivering: 'Доставляется',
      completed: 'Завершен',
      cancelled: 'Отменен',
    }
    return statuses[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      delivering: 'bg-purple-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Ожидает', icon: <Clock className="w-6 h-6" /> },
      { key: 'confirmed', label: 'Подтвержден', icon: <CheckCircle className="w-6 h-6" /> },
      { key: 'preparing', label: 'Готовится', icon: <ChefHat className="w-6 h-6" /> },
      { key: 'ready', label: 'Готов', icon: <CheckCircle className="w-6 h-6" /> },
    ]

    if (order?.orderType === 'delivery') {
      steps.push({ key: 'delivering', label: 'Доставляется', icon: <Truck className="w-6 h-6" /> })
    }

    steps.push({ key: 'completed', label: 'Завершен', icon: <CheckCircle className="w-6 h-6" /> })

    return steps
  }

  const getCurrentStepIndex = () => {
    const steps = getStatusSteps()
    return steps.findIndex(step => step.key === order?.status)
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d62300] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Загрузка заказа...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const steps = getStatusSteps()
  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/orders')}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Заказ #{order.orderNumber}
                </h1>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(order.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>

        {/* Статус заказа - прогресс */}
        {order.status !== 'cancelled' && (
          <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
            <h2 className={`text-xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Статус заказа
            </h2>
            <div className="relative">
              {/* Линия прогресса */}
              <div className={`absolute top-6 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-[#d62300] transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Шаги */}
              <div className="relative flex justify-between">
                {steps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                          isCompleted
                            ? 'bg-[#d62300] text-white shadow-xl scale-110'
                            : theme === 'dark'
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-[#d62300]/30' : ''}`}
                      >
                        {step.icon}
                      </div>
                      <p className={`text-xs font-bold mt-2 text-center ${
                        isCompleted
                          ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                          : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Информация о заказе */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
          <h2 className={`text-xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Информация о заказе
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Филиал:
              </p>
              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {order.branch.name}
              </p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {order.branch.address}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {order.branch.phone}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Тип заказа:
              </p>
              <p className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {order.orderType === 'delivery' ? (
                  <>
                    <Truck className="w-4 h-4" />
                    Доставка
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4" />
                    Самовывоз
                  </>
                )}
              </p>
              <p className={`text-xs font-semibold mt-2 mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Оплата:
              </p>
              <p className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {order.paymentMethod === 'cash' ? (
                  <>
                    <Banknote className="w-4 h-4" />
                    Наличные
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Картой
                  </>
                )}
              </p>
            </div>

            {order.orderType === 'delivery' && order.deliveryAddress && (
              <div className={`sm:col-span-2 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Адрес доставки:
                </p>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {order.deliveryAddress.addressLine}
                </p>
                {(order.deliveryAddress.apartment || order.deliveryAddress.entrance || order.deliveryAddress.floor) && (
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {order.deliveryAddress.apartment && `Кв. ${order.deliveryAddress.apartment}`}
                    {order.deliveryAddress.entrance && `, Подъезд ${order.deliveryAddress.entrance}`}
                    {order.deliveryAddress.floor && `, Этаж ${order.deliveryAddress.floor}`}
                    {order.deliveryAddress.intercom && `, Домофон ${order.deliveryAddress.intercom}`}
                  </p>
                )}
              </div>
            )}

            {order.customerComment && (
              <div className={`sm:col-span-2 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Комментарий:
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {order.customerComment}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Состав заказа */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
          <h2 className={`text-xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Состав заказа
          </h2>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className={`flex gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  {item.menuItem.images && item.menuItem.images.length > 0 ? (
                    <img
                      src={item.menuItem.images[0].imageUrl}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🍗
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {item.menuItem.name}
                  </h3>
                  {item.modifiers.length > 0 && (
                    <div className="mb-2">
                      <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Дополнительно:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.modifiers.map((mod: any) => (
                          <span
                            key={mod.id}
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded-lg ${theme === 'dark' ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-700'}`}
                          >
                            {mod.modifierOption.name}
                            {mod.priceDelta > 0 && ` (+${mod.priceDelta} сом)`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.quantity} шт × {item.unitPrice} сом
                    </p>
                    <p className="text-xl font-black text-[#d62300]">
                      {item.totalPrice} сом
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Итого */}
          <div className={`mt-6 pt-6 border-t-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Итого:
              </span>
              <span className="text-4xl font-black text-[#d62300]">
                {order.totalAmount} сом
              </span>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className={`flex-1 py-4 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Вернуться в меню
          </button>
          {order.branch.phone && (
            <a
              href={`tel:${order.branch.phone}`}
              className="flex-1 py-4 bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white rounded-xl font-bold text-center hover:shadow-xl transition-all hover:scale-105"
            >
              Позвонить в филиал
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
