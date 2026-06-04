"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.push("/profile");
  }, [status, router]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (formData.password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "send_code",
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при отправке кода");
        setIsLoading(false);
        return;
      }

      router.push(
        `/auth/verify-email?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(
          formData.password
        )}&fullName=${encodeURIComponent(formData.fullName)}`
      );
    } catch {
      setError("Произошла ошибка при регистрации");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/profile" });
    } catch {
      setError("Ошибка при входе через Google");
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Miss Kurochka" width={56} height={56} className="rounded-xl" />
        </Link>

        <div className="surface shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-[var(--border)]">
            <h2 className="text-xl font-extrabold tracking-tight">Регистрация</h2>
            <p className="text-sm text-[var(--fg-muted)] mt-1">Создайте аккаунт Miss Kurochka</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fef2f2] border border-[#fee2e2]">
                <AlertCircle className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--brand)] font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="label">Имя</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none z-10" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input w-full"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Иван Иванов"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none z-10" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input w-full"
                    style={{ paddingLeft: '40px' }}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">Пароль</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none z-10" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input w-full"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Минимум 8 символов"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">Подтвердите пароль</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none z-10" />
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input w-full"
                    style={{ paddingLeft: '40px' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-[var(--fg-subtle)] font-semibold uppercase">
                  Или
                </span>
              </div>
            </div>

            <button onClick={handleGoogleSignIn} disabled={isLoading} className="btn btn-secondary w-full">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Регистрация через Google
            </button>
          </div>

          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-[var(--fg-muted)]">
              Уже есть аккаунт?{" "}
              <Link href="/auth/signin" className="font-bold text-[var(--brand)] hover:text-[var(--brand-dark)]">
                Войти
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] font-semibold">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
