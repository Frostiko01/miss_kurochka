'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MapPin, ChevronDown, Bell } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Branch {
  id: string
  name: string
  address?: string
}

interface Props {
  selectedBranch: string | null
  branches: Branch[]
  onBranchChange: (id: string | null) => void
  onMenuOpen: () => void
  userName?: string | null
  userAvatar?: string | null
  notificationsCount?: number
}

export default function MobileHeader({
  selectedBranch,
  branches,
  onBranchChange,
  onMenuOpen,
  userName,
  userAvatar,
  notificationsCount = 0,
}: Props) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [branchOpen, setBranchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const currentBranch = branches.find((b) => b.id === selectedBranch)
  const initials = (userName?.trim()?.[0] ?? 'M').toUpperCase()

  return (
    <header
      className="sticky top-0 z-40 transition-all duration-200"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,1)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        paddingTop: 'env(safe-area-inset-top, 0)',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        {/* Hamburger */}
        <button
          onClick={onMenuOpen}
          aria-label="Открыть меню"
          className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full active:bg-[var(--bg-muted)] active:scale-95 transition-all"
        >
          <Menu className="w-6 h-6 text-[var(--fg)]" strokeWidth={2.2} />
        </button>

        {/* Branch picker — center */}
        <button
          onClick={() => setBranchOpen((v) => !v)}
          className="flex-1 min-w-0 flex flex-col items-center px-2 py-1 rounded-xl active:bg-[var(--bg-muted)] transition"
          aria-haspopup="listbox"
          aria-expanded={branchOpen}
        >
          <span className="text-[10px] font-semibold text-[var(--fg-subtle)] leading-none">
            {currentBranch ? 'Доставка из' : 'Выберите филиал'}
          </span>
          <span className="flex items-center gap-1 mt-0.5 max-w-full">
            <MapPin className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
            <span className="text-sm font-extrabold text-[var(--fg)] truncate">
              {currentBranch?.name ?? 'Все филиалы'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--fg-subtle)] shrink-0 transition-transform ${branchOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        {/* Notifications + Avatar */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/notifications')}
            aria-label="Уведомления"
            className="relative w-10 h-10 flex items-center justify-center rounded-full active:bg-[var(--bg-muted)] active:scale-95 transition-all"
          >
            <Bell className="w-[22px] h-[22px] text-[var(--fg)]" strokeWidth={2} />
            {notificationsCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                {notificationsCount > 9 ? '9+' : notificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => router.push('/profile')}
            aria-label="Профиль"
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: userAvatar
                ? undefined
                : 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            }}
          >
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-extrabold text-sm">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* Branch dropdown */}
      {branchOpen && (
        <>
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setBranchOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-3 right-3 mt-1 rounded-2xl bg-white border border-[var(--border)] shadow-lg overflow-hidden animate-slide-down">
            <button
              onClick={() => {
                onBranchChange(null)
                setBranchOpen(false)
              }}
              className="w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between hover:bg-[var(--bg-muted)] transition"
            >
              <span>Все филиалы</span>
              {!selectedBranch && <DotIcon />}
            </button>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  onBranchChange(b.id)
                  setBranchOpen(false)
                }}
                className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-[var(--bg-muted)] transition border-t border-[var(--border)]"
              >
                <span className="min-w-0 pr-2">
                  <span className="block font-semibold truncate">{b.name}</span>
                  {b.address && (
                    <span className="block text-[11px] text-[var(--fg-subtle)] truncate mt-0.5">
                      {b.address}
                    </span>
                  )}
                </span>
                {selectedBranch === b.id && <DotIcon />}
              </button>
            ))}
          </div>
        </>
      )}
    </header>
  )
}

function DotIcon() {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: 'var(--brand)' }}
    />
  )
}
