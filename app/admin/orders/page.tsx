"use client";

export default function AdminOrdersPage() {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Заказы
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#78819d' }}>
          Управление заказами клиентов
        </p>
      </div>

      <div className="rounded-2xl p-8 border" style={{ backgroundColor: '#181f38', borderColor: 'rgba(64, 71, 238, 0.3)' }}>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">
            Страница в разработке
          </h3>
          <p style={{ color: '#78819d' }}>
            Функционал управления заказами будет добавлен в ближайшее время
          </p>
        </div>
      </div>
    </div>
  );
}
