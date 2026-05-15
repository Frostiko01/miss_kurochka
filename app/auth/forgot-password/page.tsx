"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.push("/profile");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при отправке кода");
        setIsLoading(false);
        return;
      }
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Произошла ошибка при отправке кода");
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
            <h2 className="text-xl font-extrabold tracking-tight">Забыли пароль?</h2>
            <p className="text-sm text-[var(--fg-muted)] mt-1">Мы отправим код на ваш email</p>
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
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Отправка..." : "Отправить код"}
              </button>
            </form>
          </div>

          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-[var(--fg-muted)]">
              Вспомнили пароль?{" "}
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
