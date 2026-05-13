"use client";

import { useSession } from "next-auth/react";

export default function TestSessionPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#050c26' }}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#181f38' }}>
          <h1 className="text-3xl font-black mb-6" style={{ color: 'white' }}>
            🔍 Тест сессии
          </h1>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold mb-2" style={{ color: '#78819d' }}>
                Статус:
              </p>
              <p className="text-xl font-bold" style={{ color: 'white' }}>
                {status}
              </p>
            </div>

            {session && (
              <>
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: '#78819d' }}>
                    Email:
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'white' }}>
                    {session.user?.email || 'Нет'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: '#78819d' }}>
                    Имя:
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'white' }}>
                    {session.user?.fullName || 'Нет'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: '#78819d' }}>
                    Роль:
                  </p>
                  <p className="text-xl font-bold" style={{ color: session.user?.role === 'branch' ? '#22c55e' : '#ef4444' }}>
                    {session.user?.role || 'Нет роли!'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: '#78819d' }}>
                    ID:
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'white' }}>
                    {session.user?.id || 'Нет'}
                  </p>
                </div>
              </>
            )}

            {!session && status === 'unauthenticated' && (
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <p className="font-bold" style={{ color: '#ef4444' }}>
                  ❌ Вы не авторизованы
                </p>
              </div>
            )}

            <div className="pt-6">
              <p className="text-sm font-bold mb-2" style={{ color: '#78819d' }}>
                Полные данные сессии:
              </p>
              <pre className="p-4 rounded-xl overflow-auto text-xs" style={{ backgroundColor: '#050c26', color: '#78819d' }}>
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
