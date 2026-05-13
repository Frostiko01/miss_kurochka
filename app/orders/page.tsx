'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { Package, Truck, Store } from 'lucide-react'

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme } = useTheme()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/orders')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      
      if (response.ok) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'active') return ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(order.status)
    if (filter === 'completed') return order.status === 'completed'
    if (filter === 'cancelled') return order.status === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d62300] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Загрузка заказов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Мои заказы</h1>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  История всех ваших заказов
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры */}
        <div className={`rounded-2xl shadow-xl p-4 mb-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'bg-[#d62300] text-white shadow-xl'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                filter === 'active'
                  ? 'bg-[#d62300] text-white shadow-xl'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                filter === 'completed'
                  ? 'bg-[#d62300] text-white shadow-xl'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Завершенные
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                filter === 'cancelled'
                  ? 'bg-[#d62300] text-white shadow-xl'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Отмененные
            </button>
          </div>
        </div>

        {/* Список заказов */}
        {filteredOrders.length === 0 ? (
          <div className={`rounded-2xl shadow-xl p-12 text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
            <div className="flex justify-center mb-4">
              <Package className={`w-24 h-24 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
            </div>
            <h2 className={`text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {filter === 'all' ? 'Заказов пока нет' : 'Нет заказов в этой категории'}
            </h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Оформите первый заказ из нашего меню
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
            >
              Перейти в меню
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className={`rounded-2xl shadow-xl p-6 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${theme === 'dark' ? 'bg-gray-800 border-2 border-gray-700 hover:border-[#d62300]' : 'bg-white hover:shadow-2xl'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Заказ #{order.orderNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(order.createdAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#d62300]">
                      {order.totalAmount} сом
                    </p>
                  </div>
                </div>

                {/* Информация о заказе */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Филиал:
                    </p>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {order.branch.name}
                    </p>
                  </div>
                  <div>
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
                  </div>
                  {order.orderType === 'delivery' && order.deliveryAddress && (
                    <div className="sm:col-span-2">
                      <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Адрес доставки:
                      </p>
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {order.deliveryAddress.addressLine}
                        {order.deliveryAddress.apartment && `, кв. ${order.deliveryAddress.apartment}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Товары */}
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {item.menuItem.images && item.menuItem.images.length > 0 ? (
                          <img
                            src={item.menuItem.images[0].imageUrl}
                            alt={item.menuItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🍗
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {item.menuItem.name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.quantity} шт × {item.unitPrice} сом
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {item.totalPrice} сом
                      </p>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      И еще {order.items.length - 3} {order.items.length - 3 === 1 ? 'товар' : 'товара'}
                    </p>
                  )}
                </div>

                {/* Стрелка */}
                <div className="flex justify-end mt-4">
                  <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
