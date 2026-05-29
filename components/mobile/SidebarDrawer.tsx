'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  X,
  Flame,
  ShoppingBag,
  Building2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  LogIn,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface User {
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  user?: User | null
  isAuthenticated: boolean
  onAuthClick: () => void
}

interface MenuLink {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

const primaryItems: MenuLink[] = [
  { href: '/#combo', label: 'Комбо-наборы', icon: Flame },
  { href: '/cart', label: 'Корзина', icon: ShoppingBag },
  { href: '/branches', label: 'Филиалы', icon: Building2 },
]

const secondaryItems: MenuLink[] = [
  { href: '/settings', label: 'Настройки', icon: Settings },
  { href: '/support', label: 'Поддержка', icon: HelpCircle },
]

export default function SidebarDrawer({
  open,
  onClose,
  user,
  isAuthenticated,
  onAuthClick,
}: Props) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [dragX, setDragX] = useState(0)

  // Блок скролла body
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  // Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // Swipe-to-close (свайп влево)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setDragX(0)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const dx = e.touches[0].clientX - touchStartX
    if (dx < 0) setDragX(dx)
  }
  const onTouchEnd = () => {
    if (dragX < -80) onClose()
    setTouchStartX(null)
    setDragX(0)
  }

  const handleNav = (href: string) => {
    onClose()
    // Якоря на главной — даём время закрыться, потом скроллим
    if (href.startsWith('/#')) {
      const id = href.slice(2)
      if (window.location.pathname === '/') {
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 250)
      } else {
        router.push(href)
      }
      return
    }
    router.push(href)
  }

  const initials = (user?.fullName?.trim()?.[0] ?? 'M').toUpperCase()

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Меню"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Закрыть меню"
        onClick={onClose}
        className="absolute inset-0 animate-fadeIn"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="absolute top-0 left-0 bottom-0 w-[82%] max-w-[340px] bg-white shadow-2xl flex flex-col animate-slide-in-left"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
          transform: dragX < 0 ? `translateX(${dragX}px)` : undefined,
        }}
      >
        {/* Top: User block */}
        <div className="px-5 pt-4 pb-5 border-b border-[var(--border)] flex items-start gap-3">
          <button
            onClick={() => {
              if (isAuthenticated) {
                handleNav('/profile')
              } else {
                onClose()
                onAuthClick()
              }
            }}
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            style={{
              background: user?.avatarUrl
                ? undefined
                : 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-extrabold text-base">{initials}</span>
            )}
          </button>
          <div className="flex-1 min-w-0 pt-0.5">
            {isAuthenticated ? (
              <>
                <p className="text-base font-extrabold text-[var(--fg)] truncate">
                  {user?.fullName ?? 'Пользователь'}
                </p>
                {user?.email && (
                  <p className="text-xs text-[var(--fg-subtle)] truncate mt-0.5">
                    {user.email}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[var(--fg)]">Гость</p>
                <button
                  onClick={() => {
                    onClose()
                    onAuthClick()
                  }}
                  className="text-xs font-semibold text-[var(--brand)] mt-0.5 inline-flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  Войти
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full active:bg-[var(--bg-muted)] active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-[var(--fg-muted)]" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          <Section>
            {primaryItems.map((it) => (
              <DrawerItem key={it.href} item={it} onClick={() => handleNav(it.href)} />
            ))}
          </Section>

          <Divider />

          <Section>
            {secondaryItems.map((it) => (
              <DrawerItem key={it.href} item={it} onClick={() => handleNav(it.href)} />
            ))}
          </Section>
        </nav>

        {/* Bottom: Logout */}
        {isAuthenticated && (
          <div className="px-3 pb-3 pt-2 border-t border-[var(--border)]">
            <button
              onClick={async () => {
                onClose()
                await signOut({ callbackUrl: '/' })
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#dc2626] hover:bg-red-50 active:scale-[0.98] transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1 flex flex-col">{children}</div>
}

function Divider() {
  return <div className="my-2 mx-5 h-px bg-[var(--border)]" />
}

function DrawerItem({ item, onClick }: { item: MenuLink; onClick: () => void }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)] active:scale-[0.98] transition-all"
    >
      <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-muted)]">
        <Icon className="w-[18px] h-[18px] text-[var(--fg)]" strokeWidth={2.2} />
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge ? (
        <span
          className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {item.badge}
        </span>
      ) : (
        <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)]" />
      )}
    </button>
  )
}
