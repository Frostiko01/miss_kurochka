"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Mail, AlertCircle } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const email = searchParams.get("email");
  const password = searchParams.get("password");
  const fullName = searchParams.get("fullName");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.push("/profile");
  }, [status, router]);

  useEffect(() => {
    if (!email || !password || !fullName) router.push("/auth/signup");
  }, [email, password, fullName, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "verify_and_register",
          email,
          password,
          fullName,
          code,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при проверке кода");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/home");
        router.refresh();
      } else {
        router.push("/auth/signin");
      }
    } catch {
      setError("Произошла ошибка при проверке кода");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "send_code", email, password, fullName }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Ошибка при отправке кода");
    } catch {
      setError("Произошла ошибка при отправке кода");
    } finally {
      setResending(false);
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
            <h2 className="text-xl font-extrabold tracking-tight">Подтверждение Email</h2>
            <p className="text-sm text-[var(--fg-muted)] mt-1">Введите код из письма</p>
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#eff6ff] border border-[#dbeafe]">
              <Mail className="w-4 h-4 text-[#1d4ed8] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#1e40af] font-semibold">
                  Код отправлен на <span className="font-bold">{email}</span>
                </p>
                <p className="text-xs text-[#1e40af]/80 mt-0.5">
                  Проверьте папку «Спам», если не видите письмо
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fef2f2] border border-[#fee2e2]">
                <AlertCircle className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--brand)] font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isLoading || code.length !== 6}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Проверка..." : "Подтвердить"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-[var(--brand)] hover:text-[var(--brand-dark)] font-semibold disabled:opacity-50"
              >
                {resending ? "Отправка..." : "Отправить код повторно"}
              </button>
            </div>
          </div>

          <div className="px-6 pb-6 text-center">
            <Link href="/auth/signup" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] font-semibold">
              ← К регистрации
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
          <div className="text-sm text-[var(--fg-muted)]">Загрузка...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
