'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, Receipt, User, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  matchPaths?: string[]
  isCart?: boolean
}

const items: NavItem[] = [
  { href: '/', label: 'Главная', icon: Home, matchPaths: ['/', '/home'] },
  { href: '/menu', label: 'Меню', icon: UtensilsCrossed, matchPaths: ['/menu'] },
  { href: '/cart', label: 'Корзина', icon: ShoppingCart, matchPaths: ['/cart'], isCart: true },
  { href: '/orders', label: 'Заказы', icon: Receipt, matchPaths: ['/orders'] },
  {
    href: '/profile',
    label: 'Профиль',
    icon: User,
    matchPaths: ['/profile', '/addresses', '/settings', '/notifications', '/support', '/branches'],
  },
]

interface Props {
  cartCount?: number
}

export default function BottomNavigation({ cartCount = 0 }: Props) {
  const pathname = usePathname() || '/'

  const isActive = (item: NavItem) => {
    if (item.matchPaths?.includes(pathname)) return true
    if (item.href !== '/' && pathname.startsWith(`${item.href}/`)) return true
    return false
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        boxShadow: '0 -6px 20px rgba(15,15,16,0.04)',
      }}
      aria-label="Основная навигация"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1 pb-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          const showBadge = item.isCart && cartCount > 0

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="group flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 select-none"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className="relative inline-flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 group-active:scale-90"
                  style={{
                    backgroundColor: active ? 'var(--brand-soft)' : 'transparent',
                    boxShadow: active ? '0 2px 10px rgba(214,35,0,0.15)' : 'none',
                  }}
                >
                  <Icon
                    className="transition-all duration-200"
                    style={{
                      width: 21,
                      height: 21,
                      color: active ? 'var(--brand)' : 'var(--fg-subtle)',
                    }}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: 'var(--brand)' }}
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </span>
                <span
                  className="text-[9px] font-bold leading-none transition-colors duration-200"
                  style={{ color: active ? 'var(--brand)' : 'var(--fg-subtle)' }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
