'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart,
  Package,
  ChevronRight,
  User,
  MapPin,
  Clock,
  Flame,
  Star,
  Plus,
  Minus,
  LogOut,
  Phone,
  CheckCircle,
  Truck,
  Store,
  ChefHat,
  Menu as MenuIcon,
} from 'lucide-react'
import MenuItemModal from '@/components/MenuItemModal'
import AuthModal from '@/components/AuthModal'
import SideMenu from '@/components/SideMenu'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  preparing: 'Готовится',
  ready: 'Готов',
  delivering: 'В пути',
  completed: 'Завершён',
  cancelled: 'Отменён',
}
const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  preparing: 'badge-warning',
  ready: 'badge-success',
  delivering: 'badge-info',
  completed: 'badge',
  cancelled: 'badge-danger',
}
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle className="w-4 h-4" />,
  preparing: <ChefHat className="w-4 h-4" />,
  ready: <CheckCircle className="w-4 h-4" />,
  delivering: <Truck className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  cancelled: <CheckCircle className="w-4 h-4" />,
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [popularItems, setPopularItems] = useState<any[]>([])
  const [combos, setCombos] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartItems, setCartItems] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sideMenuOpen, setSideMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/home')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetchPopularItems(),
        fetchCombos(),
        fetchRecentOrders(),
        fetchCart(),
        fetchBranches(),
      ]).finally(() => setLoading(false))
    }
  }, [status])

  const fetchPopularItems = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      if (res.ok) {
        const all = [
          ...(data.grouped?.regular ?? []),
          ...(data.grouped?.combo ?? []),
          ...(data.grouped?.mini_combo ?? []),
        ].flatMap((cat: any) => cat.items ?? [])
        const featured = all.filter((i: any) => i.isFeatured).slice(0, 8)
        const result =
          featured.length >= 8
            ? featured
            : [...featured, ...all.filter((i: any) => !i.isFeatured).slice(0, 8 - featured.length)]
        setPopularItems(result)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCombos = async () => {
    try {
      const res = await fetch('/api/combo-offers')
      const data = await res.json()
      if (res.ok) setCombos(data.combos?.slice(0, 4) ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch('/api/user/orders?limit=3')
      const data = await res.json()
      if (res.ok) setRecentOrders(data.orders ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      if (res.ok && data.cart) {
        const count = data.cart.items.reduce((s: number, i: any) => s + i.quantity, 0)
        setCartCount(count)
        const total = data.cart.items.reduce((s: number, i: any) => {
          let t = Number(i.menuItem.price) * i.quantity
          i.modifiers?.forEach((m: any) => { t += Number(m.modifierOption.priceDelta) * i.quantity })
          return s + t
        }, 0)
        setCartTotal(total)
        const map: Record<string, { quantity: number; cartItemId: string }> = {}
        data.cart.items.forEach((i: any) => {
          map[i.menuItem.id] = { quantity: i.quantity, cartItemId: i.id }
        })
        setCartItems(map)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      const data = await res.json()
      if (res.ok) setBranches(data.data ?? data.branches ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  const addToCart = async (menuItemId?: string, modifiers?: string[], quantity?: number) => {
    if (!session) { setShowAuthModal(true); return }
    if (!menuItemId) return
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, quantity: quantity || 1, modifiers: modifiers || [] }),
      })
      if (res.ok) fetchCart()
    } catch (e) {
      console.error(e)
    }
  }

  const updateCartItem = async (menuItemId: string, newQuantity: number) => {
    const cartItem = cartItems[menuItemId]
    if (!cartItem) return
    try {
      if (newQuantity <= 0) {
        const res = await fetch(`/api/cart/items?id=${cartItem.cartItemId}`, { method: 'DELETE' })
        if (res.ok) fetchCart()
      } else {
        const res = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId: cartItem.cartItemId, quantity: newQuantity }),
        })
        if (res.ok) fetchCart()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleItemClick = (item: any) => {
    if (item.modifiers?.length > 0) {
      setSelectedMenuItem(item)
      setShowItemModal(true)
    } else {
      addToCart(item.id)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--fg-muted)] font-semibold">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const user = session.user
  const initials = user.fullName?.charAt(0).toUpperCase() ?? '?'
  const activeOrders = recentOrders.filter(o =>
    ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)
  )

  return (
    <div className="min-h-screen bg-[var(--bg-muted)]">
      {/* ── TOP BAR ── */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="container-page max-w-5xl flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSideMenuOpen(true)}
              className="p-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
              aria-label="Открыть меню"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <Link href="/home" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Miss Kurochka" width={36} height={36} className="rounded-lg" />
              <span className="text-sm font-extrabold text-[var(--brand)] hidden sm:block">Miss Kurochka</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => router.push('/cart')}
              className="relative p-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
              aria-label="Корзина"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--brand)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[var(--bg-muted)] transition"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-sm font-bold">
                  {initials}
                </div>
              )}
              <span className="text-xs font-bold hidden sm:block max-w-[100px] truncate">{user.fullName}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page max-w-5xl py-6 space-y-8">

        {/* ── GREETING ── */}
        <section className="surface p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--fg-subtle)] font-semibold mb-0.5">Добро пожаловать 👋</p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{user.fullName}</h1>
            <p className="text-sm text-[var(--fg-muted)] mt-0.5">{user.email}</p>
          </div>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-3xl font-extrabold shrink-0">
              {initials}
            </div>
          )}
        </section>

        {/* ── ACTIVE ORDERS ── */}
        {activeOrders.length > 0 && (
          <section>
            <SectionHeader title="Активные заказы" icon={<Truck className="w-4 h-4" />} href="/orders" />
            <div className="space-y-3">
              {activeOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="card card-hover p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                        {STATUS_ICON[order.status]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">Заказ #{order.orderNumber}</p>
                        <p className="text-xs text-[var(--fg-muted)] truncate">{order.branch?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge'}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      <span className="text-sm font-extrabold text-[var(--brand)]">{order.totalAmount} сом</span>
                      <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CART BANNER убран отсюда — теперь floating внизу экрана ── */}

        {/* ── COMBOS ── */}
        {combos.length > 0 && (
          <section>
            <SectionHeader title="Комбо-наборы" icon={<Flame className="w-4 h-4" />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {combos.map(combo => (
                <div key={combo.id} className="card card-hover overflow-hidden flex">
                  <div className="w-28 sm:w-36 shrink-0 bg-[var(--bg-muted)]">
                    {combo.imageUrl ? (
                      <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍗</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-extrabold leading-tight">{combo.name}</h3>
                      <span className="badge badge-brand shrink-0">
                        <Flame className="w-3 h-3" />
                        Выгодно
                      </span>
                    </div>
                    {combo.items && Array.isArray(combo.items) && (
                      <ul className="space-y-0.5 mb-3 flex-1">
                        {combo.items.slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-[var(--brand)] rounded-full shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        {combo.oldPrice && (
                          <p className="text-[10px] text-[var(--fg-subtle)] line-through">{combo.oldPrice} сом</p>
                        )}
                        <p className="text-base font-extrabold text-[var(--brand)]">{combo.price} сом</p>
                      </div>
                      <button
                        onClick={() => addToCart(combo.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                        aria-label="Добавить"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── POPULAR ITEMS ── */}
        {popularItems.length > 0 && (
          <section>
            <SectionHeader title="Популярное" icon={<Star className="w-4 h-4" />} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {popularItems.map((item, idx) => (
                <article
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="card card-hover overflow-hidden flex flex-col cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-[var(--bg-muted)]">
                    {item.images?.[0]?.imageUrl ? (
                      <img
                        src={item.images[0].imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍗</div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {item.isNew && <span className="badge badge-success text-[10px]">Новинка</span>}
                      {item.isFeatured && <span className="badge badge-brand text-[10px]">Хит</span>}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-xs sm:text-sm font-extrabold leading-tight mb-1 line-clamp-2">{item.name}</h3>
                    <div className="mt-auto flex items-center justify-between gap-1">
                      <span className="text-sm font-extrabold">
                        {item.price} <span className="text-[10px] font-bold text-[var(--fg-muted)]">сом</span>
                      </span>
                      {cartItems[item.id] ? (
                        <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-lg p-0.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => { e.stopPropagation(); updateCartItem(item.id, cartItems[item.id].quantity - 1) }}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/15 rounded-md transition"
                            aria-label="Уменьшить"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs text-white min-w-[16px] text-center">
                            {cartItems[item.id].quantity}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); updateCartItem(item.id, cartItems[item.id].quantity + 1) }}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/15 rounded-md transition"
                            aria-label="Увеличить"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); handleItemClick(item) }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                          aria-label="Добавить"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── RECENT ORDERS ── */}
        {recentOrders.length > 0 && (
          <section>
            <SectionHeader title="Последние заказы" icon={<Package className="w-4 h-4" />} href="/orders" />
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="card card-hover p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-bold">Заказ #{order.orderNumber}</p>
                        <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge'}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--fg-subtle)]">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      <div className="flex -space-x-1.5 mt-2">
                        {order.items?.slice(0, 4).map((item: any) => (
                          <div key={item.id} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-[var(--bg-muted)]">
                            {item.menuItem?.images?.[0]?.imageUrl ? (
                              <img src={item.menuItem.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">🍗</div>
                            )}
                          </div>
                        ))}
                        {order.items?.length > 4 && (
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[var(--fg-muted)]">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-[var(--brand)]">{order.totalAmount} сом</p>
                      <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)] ml-auto mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SIGN OUT ── */}
        <section className="pb-4">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn btn-secondary w-full"
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </button>
        </section>
      </main>

      {/* Modals */}
      <MenuItemModal
        item={selectedMenuItem}
        isOpen={showItemModal}
        onClose={() => { setShowItemModal(false); setSelectedMenuItem(null) }}
        onAddToCart={addToCart}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />
    </div>
  )
}

// ── helpers ──

function SectionHeader({
  title,
  icon,
  href,
}: {
  title: string
  icon: React.ReactNode
  href?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)] flex items-center gap-0.5"
        >
          Все <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}

