'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home,
  ShoppingCart,
  Package,
  User,
  Heart,
  MapPin,
  HelpCircle,
  Settings,
  LogOut,
  X,
  ChevronRight,
  UtensilsCrossed,
  Store,
  Phone,
  Clock,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

// Динамический импорт карты (SSR отключён — Leaflet требует window)
const BranchesMap = dynamic(() => import('@/components/map/BranchesMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-[var(--bg-muted)] flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[var(--fg-muted)] font-semibold">Загрузка карты...</span>
    </div>
  ),
})

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (menuItemId: string) => void
}

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string
}

type Panel = 'main' | 'branches' | 'favorites'

export default function SideMenu({ isOpen, onClose, onAddToCart }: SideMenuProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { favorites, ids: favoriteIds, toggle, isFavorite } = useFavorites()

  const [panel, setPanel] = useState<Panel>('main')
  const [branches, setBranches] = useState<any[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [favoriteItems, setFavoriteItems] = useState<any[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  // Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (panel !== 'main') setPanel('main')
        else onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose, panel])

  // Блокируем скролл
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  // Сброс панели при закрытии
  useEffect(() => {
    if (!isOpen) setPanel('main')
  }, [isOpen])

  // Загрузка филиалов
  const handleOpenBranches = async () => {
    setPanel('branches')
    if (branches.length === 0) {
      setLoadingBranches(true)
      try {
        const res = await fetch('/api/branches')
        const data = await res.json()
        if (res.ok) setBranches(data.data ?? data.branches ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingBranches(false)
      }
    }
  }

  // Загрузка избранных блюд
  const handleOpenFavorites = async () => {
    setPanel('favorites')
    if (favoriteIds.length === 0) return
    setLoadingFavorites(true)
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      if (res.ok) {
        const all = [
          ...(data.grouped?.regular ?? []),
          ...(data.grouped?.combo ?? []),
          ...(data.grouped?.mini_combo ?? []),
        ].flatMap((cat: any) => cat.items ?? [])
        setFavoriteItems(all.filter((item: any) => favoriteIds.includes(item.id)))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingFavorites(false)
    }
  }

  // Обновляем список избранного при изменении ids (стабильный массив)
  useEffect(() => {
    if (panel === 'favorites') {
      setFavoriteItems(prev => prev.filter(item => favoriteIds.includes(item.id)))
    }
  }, [favoriteIds, panel])

  const user = session?.user
  const initials = user?.fullName?.charAt(0).toUpperCase() ?? '?'
  const favCount = favoriteIds.length

  const mainItems: NavItem[] = [
    { href: '/home', icon: <Home className="w-5 h-5" />, label: 'Главная' },
    { href: '/menu', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Меню' },
    { href: '/cart', icon: <ShoppingCart className="w-5 h-5" />, label: 'Корзина' },
    { href: '/orders', icon: <Package className="w-5 h-5" />, label: 'Мои заказы' },
  ]

  const accountItems: NavItem[] = [
    { href: '/profile', icon: <User className="w-5 h-5" />, label: 'Профиль' },
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
        {/* ─── BRANCHES PANEL ─── */}
        {panel === 'branches' && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col animate-slide-down">
            <PanelHeader title="Наши филиалы" icon={<MapPin className="w-4 h-4 text-[var(--brand)]" />} onBack={() => setPanel('main')} />

            {loadingBranches ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner />
              </div>
            ) : branches.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyPanel icon={<Store className="w-10 h-10" />} text="Филиалы не найдены" />
              </div>
            ) : (
              <>
                {/* Список филиалов */}
                <div className="overflow-y-auto scrollbar-thin p-4 space-y-3" style={{ maxHeight: '55%' }}>
                  {branches.map(branch => (
                    <div key={branch.id} className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg-muted)]/50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-extrabold">{branch.name}</h3>
                          <p className="text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{branch.address}</p>
                          {branch.phone && (
                            <a href={`tel:${branch.phone}`} className="inline-flex items-center gap-1.5 text-xs text-[var(--brand)] font-semibold mt-2 hover:underline">
                              <Phone className="w-3.5 h-3.5" />
                              {branch.phone}
                            </a>
                          )}
                          {branch.email && <p className="text-xs text-[var(--fg-muted)] mt-1">{branch.email}</p>}
                          {branch.schedules?.[0]?.openTime && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>{branch.schedules[0].openTime} — {branch.schedules[0].closeTime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Мини-карта */}
                <div className="border-t border-[var(--border)] p-3 flex-1 min-h-0">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold mb-2 px-1">
                    На карте
                  </p>
                  <BranchesMap branches={branches} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── FAVORITES PANEL ─── */}
        {panel === 'favorites' && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col animate-slide-down">
            <PanelHeader
              title="Избранное"
              icon={<Heart className="w-4 h-4 text-[var(--brand)]" />}
              onBack={() => setPanel('main')}
              badge={favCount > 0 ? String(favCount) : undefined}
            />
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              {loadingFavorites ? (
                <Spinner />
              ) : favoriteItems.length === 0 ? (
                <EmptyPanel
                  icon={<Heart className="w-10 h-10" />}
                  text="Нет избранных блюд"
                  sub="Нажмите ♡ на карточке блюда, чтобы добавить"
                />
              ) : (
                <div className="space-y-2.5">
                  {favoriteItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-white">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0">
                        {item.images?.[0]?.imageUrl ? (
                          <img src={item.images[0].imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🍗</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight truncate">{item.name}</p>
                        <p className="text-sm font-extrabold text-[var(--brand)] mt-0.5">{Number(item.price)} сом</p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        {onAddToCart && (
                          <button
                            onClick={async () => {
                              await onAddToCart(item.id)
                              onClose()
                              router.push('/cart')
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                            aria-label="В корзину"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => toggle(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#fef2f2] text-[var(--brand)] transition"
                          aria-label="Убрать из избранного"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── MAIN MENU ─── */}
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-3">
          {user ? (
            <Link href="/profile" onClick={onClose} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-12 h-12 rounded-full object-cover shrink-0" />
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
            <Link href="/auth/signin" onClick={onClose} className="text-sm font-bold text-[var(--brand)]">Войти</Link>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] shrink-0" aria-label="Закрыть">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          <MenuGroup title="Меню">
            {mainItems.map(item => (
              <MenuNavLink key={item.href} item={item} active={pathname === item.href} onClick={onClose} />
            ))}

            {/* Избранное */}
            <button
              onClick={handleOpenFavorites}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group text-[var(--fg)] hover:bg-[var(--bg-muted)]"
            >
              <span className="text-[var(--fg-muted)] group-hover:text-[var(--brand)]">
                <Heart className="w-5 h-5" />
              </span>
              <span className="flex-1 text-left">Избранное</span>
              {favCount > 0 && <span className="badge badge-brand">{favCount}</span>}
              <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)] opacity-0 group-hover:opacity-100 transition" />
            </button>

            {/* Филиалы */}
            <button
              onClick={handleOpenBranches}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group text-[var(--fg)] hover:bg-[var(--bg-muted)]"
            >
              <span className="text-[var(--fg-muted)] group-hover:text-[var(--fg)]">
                <Store className="w-5 h-5" />
              </span>
              <span className="flex-1 text-left">Филиалы</span>
              <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)] opacity-0 group-hover:opacity-100 transition" />
            </button>
          </MenuGroup>

          <div className="my-2 mx-5 border-t border-[var(--border)]" />

          <MenuGroup title="Аккаунт">
            {accountItems.map(item => (
              <MenuNavLink key={item.href} item={item} active={pathname === item.href} onClick={onClose} />
            ))}
          </MenuGroup>
        </nav>

        {/* Footer */}
        {user && (
          <div className="p-3 border-t border-[var(--border)]">
            <button
              onClick={() => { onClose(); signOut({ callbackUrl: '/' }) }}
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

// ─── helpers ───

function PanelHeader({ title, icon, onBack, badge }: { title: string; icon: React.ReactNode; onBack: () => void; badge?: string }) {
  return (
    <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
      <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)]" aria-label="Назад">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 flex-1">
        {icon}
        <h2 className="text-base font-extrabold">{title}</h2>
        {badge && <span className="badge badge-brand">{badge}</span>}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function EmptyPanel({ icon, text, sub }: { icon: React.ReactNode; text: string; sub?: string }) {
  return (
    <div className="text-center py-10">
      <div className="text-[var(--fg-subtle)] flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-semibold text-[var(--fg-muted)]">{text}</p>
      {sub && <p className="text-xs text-[var(--fg-subtle)] mt-1 px-4">{sub}</p>}
    </div>
  )
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1">
      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold px-3 py-2">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function MenuNavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
        active ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'text-[var(--fg)] hover:bg-[var(--bg-muted)]'
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
