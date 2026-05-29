'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Store, Phone, MapPin, Clock } from 'lucide-react'
import MobileSubScreen from '@/components/mobile/MobileSubScreen'
import Spinner from '@/components/Spinner'

interface BranchSchedule {
  openTime?: string | null
  closeTime?: string | null
}

interface Branch {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  schedules?: BranchSchedule[]
}

export default function BranchesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/branches')
      return
    }
    if (status === 'authenticated') {
      let cancelled = false
      fetch('/api/branches')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return
          if (data) setBranches(data.data ?? data.branches ?? [])
          setLoading(false)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }
  }, [status, router])

  const loadingSpinner = (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-sm text-[var(--fg-muted)] font-semibold">Загрузка...</p>
      </div>
    </div>
  )

  const renderList = (compact = false) => {
    if (loading) return loadingSpinner
    if (branches.length === 0) {
      return (
        <div className={compact ? 'p-6' : 'surface p-8'} >
          <div className="text-center">
            <Store className="w-10 h-10 text-[var(--fg-subtle)] mx-auto mb-3" />
            <p className="text-sm text-[var(--fg-muted)]">Филиалы не найдены</p>
          </div>
        </div>
      )
    }
    return (
      <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
        {branches.map(branch => (
          <div
            key={branch.id}
            className={
              compact
                ? 'rounded-2xl bg-white border border-[var(--border)] p-4'
                : 'surface p-5'
            }
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-extrabold">{branch.name}</h2>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                  {branch.address}
                </p>

                <div className="flex flex-wrap gap-3 mt-2">
                  {branch.phone && (
                    <a
                      href={`tel:${branch.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--brand)] font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {branch.phone}
                    </a>
                  )}
                  {branch.schedules && branch.schedules.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {branch.schedules[0].openTime && branch.schedules[0].closeTime
                        ? `${branch.schedules[0].openTime} — ${branch.schedules[0].closeTime}`
                        : 'Уточняйте по телефону'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile */}
      <MobileSubScreen title="Филиалы" subtitle={`${branches.length} точек в городе`}>
        <div className="px-4 pt-3">{renderList(true)}</div>
      </MobileSubScreen>

      {/* Desktop */}
      <div className="hidden md:block min-h-screen bg-[var(--bg-muted)] py-6 px-4">
        <div className="container-page max-w-3xl">
          <Link
            href="/"
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

          {renderList(false)}
        </div>
      </div>
    </>
  )
}
