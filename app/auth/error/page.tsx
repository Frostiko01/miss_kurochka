"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  Configuration: "Ошибка конфигурации сервера",
  AccessDenied: "Доступ запрещен",
  Verification: "Ошибка верификации",
  OAuthSignin: "Ошибка при входе через OAuth",
  OAuthCallback: "Ошибка обратного вызова OAuth",
  OAuthCreateAccount: "Не удалось создать аккаунт OAuth",
  EmailCreateAccount: "Не удалось создать аккаунт",
  Callback: "Ошибка обратного вызова",
  OAuthAccountNotLinked:
    "Этот email уже используется с другим методом входа",
  EmailSignin: "Не удалось отправить email",
  CredentialsSignin: "Неверный email или пароль",
  SessionRequired: "Требуется авторизация",
  Default: "Произошла ошибка при авторизации",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessage =
    errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Ошибка авторизации
          </h2>
          <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#d62300] hover:bg-[#b01e00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d62300] transition-colors"
          >
            Попробовать снова
          </Link>

          <Link
            href="/"
            className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d62300] transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {error && (
          <p className="mt-4 text-xs text-gray-500">
            Код ошибки: {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Загрузка...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
