'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, Phone, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import MobileSubScreen from '@/components/mobile/MobileSubScreen'
import AiChatModal from '@/components/AiChatModal'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
}

function cleanAddress(address: string): string {
  return address
    .replace(/,?\s*\d{6}/g, '')
    .replace(/,?\s*(Киргизия|Кыргызстан|Kyrgyzstan|KG)\s*$/i, '')
    .trim()
    .replace(/,\s*$/, '')
    .trim()
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

// Форматируем номер для WhatsApp — только цифры
function toWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

export default function SupportPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    fetch('/api/branches')
      .then(r => r.json())
      .then(data => setBranches(data.data ?? data.branches ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const content = (
    <div className="px-4 pt-6 space-y-5">
      {/* Заголовок */}
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight mb-1">Поддержка</h2>
        <p className="text-sm text-[var(--fg-muted)]">
          Свяжитесь с нами через WhatsApp или Instagram
        </p>
      </div>

      {/* Филиалы */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-[var(--border)] p-4">
              <div className="h-4 w-1/2 skeleton mb-2" />
              <div className="h-3 w-3/4 skeleton" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map(branch => (
            <div
              key={branch.id}
              className="rounded-2xl bg-white border border-[var(--border)] p-4 space-y-3"
            >
              {/* Название + адрес */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{branch.name}</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                    {cleanAddress(branch.address)}
                  </p>
                </div>
              </div>

              {/* Кнопки: Позвонить + WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${branch.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--bg-muted)] active:scale-95 transition-transform"
                  style={{ color: 'var(--fg)' }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Позвонить
                </a>
                <a
                  href={toWhatsApp(branch.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform"
                  style={{ background: '#25D366' }}
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ИИ-помощник */}
      <button
        onClick={() => setAiOpen(true)}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[var(--border)] active:scale-[0.98] transition-transform"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #111 0%, #d62300 100%)' }}
        >
          <Image src="/logo.png" alt="AI" width={32} height={32} className="rounded-lg object-cover" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-extrabold">ИИ-помощник</p>
          <p className="text-xs text-[var(--fg-muted)] font-semibold mt-0.5">
            Задайте вопрос нашему ИИ
          </p>
        </div>
      </button>

      {/* Instagram */}
      <a
        href="https://instagram.com/miss.kurochka"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[var(--border)] active:scale-[0.98] transition-transform"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background:
              'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          }}
        >
          <InstagramIcon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">Instagram</p>
          <p className="text-xs text-[var(--fg-muted)] font-semibold mt-0.5">@miss.kurochka</p>
        </div>
      </a>
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <MobileSubScreen title="Поддержка">{content}</MobileSubScreen>

      {/* Desktop */}
      <div className="hidden md:block min-h-screen bg-[var(--bg-muted)] py-8 px-4">
        <div className="container-page max-w-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          {content}
        </div>
      </div>

      <AiChatModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  )
}
