"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "@/app/i18n/hooks/useTranslations";

export default function AdminSignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslations("admin");

  const [step, setStep] = useState<"login" | "verify">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    code: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Если пользователь уже авторизован как админ, перенаправляем в админку
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      // Если авторизован, но не админ - перенаправляем на главную
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
        setError(t(`signin.errors.${data.error}`) || t("signin.errors.generic"));
        setIsLoading(false);
        return;
      }

      // Переходим к вводу кода
      setStep("verify");
      setIsLoading(false);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(t("signin.errors.generic"));
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
        setError(t(`verify.errors.${data.error}`) || t("verify.errors.generic"));
        setIsLoading(false);
        return;
      }

      console.log("✅ Код подтвержден, выполняем вход через NextAuth...");

      // Входим через NextAuth с учетными данными
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("🔐 Результат signIn:", result);

      if (result?.error) {
        console.error("❌ Ошибка signIn:", result.error);
        setError(t("verify.errors.generic"));
        setIsLoading(false);
      } else if (result?.ok) {
        console.log("✅ Вход успешен, перенаправляем...");
        // Даем время на установку сессии
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Verify error:", err);
      setError(t("verify.errors.generic"));
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
        setError(t(`verify.errors.${data.error}`) || t("verify.errors.generic"));
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Resend error:", err);
      setError(t("verify.errors.generic"));
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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl opacity-60 animate-pulse delay-500"></div>

        {/* Decorative Shapes */}
        <div className="absolute top-40 right-20 w-20 h-20 border-4 border-purple-600/20 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-purple-600/20 rounded-full animate-bounce-slow"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 border-4 border-white rounded-full"></div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <svg
                    className="w-10 h-10 text-purple-600"
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
              <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg">
                {step === "login" ? t("signin.title") : t("verify.title")}
              </h2>
              <p className="mt-2 text-white/90 font-semibold">
                {step === "login" ? t("signin.subtitle") : t("verify.subtitle")}
              </p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 font-semibold">
                {error}
              </div>
            )}

            {step === "verify" && !error && (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 font-semibold">
                {t("verify.codeSent")}
              </div>
            )}

            {step === "login" ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-black text-gray-700 mb-2 uppercase"
                  >
                    {t("signin.email")}
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all font-semibold"
                    placeholder="admin@misskurochka.kg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-black text-gray-700 mb-2 uppercase"
                  >
                    {t("signin.password")}
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all font-semibold"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group"
                >
                  <div className="absolute inset-0 bg-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4 rounded-xl font-black text-lg uppercase shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    {isLoading ? t("signin.loggingIn") : t("signin.loginButton")}
                  </div>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-black text-gray-700 mb-2 uppercase"
                  >
                    {t("verify.code")}
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
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.replace(/\D/g, "") })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all font-semibold text-center text-2xl tracking-widest"
                    placeholder="000000"
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || formData.code.length !== 6}
                  className="w-full relative group"
                >
                  <div className="absolute inset-0 bg-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4 rounded-xl font-black text-lg uppercase shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    {isLoading ? t("verify.verifying") : t("verify.verifyButton")}
                  </div>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? t("verify.resending") : t("verify.resendCode")}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("login");
                      setFormData({ ...formData, code: "" });
                      setError("");
                    }}
                    className="text-sm text-gray-500 hover:text-purple-600 transition-colors font-semibold"
                  >
                    {t("verify.backToLogin")}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-purple-600 transition-colors font-semibold"
              >
                {t("signin.backToHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
