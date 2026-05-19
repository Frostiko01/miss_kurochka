"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, ArrowLeft, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Форматирует 9 цифр в "XXX XXX XXX"
function formatPhoneDisplay(digits: string): string {
  if (!digits) return "";
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  return parts.join(" ")
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
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

  const resetState = () => {
    setStep("form");
    setError("");
    setFormData({ fullName: "", email: "", password: "", phone: "", code: "" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
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
        setStep("verify");
        setIsLoading(false);
        return;
      }

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
          const { getSession } = await import("next-auth/react");
          const session = await getSession();
          if (session?.user?.role === "admin") {
            router.push("/admin/dashboard");
          } else if (session?.user?.role === "branch") {
            router.push("/branch/dashboard");
          } else {
            router.push("/home");
          }
          router.refresh();
        }
      }
    } catch (err) {
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
        // Получаем сессию чтобы узнать роль
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        if (session?.user?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (session?.user?.role === "branch") {
          router.push("/branch/dashboard");
        } else {
          router.push("/home");
        }
        router.refresh();
      }
    } catch (err) {
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
      if (!response.ok) setError(data.error || "Ошибка отправки кода");
      setIsLoading(false);
    } catch (err) {
      console.error("Resend error:", err);
      setError("Произошла ошибка");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/home" });
  };

  const title =
    mode === "signup"
      ? step === "verify"
        ? "Подтверждение Email"
        : "Регистрация"
      : "Вход";
  const subtitle =
    mode === "signup"
      ? step === "verify"
        ? "Введите 6-значный код из email"
        : "Создайте аккаунт для заказа"
      : "Войдите в свой аккаунт";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md animate-scaleIn">
        <div className="surface shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-[var(--border)]">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center">
                <User className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)]"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
            <p className="text-sm text-[var(--fg-muted)] mt-1">{subtitle}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-[#fef2f2] border border-[#fee2e2]">
                <p className="text-[var(--brand)] text-sm font-semibold">{error}</p>
              </div>
            )}

            <form
              onSubmit={mode === "signup" ? handleSignUp : handleSignIn}
              className="space-y-4"
            >
              {mode === "signup" && step === "verify" ? (
                <>
                  <div>
                    <label htmlFor="code" className="label">
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
                      className="input text-center text-xl tracking-[0.5em] font-bold"
                      placeholder="000000"
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || formData.code.length !== 6}
                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Проверка..." : "Подтвердить"}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setFormData({ ...formData, code: "" });
                        setError("");
                      }}
                      className="text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Назад
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-[var(--brand)] hover:text-[var(--brand-dark)] font-semibold disabled:opacity-50"
                    >
                      {isLoading ? "Отправка..." : "Отправить повторно"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {mode === "signup" && (
                    <div>
                      <label htmlFor="fullName" className="label">
                        Имя
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="input"
                        placeholder="Иван Иванов"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="label">
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
                      className="input"
                      placeholder="example@mail.com"
                    />
                  </div>

                  {mode === "signup" && (
                    <div>
                      <label htmlFor="phone" className="label">
                        Телефон <span className="text-[var(--fg-subtle)] font-normal">(необязательно)</span>
                      </label>
                      <div className="flex items-stretch rounded-xl border border-[var(--border-strong)] bg-white overflow-hidden focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--brand)]/10 transition">
                        <div className="flex items-center gap-1.5 px-3 bg-[var(--bg-muted)] border-r border-[var(--border)]">
                          <span className="text-base leading-none">🇰🇬</span>
                          <span className="text-sm font-bold text-[var(--fg)]">+996</span>
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          value={formatPhoneDisplay(formData.phone)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                            setFormData({ ...formData, phone: digits });
                          }}
                          className="flex-1 px-3 py-3 text-sm font-semibold text-[var(--fg)] placeholder-[var(--fg-subtle)] focus:outline-none bg-transparent font-mono tracking-wider"
                          placeholder="555 123 456"
                          maxLength={11}
                          autoComplete="tel"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--fg-subtle)]">
                        Введите 9 цифр без кода страны
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="password" className="label">
                      Пароль
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="input pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
                        aria-label={showPassword ? "Скрыть" : "Показать"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? mode === "signup"
                        ? "Отправка кода..."
                        : "Вход..."
                      : mode === "signup"
                      ? "Отправить код"
                      : "Войти"}
                  </button>

                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border)]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white text-xs text-[var(--fg-subtle)] font-semibold uppercase">
                        Или
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="btn btn-secondary w-full"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Войти через Google
                  </button>
                </>
              )}
            </form>

            {step === "form" && (
              <div className="mt-5 text-center">
                <button
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    resetState();
                  }}
                  className="text-sm text-[var(--fg-muted)] hover:text-[var(--brand)] font-semibold"
                >
                  {mode === "signup"
                    ? "Уже есть аккаунт? Войти"
                    : "Нет аккаунта? Зарегистрироваться"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
