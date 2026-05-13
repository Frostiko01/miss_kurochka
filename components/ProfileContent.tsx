'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Drumstick, Package, MapPin } from 'lucide-react'

interface User {
  fullName: string
  email: string
  phone?: string | null
  avatarUrl: string | null
  role: string
}

interface ProfileContentProps {
  user: User
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-2xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#d62300] to-[#ff0000] px-8 py-12 text-white">
            <div className="flex items-center gap-6">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-4xl font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-black mb-2">{user.fullName}</h1>
                <p className="text-white/80">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Информация профиля
            </h2>

            <div className="space-y-4">
              <div className={`border-b pb-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <label className={`text-sm font-semibold uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Полное имя
                </label>
                <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.fullName}</p>
              </div>

              <div className={`border-b pb-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <label className={`text-sm font-semibold uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Email
                </label>
                <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.email}</p>
              </div>

              <div className={`border-b pb-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <label className={`text-sm font-semibold uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Номер телефона
                </label>
                <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {user.phone || 'Не указан'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <a
                href="/"
                className="px-6 py-3 bg-[#d62300] text-white rounded-lg font-semibold hover:bg-[#b01e00] transition-colors"
              >
                На главную
              </a>
              <a
                href="/cart"
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
              >
                Корзина
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className={`mt-6 rounded-2xl shadow-xl p-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/menu"
              className={`p-6 border-2 rounded-xl transition-all text-center ${
                theme === 'dark' 
                  ? 'border-gray-700 hover:border-[#d62300] hover:bg-gray-700' 
                  : 'border-gray-200 hover:border-orange-600 hover:bg-orange-50'
              }`}
            >
              <div className="flex justify-center mb-2">
                <Drumstick className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Меню</h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Посмотреть наше меню
              </p>
            </a>

            <a
              href="/orders"
              className={`p-6 border-2 rounded-xl transition-all text-center ${
                theme === 'dark' 
                  ? 'border-gray-700 hover:border-[#d62300] hover:bg-gray-700' 
                  : 'border-gray-200 hover:border-orange-600 hover:bg-orange-50'
              }`}
            >
              <div className="flex justify-center mb-2">
                <Package className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Заказы</h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>История заказов</p>
            </a>

            <a
              href="/branches"
              className={`p-6 border-2 rounded-xl transition-all text-center ${
                theme === 'dark' 
                  ? 'border-gray-700 hover:border-[#d62300] hover:bg-gray-700' 
                  : 'border-gray-200 hover:border-orange-600 hover:bg-orange-50'
              }`}
            >
              <div className="flex justify-center mb-2">
                <MapPin className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Филиалы</h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Найти ближайший</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
