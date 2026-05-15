"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, AlertCircle } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"code" | "password">("code");

  useEffect(() => {
    if (status === "authenticated") router.push("/profile");
  }, [status, router]);

  useEffect(() => {
    if (!email) router.push("/auth/forgot-password");
  }, [email, router]);

  const handleVerifyCode = (e: React.FormEvent) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при сбросе пароля");
        setIsLoading(false);
        return;
      }
      router.push("/auth/signin?reset=success");
    } catch {
      setError("Произошла ошибка при сбросе пароля");
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated" || !email) {
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
            <h2 className="text-xl font-extrabold tracking-tight">
              {step === "code" ? "Введите код" : "Новый пароль"}
            </h2>
            <p className="text-sm text-[var(--fg-muted)] mt-1">
              {step === "code" ? "Код отправлен на ваш email" : "Создайте новый пароль"}
            </p>
          </div>

          <div className="p-6">
            {step === "code" && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#eff6ff] border border-[#dbeafe]">
                <Mail className="w-4 h-4 text-[#1d4ed8] shrink-0 mt-0.5" />
                <p className="text-sm text-[#1e40af] font-semibold">
                  Код отправлен на <span className="font-bold">{email}</span>
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fef2f2] border border-[#fee2e2]">
                <AlertCircle className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--brand)] font-semibold">{error}</p>
              </div>
            )}

            {step === "code" ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="label">6-значный код</label>
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="input text-center text-xl tracking-[0.5em] font-bold"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={code.length !== 6}
                  className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Продолжить
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="label">Новый пароль</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" />
                    <input
                      id="newPassword"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input pl-9"
                      placeholder="Минимум 8 символов"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="label">Подтвердите пароль</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pl-9"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Сохранение..." : "Сохранить пароль"}
                </button>
              </form>
            )}
          </div>

          <div className="px-6 pb-6 text-center">
            <Link href="/auth/signin" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] font-semibold">
              ← К входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
          <div className="text-sm text-[var(--fg-muted)]">Загрузка...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
