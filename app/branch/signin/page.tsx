"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function BranchSignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Если пользователь уже авторизован как филиал, перенаправляем в панель
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "branch") {
      router.push("/branch/dashboard");
    } else if (status === "authenticated" && session?.user?.role !== "branch") {
      // Если авторизован, но не филиал - перенаправляем на главную
      router.push("/");
    }
  }, [status, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Неверный email или пароль" : result.error);
      } else if (result?.ok) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/branch/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Произошла ошибка при входе");
    } finally {
      setIsLoading(false);
    }
  };

  // Показываем загрузку пока проверяем сессию
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован, не показываем форму
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl opacity-60 animate-pulse delay-500"></div>

        {/* Decorative Shapes */}
        <div className="absolute top-40 right-20 w-20 h-20 border-4 border-blue-600/20 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-blue-600/20 rounded-full animate-bounce-slow"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 border-4 border-white rounded-full"></div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <svg
                    className="w-10 h-10 text-blue-600"
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
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg">
                Вход филиала
              </h2>
              <p className="mt-2 text-white/90 font-semibold">
                Введите учетные данные филиала
              </p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-black text-gray-700 mb-2 uppercase"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-semibold"
                  placeholder="branch@misskurochka.kg"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-black text-gray-700 mb-2 uppercase"
                >
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-blue-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-xl font-black text-lg uppercase shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {isLoading ? "Вход..." : "Войти"}
                </div>
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-semibold"
              >
                ← Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
