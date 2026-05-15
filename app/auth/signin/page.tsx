"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, X, AlertCircle, CheckCircle2 } from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";
  const resetSuccess = searchParams.get("reset") === "success";
  const authError = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (session.user.role === "branch") {
        router.push("/branch/dashboard");
      } else {
        router.push(callbackUrl === "/profile" ? "/home" : callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState("");

  useEffect(() => {
    if (authError) {
      const errorMessages: Record<string, string> = {
        CredentialsSignin: "Неверный email или пароль",
        OAuthAccountNotLinked: "Этот email уже используется с другим методом входа",
        Configuration: "Ошибка конфигурации. Попробуйте войти через Google.",
      };
      setError(errorMessages[authError] || authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const checkResponse = await fetch("/api/auth/check-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const checkData = await checkResponse.json();

      if (checkData.hasOAuth) {
        setOauthProvider(checkData.provider);
        setShowOAuthModal(true);
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Неверный email или пароль" : result.error);
      } else if (result?.ok) {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        if (session?.user?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (session?.user?.role === "branch") {
          router.push("/branch/dashboard");
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при входе");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    setShowOAuthModal(false);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("Ошибка при входе через Google");
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--fg-muted)] font-semibold">
            {status === "authenticated" ? "Перенаправление..." : "Загрузка..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowOAuthModal(false)}
        >
          <div
            className="surface shadow-lg max-w-md w-full p-6 relative animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowOAuthModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)]"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <h3 className="text-lg font-extrabold mb-1">Вход через {oauthProvider}</h3>
            <p className="text-sm text-[var(--fg-muted)] mb-5">
              Этот аккаунт зарегистрирован через {oauthProvider}. Используйте кнопку ниже для входа.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                Войти через {oauthProvider}
              </button>
              <button onClick={() => setShowOAuthModal(false)} className="btn btn-secondary w-full">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Miss Kurochka"
              width={56}
              height={56}
              className="rounded-xl"
            />
          </Link>

          <div className="surface shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-[var(--border)]">
              <h2 className="text-xl font-extrabold tracking-tight">Вход</h2>
              <p className="text-sm text-[var(--fg-muted)] mt-1">
                Войдите в свой аккаунт Miss Kurochka
              </p>
            </div>

            <div className="p-6">
              {resetSuccess && (
                <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#ecfdf5] border border-[#d1fae5]">
                  <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#065f46] font-semibold">
                    Пароль изменён. Войдите с новым паролем.
                  </p>
                </div>
              )}

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
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input pl-9"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="label !mb-0">Пароль</label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)]"
                    >
                      Забыли пароль?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  {isLoading ? "Вход..." : "Войти"}
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

              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
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
            </div>

            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-[var(--fg-muted)]">
                Нет аккаунта?{" "}
                <Link
                  href="/auth/signup"
                  className="font-bold text-[var(--brand)] hover:text-[var(--brand-dark)]"
                >
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] font-semibold"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
          <div className="text-sm text-[var(--fg-muted)]">Загрузка...</div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
