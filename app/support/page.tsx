'use client'

import { HelpCircle, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-muted)] py-8 px-4">
      <div className="container-page max-w-2xl">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="surface p-6 sm:p-7 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Поддержка</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Свяжитесь с нами любым удобным способом — мы быстро ответим.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="tel:+996555123456"
            className="card card-hover p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Телефон</p>
              <p className="text-xs text-[var(--fg-muted)]">+996 555 123 456</p>
            </div>
          </a>

          <a
            href="mailto:support@misskurochka.kg"
            className="card card-hover p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Email</p>
              <p className="text-xs text-[var(--fg-muted)]">support@misskurochka.kg</p>
            </div>
          </a>
        </div>

        <div className="surface p-5 mt-5">
          <h2 className="text-sm font-extrabold mb-3">Часто задаваемые вопросы</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            Раздел FAQ скоро появится. Пока что напишите нам — ответим лично.
          </p>
        </div>
      </div>
    </div>
  )
}
