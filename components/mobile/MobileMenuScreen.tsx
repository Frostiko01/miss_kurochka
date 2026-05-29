'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, X, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import MobileSubScreen from './MobileSubScreen'
import ProductCard, { ProductCardItem } from './ProductCard'
import MenuItemModal from '@/components/MenuItemModal'
import AuthModal from '@/components/AuthModal'

interface Category {
  id: string
  name: string
  imageUrl?: string | null
  type?: string
  menuItems: ProductCardItem[]
}

interface CartApiItem {
  id: string
  quantity: number
  menuItem?: { id: string } | null
  comboOffer?: { id: string } | null
  sizeId?: string | null
}

interface CartApiResponse {
  cart?: { items?: CartApiItem[] }
}

export default function MobileMenuScreen() {
  const router = useRouter()
  const { data: session } = useSession()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const [cartItems, setCartItems] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  const [selectedItem, setSelectedItem] = useState<ProductCardItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const tabsRef = useRef<HTMLDivElement>(null)

  // Загрузка меню
  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => {
        // API возвращает два формата:
        // data.categories[].menuItems — пустые (только метаданные категорий)
        // data.grouped.regular[].items — реальные блюда
        // Используем grouped, нормализуем в единый формат { id, name, imageUrl, menuItems }
        const grouped = data.grouped as Record<string, Array<{
          id: string
          name: string
          imageUrl?: string | null
          type?: string
          items?: ProductCardItem[]
          menuItems?: ProductCardItem[]
        }>> | undefined

        if (grouped) {
          const allCats: Category[] = [
            ...(grouped.regular ?? []),
            ...(grouped.mini_combo ?? []),
          ]
            .map((c) => ({
              id: c.id,
              name: c.name,
              imageUrl: c.imageUrl ?? null,
              type: c.type,
              // API кладёт блюда в .items, нормализуем в .menuItems
              menuItems: (c.items ?? c.menuItems ?? []) as ProductCardItem[],
            }))
            .filter((c) => c.menuItems.length > 0)
          setCategories(allCats)
        } else {
          // Фоллбэк на старый формат
          const cats = (data.categories ?? []).filter(
            (c: Category) => c.menuItems && c.menuItems.length > 0,
          )
          setCategories(cats)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const syncCart = (cart: CartApiResponse['cart']) => {
    const map: Record<string, { quantity: number; cartItemId: string }> = {}
    let total = 0
    cart?.items?.forEach((it) => {
      if (it.menuItem) {
        map[it.menuItem.id] = { quantity: it.quantity, cartItemId: it.id }
      }
      total += it.quantity ?? 0
    })
    setCartItems(map)
    setCartCount(total)
  }

  // Корзина
  useEffect(() => {
    if (!session) return
    fetch('/api/cart')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CartApiResponse | null) => {
        if (!data?.cart) return
        syncCart(data.cart)
      })
      .catch(() => {})
  }, [session])

  // Фильтрация по поиску
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.trim().toLowerCase()
    return categories
      .map((c) => ({
        ...c,
        menuItems: c.menuItems.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.menuItems.length > 0)
  }, [categories, search])

  // Скролл к категории
  const scrollToCategory = (id: string) => {
    setActiveId(id)
    const el = sectionRefs.current[id]
    if (!el) return
    const headerOffset = 168
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  // Подсветка активной категории при скролле
  useEffect(() => {
    if (search.trim()) return
    const onScroll = () => {
      const ids = filteredCategories.map((c) => c.id)
      let current = ids[0]
      for (const id of ids) {
        const el = sectionRefs.current[id]
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top < 200) current = id
        else break
      }
      if (current && current !== activeId) {
        setActiveId(current)
        // прокрутить таб к видимой области
        const tab = tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${current}"]`)
        if (tab && tabsRef.current) {
          const left = tab.offsetLeft - tabsRef.current.clientWidth / 2 + tab.clientWidth / 2
          tabsRef.current.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [filteredCategories, activeId, search])

  const handleItemClick = (item: ProductCardItem) => {
    if (!session) {
      setAuthOpen(true)
      return
    }
    const hasModifiers =
      ((item as unknown as { modifiers?: unknown[] }).modifiers?.length ?? 0) > 0
    const hasSpices =
      ((item as unknown as { spices?: unknown[] }).spices?.length ?? 0) > 0
    const hasSizes = item.sizes && item.sizes.length > 1
    if (hasModifiers || hasSpices || hasSizes) {
      setSelectedItem(item)
      setModalOpen(true)
    } else {
      addToCart(item.id)
    }
  }

  const addToCart = async (
    menuItemId?: string,
    modifiers?: string[],
    quantity?: number,
    sizeId?: string | null,
    spices?: string[],
  ) => {
    if (!session) {
      setAuthOpen(true)
      return
    }
    if (!menuItemId) return
    try {
      const r = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          quantity: quantity || 1,
          modifiers: modifiers || [],
          spices: spices || [],
          sizeId: sizeId ?? null,
        }),
      })
      if (r.ok) {
        const data = await r.json()
        syncCart(data.cart)
      }
    } catch {}
  }

  const updateQty = async (cartItemId: string, qty: number) => {
    try {
      if (qty <= 0) {
        const r = await fetch(`/api/cart/items?id=${cartItemId}`, { method: 'DELETE' })
        if (r.ok) {
          const data = await r.json()
          syncCart(data.cart)
        }
      } else {
        const r = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: qty }),
        })
        if (r.ok) {
          const data = await r.json()
          syncCart(data.cart)
        }
      }
    } catch {}
  }

  const totalAmount = useMemo(() => {
    // приближённая сумма по minPrice * qty
    let sum = 0
    Object.entries(cartItems).forEach(([itemId, ref]) => {
      const item = categories.flatMap((c) => c.menuItems).find((i) => i.id === itemId)
      if (item) {
        const price =
          item.sizes?.[0]?.price ??
          (item as unknown as { price?: number }).price ??
          0
        sum += Number(price) * ref.quantity
      }
    })
    return sum
  }, [cartItems, categories])

  return (
    <MobileSubScreen
      title="Меню"
      back={false}
      onAuthClick={() => setAuthOpen(true)}
      noBottomSpace
    >
      {/* Search bar */}
      <div className="px-4 pt-2 pb-2 sticky top-[56px] z-30 bg-white">
        <div
          className="flex items-center gap-2 h-11 px-4 rounded-2xl"
          style={{ background: 'var(--bg-muted)' }}
        >
          <Search className="w-4 h-4 text-[var(--fg-subtle)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Поиск по меню..."
            className="flex-1 bg-transparent text-sm font-semibold placeholder-[var(--fg-subtle)] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--border)] active:scale-90 transition-transform"
              aria-label="Очистить"
            >
              <X className="w-3 h-3 text-[var(--fg)]" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Sticky category tabs */}
      {!search.trim() && filteredCategories.length > 0 && (
        <div
          className="sticky z-30"
          style={{
            top: 110,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div ref={tabsRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5">
            {filteredCategories.map((c) => {
              const active = activeId === c.id
              return (
                <button
                  key={c.id}
                  data-tab={c.id}
                  onClick={() => scrollToCategory(c.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: active ? 'var(--brand)' : 'var(--bg-muted)',
                    color: active ? '#fff' : 'var(--fg-muted)',
                    boxShadow: active ? '0 6px 14px rgba(214,35,0,0.25)' : 'none',
                  }}
                >
                  {c.imageUrl && (
                    <img src={c.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  <span className="whitespace-nowrap">{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="flex flex-col gap-6 px-3 pt-4"
        style={{
          paddingBottom: cartCount > 0
            ? 'calc(env(safe-area-inset-bottom, 0) + 160px)'
            : 'calc(env(safe-area-inset-bottom, 0) + 100px)',
        }}
      >
        {loading ? (
          <SkeletonGrid />
        ) : filteredCategories.length === 0 ? (
          <EmptyState search={search} onClear={() => setSearch('')} />
        ) : (
          filteredCategories.map((cat) => (
            <section
              key={cat.id}
              ref={(el) => {
                sectionRefs.current[cat.id] = el
              }}
            >
              <h2 className="text-lg font-extrabold tracking-tight px-1 mb-2.5">{cat.name}</h2>
              <div className="grid grid-cols-2 gap-3">
                {cat.menuItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    cartQuantity={cartItems[item.id]?.quantity ?? 0}
                    onClick={() => handleItemClick(item)}
                    onAdd={() => handleItemClick(item)}
                    onIncrease={() => {
                      const ref = cartItems[item.id]
                      if (ref) updateQty(ref.cartItemId, ref.quantity + 1)
                    }}
                    onDecrease={() => {
                      const ref = cartItems[item.id]
                      if (ref) updateQty(ref.cartItemId, ref.quantity - 1)
                    }}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <button
          onClick={() => router.push('/cart')}
          className="fixed left-4 right-4 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow-lg active:scale-[0.98] transition-transform"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0) + 76px)',
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow: '0 12px 32px rgba(214,35,0,0.28)',
          }}
        >
          <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-[18px] h-[18px]" />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-85">
              В корзине {cartCount} {cartCount === 1 ? 'товар' : 'товаров'}
            </span>
            <span className="block text-sm font-extrabold">Оформить · {totalAmount} сом</span>
          </span>
          <span className="text-base font-extrabold">→</span>
        </button>
      )}

      {/* Modals */}
      <MenuItemModal
        item={selectedItem as unknown}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedItem(null)
        }}
        onAddToCart={addToCart}
      />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </MobileSubScreen>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden">
          <div className="aspect-square skeleton" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 skeleton" />
            <div className="h-2.5 w-1/2 skeleton" />
            <div className="h-3 w-1/3 skeleton mt-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ search, onClear }: { search: string; onClear: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center mb-3">
        <UtensilsCrossed className="w-7 h-7 text-[var(--fg-subtle)]" />
      </div>
      <h3 className="text-base font-extrabold mb-1">
        {search ? 'Ничего не найдено' : 'Меню пустое'}
      </h3>
      <p className="text-sm text-[var(--fg-muted)] mb-4">
        {search ? `По запросу "${search}" нет блюд` : 'Скоро здесь появятся блюда'}
      </p>
      {search && (
        <button onClick={onClear} className="btn btn-secondary inline-flex">
          Очистить поиск
        </button>
      )}
    </div>
  )
}
