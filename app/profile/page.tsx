import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-12 text-white">
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
                <p className="text-orange-100">{user.email}</p>
                <div className="mt-2 inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {user.role === "customer"
                    ? "Клиент"
                    : user.role === "admin"
                    ? "Администратор"
                    : "Менеджер филиала"}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Информация профиля
            </h2>

            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <label className="text-sm font-semibold text-gray-500 uppercase">
                  ID пользователя
                </label>
                <p className="mt-1 text-gray-900 font-mono text-sm">
                  {user.id}
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="text-sm font-semibold text-gray-500 uppercase">
                  Email
                </label>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="text-sm font-semibold text-gray-500 uppercase">
                  Полное имя
                </label>
                <p className="mt-1 text-gray-900">{user.fullName}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="text-sm font-semibold text-gray-500 uppercase">
                  Роль
                </label>
                <p className="mt-1 text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <a
                href="/"
                className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                На главную
              </a>
              <a
                href="/orders"
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Мои заказы
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/menu"
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-600 hover:bg-orange-50 transition-all text-center"
            >
              <div className="text-4xl mb-2">🍗</div>
              <h3 className="font-bold text-gray-900">Меню</h3>
              <p className="text-sm text-gray-600 mt-1">
                Посмотреть наше меню
              </p>
            </a>

            <a
              href="/orders"
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-600 hover:bg-orange-50 transition-all text-center"
            >
              <div className="text-4xl mb-2">📦</div>
              <h3 className="font-bold text-gray-900">Заказы</h3>
              <p className="text-sm text-gray-600 mt-1">История заказов</p>
            </a>

            <a
              href="/branches"
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-600 hover:bg-orange-50 transition-all text-center"
            >
              <div className="text-4xl mb-2">📍</div>
              <h3 className="font-bold text-gray-900">Филиалы</h3>
              <p className="text-sm text-gray-600 mt-1">Найти ближайший</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
