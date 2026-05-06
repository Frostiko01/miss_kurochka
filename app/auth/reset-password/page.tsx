"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"code" | "password">("code");

  // Если пользователь уже авторизован, перенаправляем на профиль
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/profile");
    }
  }, [status, router]);

  useEffect(() => {
    if (!email) {
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Код должен содержать 6 цифр");
      return;
    }

    setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (newPassword.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при сбросе пароля");
        setIsLoading(false);
        return;
      }

      // Перенаправляем на страницу входа
      router.push("/auth/signin?reset=success");
    } catch (err) {
      setError("Произошла ошибка при сбросе пароля");
      setIsLoading(false);
    }
  };

  // Показываем загрузку пока проверяем сессию
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d62300] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован, не показываем форму
  if (status === "authenticated") {
    return null;
  }

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#d62300]/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d62300]/10 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#d62300]/5 rounded-full blur-3xl opacity-60 animate-pulse delay-500"></div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-40 right-20 w-20 h-20 border-4 border-[#d62300]/20 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-[#d62300]/20 rounded-full animate-bounce-slow"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-[#d62300] to-[#ff0000] p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 border-4 border-white rounded-full"></div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <Image src="/logo.svg" alt="Miss Kurochka" width={80} height={80} className="drop-shadow-2xl" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg">
                {step === "code" ? "Введите код" : "Новый пароль"}
              </h2>
              <p className="mt-2 text-white/90 font-semibold">
                {step === "code" ? "Код отправлен на ваш email" : "Создайте новый пароль"}
              </p>
            </div>
          </div>

          <div className="p-8">
            {step === "code" && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 font-semibold text-center">
                  Код отправлен на <strong>{email}</strong>
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 font-semibold">
                {error}
              </div>
            )}

            {step === "code" ? (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-black text-gray-700 mb-2 uppercase text-center"
                  >
                    6-значный код
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d62300] focus:border-[#d62300] transition-all font-black text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={code.length !== 6}
                  className="w-full relative group"
                >
                  <div className="absolute inset-0 bg-[#d62300] rounded-xl blur opacity-30 group-hover:opacity-50 transition"></div>
                  <div className="relative bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white py-4 rounded-xl font-black text-lg uppercase shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    Продолжить
                  </div>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-black text-gray-700 mb-2 uppercase"
                  >
                    Новый пароль
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d62300] focus:border-[#d62300] transition-all font-semibold"
                    placeholder="••••••••"
                  />
                  <p className="mt-2 text-xs text-gray-500 font-semibold">
                    Минимум 8 символов
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-black text-gray-700 mb-2 uppercase"
                  >
                    Подтвердите пароль
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d62300] focus:border-[#d62300] transition-all font-semibold"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group mt-6"
                >
                  <div className="absolute inset-0 bg-[#d62300] rounded-xl blur opacity-30 group-hover:opacity-50 transition"></div>
                  <div className="relative bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white py-4 rounded-xl font-black text-lg uppercase shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    {isLoading ? "Сохранение..." : "Сохранить пароль"}
                  </div>
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/auth/signin"
                className="text-sm text-gray-500 hover:text-[#d62300] transition-colors font-semibold"
              >
                ← Вернуться ко входу
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Загрузка...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
