"use client";

export default function AdminCategoriesPage() {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Категории
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#78819d' }}>
          Управление категориями меню
        </p>
      </div>

      <div className="rounded-2xl p-8 border" style={{ backgroundColor: '#181f38', borderColor: 'rgba(64, 71, 238, 0.3)' }}>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/20">
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">
            Страница в разработке
          </h3>
          <p style={{ color: '#78819d' }}>
            Функционал управления категориями будет добавлен в ближайшее время
          </p>
        </div>
      </div>
    </div>
  );
}
