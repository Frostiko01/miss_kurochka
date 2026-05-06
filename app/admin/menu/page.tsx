"use client";

export default function AdminMenuPage() {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Меню
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#78819d' }}>
          Управление блюдами и напитками
        </p>
      </div>

      <div className="rounded-2xl p-8 border" style={{ backgroundColor: '#181f38', borderColor: 'rgba(64, 71, 238, 0.3)' }}>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">
            Страница в разработке
          </h3>
          <p style={{ color: '#78819d' }}>
            Функционал управления меню будет добавлен в ближайшее время
          </p>
        </div>
      </div>
    </div>
  );
}
