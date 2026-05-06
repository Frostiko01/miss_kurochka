"use client";

export default function AdminUsersPage() {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Пользователи
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#78819d' }}>
          Управление пользователями системы
        </p>
      </div>

      <div className="rounded-2xl p-8 border" style={{ backgroundColor: '#181f38', borderColor: 'rgba(64, 71, 238, 0.3)' }}>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
            <svg
              className="w-10 h-10 text-white"
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
          <h3 className="text-2xl font-black text-white mb-2">
            Страница в разработке
          </h3>
          <p style={{ color: '#78819d' }}>
            Функционал управления пользователями будет добавлен в ближайшее время
          </p>
        </div>
      </div>
    </div>
  );
}
