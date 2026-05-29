'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BottomNavigation from './BottomNavigation'

/**
 * Глобальная мобильная обёртка.
 * - Показывает Bottom Navigation на основных потребительских экранах
 * - Прячется в админке, в кабинете филиала, на auth-страницах, в корзине/чекауте
 * - Поднимает контент над фиксированной нижней панелью с safe-area
 */
const HIDDEN_PREFIXES = [
  '/admin',
  '/branch',
  '/auth',
  '/cart',
  '/checkout',
  '/test-',
  '/demo-',
]

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const { data: session } = useSession()
  const [cartCount, setCartCount] = useState(0)

  const hidden = useMemo(
    () => HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
    [pathname],
  )

  // Подгружаем счётчик корзины. setState в useEffect только в response handlers — это OK.
  useEffect(() => {
    if (!session || hidden) return
    let cancelled = false
    const load = () => {
      fetch('/api/cart')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data?.cart?.items) return
          const sum = (data.cart.items as Array<{ quantity: number }>).reduce(
            (s, i) => s + i.quantity,
            0,
          )
          setCartCount(sum)
        })
        .catch(() => {})
    }
    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname, session, hidden])

  // Сброс счётчика при выходе/переходе на скрытую зону — без setState внутри effect body
  const effectiveCount = !session || hidden ? 0 : cartCount

  return (
    <>
      {children}
      {!hidden && (
        <div className="md:hidden">
          <BottomNavigation cartCount={effectiveCount} />
        </div>
      )}
    </>
  )
}
