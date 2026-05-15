"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const errorMessages: Record<string, string> = {
  Configuration: "Ошибка конфигурации сервера",
  AccessDenied: "Доступ запрещён",
  Verification: "Ошибка верификации",
  OAuthSignin: "Ошибка при входе через OAuth",
  OAuthCallback: "Ошибка обратного вызова OAuth",
  OAuthCreateAccount: "Не удалось создать аккаунт OAuth",
  EmailCreateAccount: "Не удалось создать аккаунт",
  Callback: "Ошибка обратного вызова",
  OAuthAccountNotLinked: "Этот email уже используется с другим методом входа",
  EmailSignin: "Не удалось отправить email",
  CredentialsSignin: "Неверный email или пароль",
  SessionRequired: "Требуется авторизация",
  Default: "Произошла ошибка при авторизации",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="surface p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fef2f2] flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[var(--brand)]" />
          </div>
          <h2 className="text-xl font-extrabold mb-1.5">Ошибка авторизации</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-6">{errorMessage}</p>

          <div className="space-y-2">
            <Link href="/auth/signin" className="btn btn-primary w-full">
              Попробовать снова
            </Link>
            <Link href="/" className="btn btn-secondary w-full">
              На главную
            </Link>
          </div>

          {error && (
            <p className="mt-5 text-[11px] text-[var(--fg-subtle)] font-mono">
              Код ошибки: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
          <div className="text-sm text-[var(--fg-muted)]">Загрузка...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
