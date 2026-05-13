"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function BranchDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeItems: 0,
    stopListItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка статистики и заказов
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем статистику
        const statsResponse = await fetch('/api/branch/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Загружаем последние заказы
        const ordersResponse = await fetch('/api/branch/orders?limit=5');
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setRecentOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Данные для графика (последние 7 дней)
  const salesData = [
    { day: 'Пн', amount: 45000 },
    { day: 'Вт', amount: 52000 },
    { day: 'Ср', amount: 48000 },
    { day: 'Чт', amount: 61000 },
    { day: 'Пт', amount: 73000 },
    { day: 'Сб', amount: 85000 },
    { day: 'Вс', amount: 67000 },
  ];

  const maxAmount = Math.max(...salesData.map(d => d.amount));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'preparing': return '#3B82F6';
      case 'ready': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'preparing': return 'Готовится';
      case 'ready': return 'Готов';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold tracking-tight" 
            style={{ color: '#F3F5F7' }}
          >
            Панель управления
          </h1>
          <p className="font-medium mt-2" style={{ color: '#98A2B3' }}>
            Добро пожаловать, {session?.user?.fullName}
          </p>
        </div>

        {/* Stats Grid - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Заказы сегодня */}
          <div 
            className="p-6 transition-all hover:shadow-xl"
            style={{ 
              backgroundColor: '#1A212B',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(124, 140, 165, 0.3)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#98A2B3' }}>
              Заказы сегодня
            </p>
            <p className="text-4xl font-bold" style={{ color: '#F3F5F7' }}>
              {loading ? '...' : stats.todayOrders}
            </p>
          </div>

          {/* Выручка сегодня */}
          <div 
            className="p-6 transition-all hover:shadow-xl"
            style={{ 
              backgroundColor: '#1A212B',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#98A2B3' }}>
              Выручка сегодня
            </p>
            <p className="text-4xl font-bold" style={{ color: '#F3F5F7' }}>
              {loading ? '...' : `${stats.todayRevenue.toLocaleString()} с`}
            </p>
          </div>

          {/* Активные блюда */}
          <div 
            className="p-6 transition-all hover:shadow-xl"
            style={{ 
              backgroundColor: '#1A212B',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#98A2B3' }}>
              Активные блюда
            </p>
            <p className="text-4xl font-bold" style={{ color: '#F3F5F7' }}>
              {loading ? '...' : stats.activeItems}
            </p>
          </div>

          {/* В стоп-листе */}
          <div 
            className="p-6 transition-all hover:shadow-xl"
            style={{ 
              backgroundColor: '#1A212B',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="w-12 h-12 flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#98A2B3' }}>
              В стоп-листе
            </p>
            <p className="text-4xl font-bold" style={{ color: '#F3F5F7' }}>
              {loading ? '...' : stats.stopListItems}
            </p>
          </div>
        </div>

        {/* Quick Actions - New Colors */}
        <div 
          className="p-8 mb-8"
          style={{ 
            backgroundColor: '#1A212B',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <h2 
            className="text-2xl font-bold mb-6" 
            style={{ color: '#F3F5F7' }}
          >
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/branch/orders')}
              className="p-6 text-left transition-all hover:shadow-lg"
              style={{ 
                backgroundColor: '#2A3442',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#344255';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2A3442';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="w-14 h-14 flex items-center justify-center mb-4"
                style={{ 
                  background: 'linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)',
                  borderRadius: '12px'
                }}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#F3F5F7' }}>
                Просмотр заказов
              </h3>
              <p className="text-sm font-medium" style={{ color: '#98A2B3' }}>
                Управление текущими заказами
              </p>
            </button>

            <button
              onClick={() => router.push('/branch/menu')}
              className="p-6 text-left transition-all hover:shadow-lg"
              style={{ 
                backgroundColor: '#2A3442',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#344255';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2A3442';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="w-14 h-14 flex items-center justify-center mb-4"
                style={{ 
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  borderRadius: '12px'
                }}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#F3F5F7' }}>
                Меню филиала
              </h3>
              <p className="text-sm font-medium" style={{ color: '#98A2B3' }}>
                Просмотр доступных блюд
              </p>
            </button>

            <button
              onClick={() => router.push('/branch/stop-list')}
              className="p-6 text-left transition-all hover:shadow-lg"
              style={{ 
                backgroundColor: '#2A3442',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#344255';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2A3442';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="w-14 h-14 flex items-center justify-center mb-4"
                style={{ 
                  background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                  borderRadius: '12px'
                }}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#F3F5F7' }}>
                Стоп-лист
              </h3>
              <p className="text-sm font-medium" style={{ color: '#98A2B3' }}>
                Управление недоступными блюдами
              </p>
            </button>
          </div>
        </div>

        {/* Analytics Section - New Colors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Performance Chart */}
          <div 
            className="p-8"
            style={{ 
              backgroundColor: '#1A212B',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <h2 
              className="text-2xl font-bold mb-6" 
              style={{ color: '#F3F5F7' }}
            >
              Результаты продаж
            </h2>
            <div className="space-y-4">
              {salesData.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-sm font-semibold w-8" style={{ color: '#98A2B3' }}>
                    {item.day}
                  </span>
                  <div className="flex-1 h-12 relative overflow-hidden" style={{ 
                    backgroundColor: '#202937',
                    borderRadius: '8px'
                  }}>
                    <div 
                      className="h-full transition-all duration-500 flex items-center justify-end pr-4"
                      style={{ 
                        width: `${(item.amount / maxAmount) * 100}%`,
                        background: 'linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)',
                        borderRadius: '8px'
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {item.amount.toLocaleString()} с
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div 
            className="p-8"
            style={{ 
              backgroundColor: '#1A212B',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <h2 
              className="text-2xl font-bold mb-6" 
              style={{ color: '#F3F5F7' }}
            >
              Последние заказы
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div 
                  className="animate-spin rounded-full h-10 w-10 border-4 mx-auto" 
                  style={{ 
                    borderColor: '#202937',
                    borderTopColor: '#7C8CA5'
                  }}
                ></div>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="font-medium" style={{ color: '#98A2B3' }}>
                  Нет заказов
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-4 transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: '#202937',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold" style={{ color: '#F3F5F7' }}>
                        {order.customerName || 'Клиент'}
                      </span>
                      <span 
                        className="text-xs font-semibold px-3 py-1"
                        style={{ 
                          backgroundColor: getStatusColor(order.status),
                          color: '#FFFFFF',
                          borderRadius: '6px'
                        }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#98A2B3' }}>
                        {new Date(order.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="font-bold text-lg" style={{ color: '#7C8CA5' }}>
                        {order.totalAmount.toLocaleString()} с
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
