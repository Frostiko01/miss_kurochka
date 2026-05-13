"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Toast from "@/components/admin/Toast";

export default function AdminSignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<"login" | "verify">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    code: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Переводим ошибки на русский
        const errorMessages: Record<string, string> = {
          invalidCredentials: "Неверный email или пароль",
          notAdmin: "У вас нет прав администратора",
          accountBlocked: "Ваш аккаунт заблокирован",
          telegramNotConfigured: "Telegram не настроен. Обратитесь к администратору",
          telegramSendFailed: "Не удалось отправить код в Telegram",
          generic: "Произошла ошибка. Попробуйте позже",
        };
        
        setError(errorMessages[data.error] || data.error || "Ошибка входа");
        setIsLoading(false);
        return;
      }

      setStep("verify");
      setToast({
        message: "Код отправлен в ваш Telegram",
        type: "success",
      });
      setIsLoading(false);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Произошла ошибка при входе");
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Неверный код");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ошибка входа");
        setIsLoading(false);
      } else if (result?.ok) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Verify error:", err);
      setError("Произошла ошибка при проверке кода");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setToast({
          message: data.error || "Ошибка отправки кода",
          type: "error",
        });
      } else {
        setToast({
          message: "Код отправлен повторно",
          type: "success",
        });
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Resend error:", err);
      setToast({
        message: "Произошла ошибка",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
      }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#3b82f6' }}></div>
          </div>
          <p className="mt-4 text-slate-400 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
    }}>
      {/* Subtle background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Glass Card */}
        <div 
          className="rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderColor: 'rgba(59, 130, 246, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1)'
          }}
        >
          {/* Header */}
          <div className="p-8 text-center">
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.05)'
                }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: '#3b82f6' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold mb-2" style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              {step === "login" ? "Вход в" : "Двухфакторная"}
            </h2>
            <h2 className="text-3xl font-bold mb-3" style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              {step === "login" ? "Админ-панель" : "Аутентификация"}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {step === "login" ? "Введите учетные данные администратора" : "Введите 6-значный код из Telegram"}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            {error && (
              <div 
                className="mb-6 px-4 py-3 rounded-xl border"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)'
                }}
              >
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {step === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all border font-medium"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 0.2)'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'}
                      placeholder="admin@misskurochka.kg"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all border font-medium"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 0.2)'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Вход...
                    </span>
                  ) : (
                    "ВОЙТИ"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                {/* Code Input */}
                <div>
                  <label htmlFor="code" className="block text-sm font-semibold text-slate-300 mb-2">
                    Код подтверждения
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all border font-bold text-center text-2xl tracking-widest"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      borderColor: 'rgba(59, 130, 246, 0.2)'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'}
                    placeholder="000000"
                    autoComplete="off"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || formData.code.length !== 6}
                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && formData.code.length === 6) {
                      e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(59, 130, 246, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Проверка...
                    </span>
                  ) : (
                    "ПОДТВЕРДИТЬ"
                  )}
                </button>

                {/* Resend Code */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Отправка..." : "Отправить код повторно"}
                  </button>
                </div>

                {/* Back Button */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("login");
                      setFormData({ ...formData, code: "" });
                      setError("");
                    }}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors font-medium inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Вернуться к входу
                  </button>
                </div>
              </form>
            )}

            {/* Footer Link */}
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors font-medium inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
