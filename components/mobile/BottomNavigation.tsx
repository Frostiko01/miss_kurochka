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
    <>
      {/* iOS Liquid Glass Floating Bottom Navigation */}
      <nav
        className="fixed z-40 flex items-center justify-center"
        style={{
          left: '16px',
          right: '16px',
          bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none',
        }}
        aria-label="Основная навигация"
      >
        <div
          className="relative w-full flex items-center justify-around px-4 transition-all duration-300"
          style={{
            height: '80px',
            maxWidth: '420px',
            borderRadius: '32px',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `
              0 20px 40px rgba(0, 0, 0, 0.08),
              0 8px 16px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 rgba(255, 255, 255, 0.2)
            `,
            pointerEvents: 'auto',
          }}
        >
          {/* Glass Shine Effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '32px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)',
            }}
          />

          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            const showBadge = item.isCart && cartCount > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative group flex items-center justify-center transition-all duration-300 ease-out select-none active:scale-95"
                style={{
                  height: '52px',
                  minWidth: '52px',
                  borderRadius: '999px',
                  padding: active ? '0 22px' : '0',
                  backgroundColor: active ? 'rgba(255, 60, 60, 0.12)' : 'transparent',
                  boxShadow: active
                    ? 'inset 0 0 20px rgba(255, 60, 60, 0.1), 0 4px 12px rgba(255, 60, 60, 0.15)'
                    : 'none',
                }}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon Container */}
                <div
                  className="relative flex items-center justify-center transition-all duration-300"
                  style={{
                    transform: active ? 'scale(1)' : 'scale(0.95)',
                  }}
                >
                  <Icon
                    style={{
                      width: '25px',
                      height: '25px',
                      strokeWidth: 2,
                      color: active ? '#ff3c3c' : '#7A7A7A',
                      transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />
                  
                  {/* Badge */}
                  {showBadge && (
                    <span
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white animate-pulse"
                      style={{
                        backgroundColor: '#ff3c3c',
                        boxShadow: '0 2px 8px rgba(255, 60, 60, 0.4)',
                      }}
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>

                {/* Label - Salomon Effect */}
                {active && (
                  <span
                    className="ml-2 text-sm font-bold whitespace-nowrap overflow-hidden animate-slide-in"
                    style={{
                      color: '#ff3c3c',
                      animation: 'slideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                    }}
                  >
                    {item.label}
                  </span>
                )}

                {/* Active Glow */}
                {active && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: '999px',
                      background: 'radial-gradient(circle at center, rgba(255,60,60,0.15) 0%, transparent 70%)',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  )
}
