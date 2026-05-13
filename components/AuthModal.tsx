"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    code: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Шаг 1: Отправка кода на email
      if (step === "form") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: "send_code",
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Ошибка отправки кода");
          setIsLoading(false);
          return;
        }

        // Переходим к шагу верификации
        setStep("verify");
        setIsLoading(false);
        return;
      }

      // Шаг 2: Проверка кода и создание пользователя
      if (step === "verify") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: "verify_and_register",
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            code: formData.code,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Ошибка регистрации");
          setIsLoading(false);
          return;
        }

        // Автоматический вход после регистрации
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Ошибка входа");
          setIsLoading(false);
        } else if (result?.ok) {
          onClose();
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError("Произошла ошибка при регистрации");
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
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
        setError("Неверный email или пароль");
        setIsLoading(false);
      } else if (result?.ok) {
        onClose();
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Произошла ошибка при входе");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "send_code",
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка отправки кода");
      } else {
        setError("");
        // Можно показать уведомление об успехе
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Resend error:", err);
      setError("Произошла ошибка");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
            style={{
              background: "radial-gradient(circle, #d62300 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
            style={{
              background: "radial-gradient(circle, #ff0000 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Glass Card */}
        <div
          className={`rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border relative transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            borderColor: theme === 'dark' ? "rgba(214, 35, 0, 0.3)" : "rgba(214, 35, 0, 0.1)",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(214, 35, 0, 0.1)",
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 transition-colors z-10 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className={`p-8 text-center ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
              : 'bg-gradient-to-br from-red-50 to-white'
          }`}>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative bg-gradient-to-br from-[#d62300] to-[#ff0000]"
                style={{
                  boxShadow:
                    "0 10px 30px rgba(214, 35, 0, 0.3)",
                }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2
              className="text-3xl font-black mb-3 text-[#d62300]"
              style={{
                letterSpacing: "-0.02em",
              }}
            >
              {mode === "signup" 
                ? (step === "verify" ? "Подтверждение Email" : "Регистрация")
                : "Вход"}
            </h2>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {mode === "signup"
                ? (step === "verify" 
                    ? "Введите 6-значный код из email"
                    : "Создайте аккаунт для заказа")
                : "Войдите в свой аккаунт"}
            </p>
          </div>

          {/* Form */}
          <div className={`px-8 pb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            {error && (
              <div
                className="mb-6 px-4 py-3 rounded-xl border bg-red-50"
                style={{
                  borderColor: "rgba(239, 68, 68, 0.3)",
                }}
              >
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <form
              onSubmit={mode === "signup" ? handleSignUp : handleSignIn}
              className="space-y-5"
            >
              {mode === "signup" && step === "verify" ? (
                // Шаг верификации кода
                <>
                  <div>
                    <label
                      htmlFor="code"
                      className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className={`w-full px-4 py-3.5 rounded-xl placeholder-gray-400 focus:outline-none transition-all border-2 font-bold text-center text-2xl tracking-widest ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white focus:bg-gray-600'
                          : 'bg-gray-50 text-gray-900 focus:bg-white'
                      }`}
                      style={{
                        borderColor: "rgba(214, 35, 0, 0.2)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#d62300")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(214, 35, 0, 0.2)")
                      }
                      placeholder="000000"
                      autoComplete="off"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || formData.code.length !== 6}
                    className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background:
                        "linear-gradient(135deg, #d62300 0%, #ff0000 100%)",
                      boxShadow: "0 10px 25px -5px rgba(214, 35, 0, 0.4)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading && formData.code.length === 6) {
                        e.currentTarget.style.boxShadow =
                          "0 15px 35px -5px rgba(214, 35, 0, 0.5)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 10px 25px -5px rgba(214, 35, 0, 0.4)";
                      e.currentTarget.style.transform = "translateY(0)";
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
                      className={`text-sm font-medium transition-colors disabled:opacity-50 ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-[#d62300]'
                          : 'text-gray-600 hover:text-[#d62300]'
                      }`}
                    >
                      {isLoading ? "Отправка..." : "Отправить код повторно"}
                    </button>
                  </div>

                  {/* Back Button */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setFormData({ ...formData, code: "" });
                        setError("");
                      }}
                      className={`text-sm transition-colors font-medium inline-flex items-center gap-1 ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Вернуться назад
                    </button>
                  </div>
                </>
              ) : (
                // Форма регистрации/входа
                <>
              {/* Full Name (только для регистрации) */}
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="fullName"
                    className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Полное имя
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl placeholder-gray-400 focus:outline-none transition-all border-2 font-medium ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white focus:bg-gray-600'
                          : 'bg-gray-50 text-gray-900 focus:bg-white'
                      }`}
                      style={{
                        borderColor: "rgba(214, 35, 0, 0.2)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#d62300")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(214, 35, 0, 0.2)")
                      }
                      placeholder="Иван Иванов"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl placeholder-gray-400 focus:outline-none transition-all border-2 font-medium ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-white focus:bg-gray-600'
                        : 'bg-gray-50 text-gray-900 focus:bg-white'
                    }`}
                    style={{
                      borderColor: "rgba(214, 35, 0, 0.2)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#d62300")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(214, 35, 0, 0.2)")
                    }
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              {/* Phone (только для регистрации) */}
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="phone"
                    className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Телефон <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>(необязательно)</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      +996
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        // Разрешаем только цифры и ограничиваем длину
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setFormData({ ...formData, phone: value });
                      }}
                      className={`w-full pl-16 pr-4 py-3.5 rounded-xl placeholder-gray-400 focus:outline-none transition-all border-2 font-medium ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white focus:bg-gray-600'
                          : 'bg-gray-50 text-gray-900 focus:bg-white'
                      }`}
                      style={{
                        borderColor: "rgba(214, 35, 0, 0.2)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#d62300")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(214, 35, 0, 0.2)")
                      }
                      placeholder="555 123 456"
                      maxLength={9}
                    />
                  </div>
                  <p className={`mt-1 text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Введите номер без кода страны
                  </p>
                </div>
              )}

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className={`block text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Пароль
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl placeholder-gray-400 focus:outline-none transition-all border-2 font-medium ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-white focus:bg-gray-600'
                        : 'bg-gray-50 text-gray-900 focus:bg-white'
                    }`}
                    style={{
                      borderColor: "rgba(214, 35, 0, 0.2)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#d62300")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(214, 35, 0, 0.2)")
                    }
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
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
                  background: "linear-gradient(135deg, #d62300 0%, #ff0000 100%)",
                  boxShadow: "0 10px 25px -5px rgba(214, 35, 0, 0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 15px 35px -5px rgba(214, 35, 0, 0.5)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px -5px rgba(214, 35, 0, 0.4)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {mode === "signup" ? "Отправка кода..." : "Вход..."}
                  </span>
                ) : mode === "signup" ? (
                  "ОТПРАВИТЬ КОД"
                ) : (
                  "ВОЙТИ"
                )}
              </button>
              </>
              )}
            </form>

            {/* Toggle Mode */}
            {mode === "signup" && step === "form" && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setFormData({
                      fullName: "",
                      email: "",
                      password: "",
                      phone: "",
                      code: "",
                    });
                  }}
                  className={`text-sm transition-colors font-medium ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-[#d62300]'
                      : 'text-gray-600 hover:text-[#d62300]'
                  }`}
                >
                  Уже есть аккаунт? Войти
                </button>
              </div>
            )}
            {mode === "signin" && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode("signup");
                    setStep("form");
                    setError("");
                    setFormData({
                      fullName: "",
                      email: "",
                      password: "",
                      phone: "",
                      code: "",
                    });
                  }}
                  className={`text-sm transition-colors font-medium ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-[#d62300]'
                      : 'text-gray-600 hover:text-[#d62300]'
                  }`}
                >
                  Нет аккаунта? Зарегистрироваться
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
