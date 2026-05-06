"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    activeBranches: 0,
  });

  // Загрузка статистики (заглушка)
  useEffect(() => {
    if (session?.user?.role === "admin") {
      // TODO: Загрузить реальную статистику из API
      setStats({
        totalOrders: 1234,
        totalRevenue: 567890,
        activeUsers: 456,
        activeBranches: 5,
      });
    }
  }, [session]);

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight" style={{ color: 'white' }}>
          Панель управления
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#78819d' }}>
          Добро пожаловать, {session?.user?.fullName}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div 
          className="rounded-2xl p-6 transition-all relative overflow-hidden" 
          style={{ backgroundColor: '#181f38' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181f38'}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <span className="text-blue-400 text-sm font-bold">+12%</span>
            </div>
            <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
              Всего заказов
            </p>
            <p className="text-3xl font-black text-white">
              {stats.totalOrders.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div 
          className="rounded-2xl p-6 transition-all relative overflow-hidden" 
          style={{ backgroundColor: '#181f38' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181f38'}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-green-400 text-sm font-bold">+8%</span>
            </div>
            <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
              Выручка
            </p>
            <p className="text-3xl font-black text-white">
              {stats.totalRevenue.toLocaleString()} с
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div 
          className="rounded-2xl p-6 transition-all relative overflow-hidden" 
          style={{ backgroundColor: '#181f38' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181f38'}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <span className="text-purple-400 text-sm font-bold">+24</span>
            </div>
            <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
              Пользователи
            </p>
            <p className="text-3xl font-black text-white">
              {stats.activeUsers.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Active Branches */}
        <div 
          className="rounded-2xl p-6 transition-all relative overflow-hidden" 
          style={{ backgroundColor: '#181f38' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181f38'}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <span className="text-orange-400 text-sm font-bold">Активно</span>
            </div>
            <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
              Филиалы
            </p>
            <p className="text-3xl font-black text-white">
              {stats.activeBranches}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: '#181f38' }}>
        <h2 className="text-2xl font-black uppercase mb-6" style={{ color: 'white' }}>
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            className="flex items-center gap-4 p-4 rounded-xl transition-all"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform" style={{ backgroundColor: '#555e7d' }}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-white transition-colors">
                Новый заказ
              </p>
              <p className="text-sm" style={{ color: '#78819d' }}>Создать заказ вручную</p>
            </div>
          </button>

          <button 
            className="flex items-center gap-4 p-4 rounded-xl transition-all"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform" style={{ backgroundColor: '#555e7d' }}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-white transition-colors">
                Добавить блюдо
              </p>
              <p className="text-sm" style={{ color: '#78819d' }}>Новое блюдо в меню</p>
            </div>
          </button>

          <button 
            className="flex items-center gap-4 p-4 rounded-xl transition-all"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform" style={{ backgroundColor: '#555e7d' }}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-white transition-colors">
                Новый филиал
              </p>
              <p className="text-sm" style={{ color: '#78819d' }}>Добавить филиал</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
        <h2 className="text-2xl font-black uppercase mb-6" style={{ color: 'white' }}>
          Последняя активность
        </h2>
        <div className="space-y-4">
          <div 
            className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer" 
            style={{ backgroundColor: 'rgba(64, 71, 238, 0.1)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 71, 238, 0.1)'}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Новый заказ #1234</p>
              <p className="text-sm" style={{ color: '#78819d' }}>2 минуты назад</p>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
              Новый
            </span>
          </div>

          <div 
            className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer" 
            style={{ backgroundColor: 'rgba(64, 71, 238, 0.1)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 71, 238, 0.1)'}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Новый пользователь</p>
              <p className="text-sm" style={{ color: '#78819d' }}>5 минут назад</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
              Регистрация
            </span>
          </div>

          <div 
            className="flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer" 
            style={{ backgroundColor: 'rgba(64, 71, 238, 0.1)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 71, 238, 0.1)'}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Заказ #1233 выполнен</p>
              <p className="text-sm" style={{ color: '#78819d' }}>10 минут назад</p>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
              Завершен
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
