'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MapPin, Trash2, Plus, Home, Building2 } from 'lucide-react'
import MobileSubScreen from '@/components/mobile/MobileSubScreen'

interface Address {
  id: string
  addressLine: string
  apartment?: string | null
  entrance?: string | null
  floor?: string | null
  intercom?: string | null
  comment?: string | null
  createdAt: string
}

function cleanAddress(address: string): string {
  return address
    .replace(/,?\s*\d{6}/g, '')
    .replace(/,?\s*(Киргизия|Кыргызстан|Kyrgyzstan|KG)\s*$/i, '')
    .trim()
    .replace(/,\s*$/, '')
    .trim()
}

export default function AddressesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/addresses')
      return
    }
    if (status === 'authenticated') {
      fetchAddresses()
    }
  }, [status, router])

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses')
      const data = await res.json()
      if (res.ok) setAddresses(data.addresses ?? [])
    } catch {}
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' })
      if (res.ok) setAddresses(prev => prev.filter(a => a.id !== id))
    } catch {}
    setDeletingId(null)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-[var(--border)] p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 skeleton" />
                  <div className="h-2.5 w-1/2 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (addresses.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mb-5">
            <MapPin className="w-9 h-9 text-[var(--fg-subtle)]" />
          </div>
          <h2 className="text-lg font-extrabold mb-2">Нет сохранённых адресов</h2>
          <p className="text-sm text-[var(--fg-muted)] max-w-xs">
            Адреса сохраняются автоматически при оформлении заказа с доставкой
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2.5">
        {addresses.map(addr => (
          <div
            key={addr.id}
            className="rounded-2xl bg-white border border-[var(--border)] p-4 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
              {addr.apartment ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <Home className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold leading-tight">
                {cleanAddress(addr.addressLine)}
              </p>
              {(addr.apartment || addr.entrance || addr.floor || addr.intercom) && (
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  {[
                    addr.apartment && `Кв. ${addr.apartment}`,
                    addr.entrance && `Под. ${addr.entrance}`,
                    addr.floor && `Эт. ${addr.floor}`,
                    addr.intercom && `Домофон ${addr.intercom}`,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {addr.comment && (
                <p className="text-xs text-[var(--fg-subtle)] mt-0.5 italic">
                  {addr.comment}
                </p>
              )}
              <p className="text-[11px] text-[var(--fg-subtle)] mt-1 font-semibold">
                {new Date(addr.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <button
              onClick={() => handleDelete(addr.id)}
              disabled={deletingId === addr.id}
              aria-label="Удалить адрес"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--fg-subtle)] hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all disabled:opacity-50 shrink-0"
            >
              {deletingId === addr.id ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}

        {/* Подсказка */}
        <div className="rounded-2xl bg-[var(--bg-muted)] p-4 flex items-start gap-3">
          <Plus className="w-4 h-4 text-[var(--fg-subtle)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
            Новые адреса добавляются автоматически при оформлении заказа с доставкой
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile */}
      <MobileSubScreen
        title="Адреса доставки"
        subtitle={
          !loading && addresses.length > 0
            ? `${addresses.length} ${addresses.length === 1 ? 'адрес' : addresses.length < 5 ? 'адреса' : 'адресов'}`
            : undefined
        }
      >
        <div className="px-4 pt-3">{renderContent()}</div>
      </MobileSubScreen>

      {/* Desktop */}
      <div className="hidden md:block min-h-screen bg-[var(--bg-muted)] py-8 px-4">
        <div className="container-page max-w-2xl">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Адреса доставки</h1>
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  )
}
