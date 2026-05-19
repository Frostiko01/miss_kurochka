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
  X,
  Heart,
} from 'lucide-react'
import MenuItemDetailModal from '@/components/MenuItemDetailModal'
import AuthModal from '@/components/AuthModal'
import MenuCard from '@/components/MenuCard'
import MenuItemCard from '@/components/MenuItemCard'
import SideMenu from '@/components/SideMenu'
import { useFavorites } from '@/hooks/useFavorites'

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
  const [allMenuItems, setAllMenuItems] = useState<any[]>([])
  const [menuCategories, setMenuCategories] = useState<any[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')
  const [combos, setCombos] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartItems, setCartItems] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  // Cart indexed by `${menuItemId}__${optionId}` for size variants
  const [cartByOption, setCartByOption] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  // Комбо в корзине: comboOfferId → { quantity, cartItemId }
  const [comboCartItems, setComboCartItems] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  // Новая схема: sizeId → { quantity, cartItemId }
  const [cartBySizeId, setCartBySizeId] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sideMenuOpen, setSideMenuOpen] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState<any>(null)
  const { toggle: toggleFavorite, isFavorite, mounted: favMounted } = useFavorites()

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
        // Все категории с блюдами
        const cats = [
          ...(data.grouped?.regular ?? []),
          ...(data.grouped?.combo ?? []),
          ...(data.grouped?.mini_combo ?? []),
        ].filter((cat: any) => cat.items && cat.items.length > 0)
        setMenuCategories(cats)

        // Все блюда
        const all = cats.flatMap((cat: any) => cat.items ?? [])
        setAllMenuItems(all)

        // Популярные (isFeatured) — до 8
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
          if (i.comboOffer) {
            return s + Number(i.comboOffer.price) * i.quantity
          }
          if (!i.menuItem) return s
          let t = Number(i.menuItem.price ?? 0) * i.quantity
          i.modifiers?.forEach((m: any) => { t += Number(m.modifierOption.priceDelta) * i.quantity })
          return s + t
        }, 0)
        setCartTotal(total)
        const map: Record<string, { quantity: number; cartItemId: string }> = {}
        const optMap: Record<string, { quantity: number; cartItemId: string }> = {}
        const comboMap: Record<string, { quantity: number; cartItemId: string }> = {}
        const sizeMap: Record<string, { quantity: number; cartItemId: string }> = {}
        data.cart.items.forEach((i: any) => {
          // Комбо-позиции
          if (i.comboOffer) {
            comboMap[i.comboOffer.id] = { quantity: i.quantity, cartItemId: i.id }
            return
          }
          // Обычные блюда
          if (!i.menuItem) return
          if (!map[i.menuItem.id]) {
            map[i.menuItem.id] = { quantity: i.quantity, cartItemId: i.id }
          }
          // Новая схема: sizeId → CartRef
          if (i.sizeId) {
            sizeMap[i.sizeId] = { quantity: i.quantity, cartItemId: i.id }
          }
          // Старая схема: optionId для блюд с размерами через modifiers
          i.modifiers?.forEach((m: any) => {
            const key = `${i.menuItem.id}__${m.modifierOption.id}`
            optMap[key] = { quantity: i.quantity, cartItemId: i.id }
          })
        })
        setCartItems(map)
        setCartByOption(optMap)
        setComboCartItems(comboMap)
        setCartBySizeId(sizeMap)
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

  // Новая функция: добавить блюдо с размером и специями
  const addToCartWithSize = async (menuItemId: string, sizeId: string | null, spiceIds: string[]) => {
    if (!session) { setShowAuthModal(true); return }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          sizeId: sizeId ?? undefined,
          quantity: 1,
          modifiers: spiceIds,
        }),
      })
      if (res.ok) fetchCart()
    } catch (e) {
      console.error(e)
    }
  }

  const addComboToCart = async (comboOfferId: string) => {
    if (!session) { setShowAuthModal(true); return }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comboOfferId, quantity: 1 }),
      })
      if (res.ok) {
        fetchCart()
        setSelectedCombo(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const updateCartItem = async (menuItemId: string, newQuantity: number) => {
    const cartItem = cartItems[menuItemId]
    if (!cartItem) return
    await updateCartItemById(cartItem.cartItemId, newQuantity)
  }

  const updateCartItemById = async (cartItemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        const res = await fetch(`/api/cart/items?id=${cartItemId}`, { method: 'DELETE' })
        if (res.ok) fetchCart()
      } else {
        const res = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        })
        if (res.ok) fetchCart()
      }
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * Возвращает первую обязательную single-группу модификаторов («Размер»).
   * Если она есть и в ней >= 2 опций — блюдо считается мультиразмерным.
   */
  const getSizeGroup = (item: any) => {
    if (!item?.modifiers) return null
    const sizeMod = item.modifiers.find(
      (m: any) =>
        m?.group?.isRequired &&
        m?.group?.selectionType === 'single' &&
        Array.isArray(m?.group?.options) &&
        m.group.options.length >= 2
    )
    return sizeMod ?? null
  }

  const addSize = async (menuItemId: string, optionId: string) => {
    if (!session) { setShowAuthModal(true); return }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, quantity: 1, modifiers: [optionId] }),
      })
      if (res.ok) fetchCart()
    } catch (e) {
      console.error(e)
    }
  }

  const handleItemClick = (item: any) => {
    setDetailItem(item)
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
                <div key={combo.id} className="card card-hover overflow-hidden flex relative">
                  {/* Сердечко */}
                  {favMounted && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(`combo_${combo.id}`) }}
                      className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition hover:scale-110"
                      aria-label={isFavorite(`combo_${combo.id}`) ? 'Убрать из избранного' : 'В избранное'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition ${
                          isFavorite(`combo_${combo.id}`)
                            ? 'fill-[var(--brand)] text-[var(--brand)]'
                            : 'text-[var(--fg-muted)]'
                        }`}
                      />
                    </button>
                  )}

                  <div className="w-28 sm:w-36 shrink-0 bg-[var(--bg-muted)]">
                    {combo.imageUrl ? (
                      <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍗</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 pr-6">
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
                      {(() => {
                        const cartRef = comboCartItems[combo.id]
                        const qty = cartRef?.quantity ?? 0
                        return qty > 0 ? (
                          <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
                            <button
                              onClick={e => { e.stopPropagation(); updateCartItemById(cartRef.cartItemId, qty - 1) }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                              aria-label="Уменьшить"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs text-white min-w-[16px] text-center">{qty}</span>
                            <button
                              onClick={e => { e.stopPropagation(); addComboToCart(combo.id) }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                              aria-label="Увеличить"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addComboToCart(combo.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                            aria-label="Добавить в корзину"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── POPULAR ITEMS ── */}
        {(popularItems.length > 0 || menuCategories.length > 0) && (
          <section>
            <SectionHeader title="Меню" icon={<Star className="w-4 h-4" />} />

            {/* Категории-таблетки */}
            {menuCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-1 px-1">
                <button
                  onClick={() => setActiveCategoryId('all')}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    activeCategoryId === 'all'
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'bg-white text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                  }`}
                >
                  Все
                </button>
                {menuCategories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                      activeCategoryId === cat.id
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                        : 'bg-white text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                    }`}
                  >
                    {cat.imageUrl && (
                      <img src={cat.imageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Блюда */}
            {(() => {
              const displayItems = activeCategoryId === 'all'
                ? popularItems
                : (menuCategories.find((c: any) => c.id === activeCategoryId)?.items ?? [])

              return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {displayItems.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <MenuItemCard
                    item={item}
                    cartBySizeId={cartBySizeId}
                    cartByItemId={cartItems}
                    onAddToCart={addToCartWithSize}
                    onUpdateCart={updateCartItemById}
                  />
                </div>
              ))}
            </div>
              )
            })()}
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
                        {order.items?.slice(0, 4).map((item: any) => {
                          const img = item.menuItem?.images?.[0]?.imageUrl ?? item.comboOffer?.imageUrl ?? null
                          return (
                            <div key={item.id} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-[var(--bg-muted)]">
                              {img ? (
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm">🍗</div>
                              )}
                            </div>
                          )
                        })}
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
      <MenuItemDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        // Для обычных блюд
        cartItem={detailItem && !getSizeGroup(detailItem) ? (cartItems[detailItem.id] ? { id: cartItems[detailItem.id].cartItemId, quantity: cartItems[detailItem.id].quantity } : null) : null}
        onAdd={(id) => addToCart(id)}
        onUpdate={(cartItemId, qty) => updateCartItemById(cartItemId, qty)}
        // Для блюд с размерами
        sizeGroup={detailItem ? getSizeGroup(detailItem) : null}
        cartByOption={detailItem ? (() => {
          const sg = getSizeGroup(detailItem)
          if (!sg) return {}
          const optMap: Record<string, { id: string; quantity: number; cartItemId: string }> = {}
          sg.group.options.forEach((opt: any) => {
            const key = `${detailItem.id}__${opt.id}`
            const ref = cartByOption[key]
            if (ref) optMap[opt.id] = { id: ref.cartItemId, quantity: ref.quantity, cartItemId: ref.cartItemId }
          })
          return optMap
        })() : {}}
        onAddSize={addSize}
        onUpdateSize={updateCartItemById}
        // Избранное
        showFavorite={favMounted}
        isFavorite={detailItem ? isFavorite(detailItem.id) : false}
        onToggleFavorite={() => detailItem && toggleFavorite(detailItem.id)}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SideMenu
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        onAddToCart={(id) => addToCart(id)}
      />

      {/* ── COMBO MODAL ── */}
      {selectedCombo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedCombo(null)}
        >
          <div
            className="surface shadow-lg w-full max-w-md animate-scaleIn overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            {selectedCombo.imageUrl && (
              <div className="relative h-48 bg-[var(--bg-muted)]">
                <img
                  src={selectedCombo.imageUrl}
                  alt={selectedCombo.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedCombo(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4 text-[var(--fg)]" />
                </button>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-extrabold tracking-tight">{selectedCombo.name}</h2>
                {!selectedCombo.imageUrl && (
                  <button
                    onClick={() => setSelectedCombo(null)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)]"
                    aria-label="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Состав */}
              {selectedCombo.items && Array.isArray(selectedCombo.items) && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-2">Состав</p>
                  <ul className="space-y-1.5">
                    {selectedCombo.items.map((item: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                        <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Цена */}
              <div className="flex items-baseline gap-2 mb-5">
                {selectedCombo.oldPrice && (
                  <span className="text-sm text-[var(--fg-subtle)] line-through">
                    {Number(selectedCombo.oldPrice)} сом
                  </span>
                )}
                <span className="text-2xl font-extrabold text-[var(--brand)]">
                  {Number(selectedCombo.price)} сом
                </span>
              </div>

              {/* Кнопки */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSelectedCombo(null)}
                  className="btn btn-secondary flex-1"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => addComboToCart(selectedCombo.id)}
                  className="btn btn-primary flex-1"
                >
                  <ShoppingCart className="w-4 h-4" />
                  В корзину
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CART WIDGET ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-5 right-4 z-30">
          <button
            onClick={() => router.push('/cart')}
            className="flex items-center gap-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-2xl px-4 py-2.5 shadow-[var(--shadow-brand)] transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
              {cartCount}
            </div>
            <span className="font-extrabold text-sm">{cartTotal} сом</span>
            <ChevronRight className="w-4 h-4 opacity-80" />
          </button>
        </div>
      )}
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

