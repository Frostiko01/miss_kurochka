"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

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

    console.log("🔐 Попытка входа:", formData.email);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("📝 Результат входа:", result);

      if (result?.error) {
        console.log("❌ Ошибка входа:", result.error);
        setError(result.error === "CredentialsSignin" ? "Неверный email или пароль" : result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        console.log("✅ Вход успешен, перенаправление на /branch/dashboard");
        
        // Ждем немного чтобы сессия обновилась
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Перенаправляем напрямую на dashboard филиала с полной перезагрузкой
        window.location.href = "/branch/dashboard";
      }
    } catch (err: any) {
      console.error("❌ Ошибка при входе:", err);
      setError(err.message || "Произошла ошибка при входе");
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F14' }}>
      <div className="max-w-md w-full mx-4">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1A212B', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Header */}
          <div className="p-8 text-center border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(124, 140, 165, 0.2)' }}>
                <svg
                  className="w-10 h-10"
                  style={{ color: '#7C8CA5' }}
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
            <h2 className="text-3xl font-black uppercase tracking-tight" style={{ color: '#AAB7CC' }}>
              Вход филиала
            </h2>
            <p className="mt-2 font-semibold" style={{ color: '#98A2B3' }}>
              Введите учетные данные филиала
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid' }}>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: '#ef4444' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="font-semibold" style={{ color: '#ef4444' }}>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold mb-2"
                  style={{ color: '#F3F5F7' }}
                >
                  Email <span style={{ color: '#ef4444' }}>*</span>
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
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border"
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.04)' }}
                  placeholder="branch@misskurochka.kg"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold mb-2"
                  style={{ color: '#F3F5F7' }}
                >
                  Пароль <span style={{ color: '#ef4444' }}>*</span>
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
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border"
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.04)' }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#7C8CA5' }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#93A4BF')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#7C8CA5')}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Вход...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Войти
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm font-semibold transition-colors"
                style={{ color: '#98A2B3' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#7C8CA5'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#98A2B3'}
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
