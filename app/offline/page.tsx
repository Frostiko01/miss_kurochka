import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Нет подключения — Miss Kurochka',
  description: 'Похоже, вы офлайн. Проверьте подключение к интернету.',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Miss Kurochka"
            width={88}
            height={88}
            className="rounded-2xl shadow-[var(--shadow)]"
          />
        </div>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft)] mb-5">
          {/* Иконка "нет сети" */}
          <svg
            className="w-8 h-8 text-[var(--brand)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-[var(--fg)] mb-2">
          Нет подключения к интернету
        </h1>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-8">
          Похоже, вы сейчас офлайн. Проверьте соединение и попробуйте снова.
          Ранее открытые страницы могут быть доступны без сети.
        </p>

        <div className="flex flex-col gap-3">
          {/* Кнопка обновления использует нативную перезагрузку без JS-обработчика,
              чтобы страница работала даже при минимальном окружении */}
          <a href="/" className="btn btn-primary btn-lg w-full">
            Попробовать снова
          </a>
          <Link href="/menu" className="btn btn-secondary w-full">
            Открыть меню
          </Link>
        </div>

        <p className="text-xs text-[var(--fg-subtle)] mt-8">
          Miss Kurochka — самая вкусная курочка
        </p>
      </div>
    </div>
  )
}
