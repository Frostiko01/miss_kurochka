'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home,
  ShoppingCart,
  Package,
  User,
  Heart,
  MapPin,
  Tag,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  X,
  ChevronRight,
  UtensilsCrossed,
  Store,
} from 'lucide-react'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Закрываем по Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Блокируем скролл фона
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const user = session?.user
  const initials = user?.fullName?.charAt(0).toUpperCase() ?? '?'

  const mainItems: MenuItem[] = [
    { href: '/home', icon: <Home className="w-5 h-5" />, label: 'Главная' },
    { href: '/menu', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Меню' },
    { href: '/cart', icon: <ShoppingCart className="w-5 h-5" />, label: 'Корзина' },
    { href: '/orders', icon: <Package className="w-5 h-5" />, label: 'Мои заказы' },
    { href: '/favorites', icon: <Heart className="w-5 h-5" />, label: 'Избранное' },
    { href: '/branches', icon: <Store className="w-5 h-5" />, label: 'Филиалы' },
    { href: '/promotions', icon: <Tag className="w-5 h-5" />, label: 'Акции' },
  ]

  const accountItems: MenuItem[] = [
    { href: '/profile', icon: <User className="w-5 h-5" />, label: 'Профиль' },
    { href: '/addresses', icon: <MapPin className="w-5 h-5" />, label: 'Мои адреса' },
    { href: '/notifications', icon: <Bell className="w-5 h-5" />, label: 'Уведомления' },
    { href: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Настройки' },
    { href: '/support', icon: <HelpCircle className="w-5 h-5" />, label: 'Поддержка' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-3">
          {user ? (
            <Link href="/profile" onClick={onClose} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-extrabold truncate">{user.fullName}</p>
                <p className="text-xs text-[var(--fg-muted)] truncate">{user.email}</p>
              </div>
            </Link>
          ) : (
            <Link href="/auth/signin" onClick={onClose} className="text-sm font-bold text-[var(--brand)]">
              Войти
            </Link>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] shrink-0"
            aria-label="Закрыть меню"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          <MenuGroup title="Меню">
            {mainItems.map(item => (
              <MenuLink key={item.href} item={item} active={pathname === item.href} onClick={onClose} />
            ))}
          </MenuGroup>

          <div className="my-2 mx-5 border-t border-[var(--border)]" />

          <MenuGroup title="Аккаунт">
            {accountItems.map(item => (
              <MenuLink key={item.href} item={item} active={pathname === item.href} onClick={onClose} />
            ))}
          </MenuGroup>
        </nav>

        {/* Footer */}
        {user && (
          <div className="p-3 border-t border-[var(--border)]">
            <button
              onClick={() => {
                onClose()
                signOut({ callbackUrl: '/' })
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] transition"
            >
              <LogOut className="w-5 h-5" />
              Выйти из аккаунта
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1">
      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold px-3 py-2">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function MenuLink({
  item,
  active,
  onClick,
}: {
  item: MenuItem
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
        active
          ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
          : 'text-[var(--fg)] hover:bg-[var(--bg-muted)]'
      }`}
    >
      <span className={active ? 'text-[var(--brand)]' : 'text-[var(--fg-muted)] group-hover:text-[var(--fg)]'}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge && <span className="badge badge-brand">{item.badge}</span>}
      <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)] opacity-0 group-hover:opacity-100 transition" />
    </Link>
  )
}
