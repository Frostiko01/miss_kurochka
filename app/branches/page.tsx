'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Store, Phone, MapPin, Clock } from 'lucide-react'

export default function BranchesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/branches')
    else if (status === 'authenticated') fetchBranches()
  }, [status, router])

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      const data = await res.json()
      if (res.ok) setBranches(data.data ?? data.branches ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--fg-muted)] font-semibold">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] py-6 px-4">
      <div className="container-page max-w-3xl">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Наши филиалы</h1>
        </div>

        {branches.length === 0 ? (
          <div className="surface p-8 text-center">
            <Store className="w-10 h-10 text-[var(--fg-subtle)] mx-auto mb-3" />
            <p className="text-sm text-[var(--fg-muted)]">Филиалы не найдены</p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map(branch => (
              <div key={branch.id} className="surface p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-extrabold">{branch.name}</h2>
                    <p className="text-sm text-[var(--fg-muted)] mt-1 leading-relaxed">
                      {branch.address}
                    </p>

                    {branch.phone && (
                      <a
                        href={`tel:${branch.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] font-semibold mt-2.5 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {branch.phone}
                      </a>
                    )}

                    {branch.schedules && branch.schedules.length > 0 && (
                      <div className="mt-3 flex items-start gap-1.5 text-xs text-[var(--fg-muted)]">
                        <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          {branch.schedules[0].openTime && branch.schedules[0].closeTime
                            ? `${branch.schedules[0].openTime} — ${branch.schedules[0].closeTime}`
                            : 'Уточняйте по телефону'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
