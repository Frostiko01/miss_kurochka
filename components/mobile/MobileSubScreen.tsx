'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Menu as MenuIcon } from 'lucide-react'
import SidebarDrawer from './SidebarDrawer'

interface Props {
  title: string
  subtitle?: string
  /** Назад-кнопка вместо бургера. По умолчанию true для подстраниц. */
  back?: boolean
  /** Куда вести back. По умолчанию router.back(). */
  backHref?: string
  /** Кастомный правый блок (например, кнопка действия). */
  rightSlot?: React.ReactNode
  onAuthClick?: () => void
  children: React.ReactNode
  /** Не добавлять нижний отступ под bottom nav. */
  noBottomSpace?: boolean
}

/**
 * Универсальная мобильная обёртка для подстраниц:
 * - Sticky header с back/burger
 * - Sidebar drawer
 * - Safe area paddings
 * - Pad-bottom под Bottom Navigation
 */
export default function MobileSubScreen({
  title,
  subtitle,
  back = true,
  backHref,
  rightSlot,
  onAuthClick,
  children,
  noBottomSpace = false,
}: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleBack = () => {
    if (backHref) router.push(backHref)
    else if (window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <div className="md:hidden min-h-screen bg-[var(--bg)]">
      <header
        className="sticky top-0 z-40 transition-all duration-200"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,1)',
          backdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          paddingTop: 'env(safe-area-inset-top, 0)',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            onClick={back ? handleBack : () => setDrawerOpen(true)}
            aria-label={back ? 'Назад' : 'Меню'}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-[var(--bg-muted)] active:scale-95 transition-all"
          >
            {back ? (
              <ArrowLeft className="w-[22px] h-[22px] text-[var(--fg)]" strokeWidth={2.2} />
            ) : (
              <MenuIcon className="w-[22px] h-[22px] text-[var(--fg)]" strokeWidth={2.2} />
            )}
          </button>

          <div className="flex-1 min-w-0 px-1">
            <h1 className="text-base font-extrabold tracking-tight text-[var(--fg)] truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-[var(--fg-subtle)] font-semibold truncate leading-tight">
                {subtitle}
              </p>
            )}
          </div>

          {rightSlot ? (
            <div className="shrink-0 flex items-center gap-1">{rightSlot}</div>
          ) : !back ? (
            // Слева уже есть бургер — справа ничего не показываем
            <div className="w-10 h-10 shrink-0" />
          ) : (
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Меню"
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-[var(--bg-muted)] active:scale-95 transition-all shrink-0"
            >
              <MenuIcon className="w-[22px] h-[22px] text-[var(--fg)]" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </header>

      <SidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={session?.user ?? null}
        isAuthenticated={!!session?.user}
        onAuthClick={onAuthClick ?? (() => router.push('/auth/signin'))}
      />

      <main
        className="flex flex-col"
        style={{ paddingBottom: noBottomSpace ? undefined : 'calc(env(safe-area-inset-bottom, 0) + 100px)' }}
      >
        {children}
      </main>
    </div>
  )
}
