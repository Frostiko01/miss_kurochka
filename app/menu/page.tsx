'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, ShoppingBag, Plus, Minus, X } from 'lucide-react'
import MobileMenuScreen from '@/components/mobile/MobileMenuScreen'
import MenuItemModal from '@/components/MenuItemModal'
import AuthModal from '@/components/AuthModal'
import Spinner from '@/components/Spinner'

interface MenuItem {
  id: string
  name: string
  description?: string | null
  images?: { imageUrl: string; isPrimary?: boolean }[]
  sizes?: { id: string; price: number; weightGrams?: number | null }[]
  modifiers?: unknown[]
  spices?: unknown[]
  isNew?: boolean
  isFeatured?: boolean
  isVegetarian?: boolean
  spicyLevel?: number
}

interface Category {
  id: string
  name: string
  imageUrl?: string | null
  menuItems: MenuItem[]
}

interface CartItem {
  quantity: number
  cartItemId: string
}

export default function MenuPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({})
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Загрузка меню
  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => {
        const grouped = data.grouped as Record<string, Category[]> | undefined
        if (grouped) {
          const allCats: Category[] = [
            ...(grouped.regular ?? []),
            ...(grouped.mini_combo ?? []),
          ].filter((c) => c.menuItems && c.menuItems.length > 0)
          setCategories(allCats)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Загрузка корзины
  useEffect(() => {
    if (!session) {
      setCartItems({})
      return
    }
    fetch('/api/cart')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cart?.items) {
          const map: Record<string, CartItem> = {}
          data.cart.items.forEach((item: { id: string; quantity: number; menuItem?: { id: string } }) => {
            if (item.menuItem) {
              map[item.menuItem.id] = { quantity: item.quantity, cartItemId: item.id }
            }
          })
          setCartItems(map)
        }
      })
      .catch(() => {})
  }, [session])

  const handleItemClick = (item: MenuItem) => {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    const hasOptions = (item.modifiers && item.modifiers.length > 0) ||
                      (item.spices && item.spices.length > 0) ||
                      (item.sizes && item.sizes.length > 1)
    if (hasOptions) {
      setSelectedItem(item)
      setShowItemModal(true)
    } else {
      addToCart(item.id)
    }
  }

  const addToCart = async (menuItemId: string, modifiers?: string[], sizeId?: string | null, spices?: string[]) => {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          quantity: 1,
          modifiers: modifiers || [],
          spices: spices || [],
          sizeId: sizeId ?? null,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        syncCart(data.cart)
      }
    } catch {}
  }

  const syncCart = (cart: { items?: { id: string; quantity: number; menuItem?: { id: string } }[] }) => {
    const map: Record<string, CartItem> = {}
    cart?.items?.forEach((item) => {
      if (item.menuItem) {
        map[item.menuItem.id] = { quantity: item.quantity, cartItemId: item.id }
      }
    })
    setCartItems(map)
  }

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!session) return
    try {
      if (newQuantity === 0) {
        const response = await fetch(`/api/cart/items?id=${cartItemId}`, { method: 'DELETE' })
        if (response.ok) {
          const data = await response.json()
          syncCart(data.cart)
        }
      } else {
        const response = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        })
        if (response.ok) {
          const data = await response.json()
          syncCart(data.cart)
        }
      }
    } catch {}
  }

  const filteredCategories = categories.map(cat => ({
    ...cat,
    menuItems: cat.menuItems.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.menuItems.length > 0)

  const allItems = filteredCategories.flatMap(cat => cat.menuItems)
  const displayCategories = activeCategory === 'all'
    ? filteredCategories
    : filteredCategories.filter(cat => cat.id === activeCategory)

  const cartCount = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileMenuScreen />
      </div>

      {/* Desktop */}
      <div className="hidden md:block min-h-screen bg-[var(--bg-muted)]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-[var(--border)] shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black">Меню</h1>
                <p className="text-sm text-[var(--fg-muted)]">
                  {allItems.length} {allItems.length === 1 ? 'блюдо' : 'блюд'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-subtle)]" />
                  <input
                    type="text"
                    placeholder="Поиск блюд..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-10 pr-10 w-64"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Cart Button */}
                <button
                  onClick={() => router.push('/cart')}
                  className="btn btn-primary relative"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Корзина
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--brand-dark)] text-white text-xs font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" />
              <p className="text-sm text-[var(--fg-muted)] mt-4">Загрузка меню...</p>
            </div>
          ) : (
            <div className="flex gap-8">
              {/* Sidebar - Categories */}
              <aside className="w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <h2 className="text-sm font-bold text-[var(--fg-muted)] uppercase mb-3">Категории</h2>
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                        activeCategory === 'all'
                          ? 'bg-[var(--brand)] text-white'
                          : 'text-[var(--fg)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      Все блюда
                      <span className="float-right text-xs opacity-70">{allItems.length}</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                          activeCategory === cat.id
                            ? 'bg-[var(--brand)] text-white'
                            : 'text-[var(--fg)] hover:bg-[var(--bg-muted)]'
                        }`}
                      >
                        {cat.name}
                        <span className="float-right text-xs opacity-70">{cat.menuItems.length}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main - Menu Items */}
              <main className="flex-1">
                {displayCategories.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-lg font-semibold text-[var(--fg-muted)]">
                      {search ? 'Ничего не найдено' : 'Меню пусто'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {displayCategories.map((cat) => (
                      <section key={cat.id}>
                        <h2 className="text-2xl font-black mb-6">{cat.name}</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                          {cat.menuItems.map((item) => {
                            const primaryImage = item.images?.find(img => img.isPrimary) || item.images?.[0]
                            const price = item.sizes?.[0]?.price ?? 0
                            const inCart = cartItems[item.id]

                            return (
                              <article
                                key={item.id}
                                className="card card-hover cursor-pointer"
                                onClick={() => handleItemClick(item)}
                              >
                                {/* Image */}
                                <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-[var(--bg-muted)]">
                                  {primaryImage ? (
                                    <img
                                      src={primaryImage.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl">🍗</div>
                                  )}

                                  {/* Badges */}
                                  <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                                    {item.isNew && (
                                      <span className="badge badge-success text-xs">Новинка</span>
                                    )}
                                    {item.isFeatured && !item.isNew && (
                                      <span className="badge badge-brand text-xs">Хит</span>
                                    )}
                                  </div>

                                  {item.spicyLevel && item.spicyLevel > 0 && (
                                    <div className="absolute top-3 left-3 bg-white rounded-full px-2 py-1 text-xs">
                                      {'🌶️'.repeat(item.spicyLevel)}
                                    </div>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                  <h3 className="text-base font-bold mb-1 line-clamp-1">{item.name}</h3>
                                  {item.description && (
                                    <p className="text-xs text-[var(--fg-muted)] mb-3 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}

                                  {item.isVegetarian && (
                                    <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full mb-3">
                                      🌱 Вегетарианское
                                    </span>
                                  )}

                                  <div className="flex items-center justify-between mt-auto">
                                    <span className="text-xl font-black">{price} сом</span>
                                    {inCart ? (
                                      <div className="flex items-center gap-1 bg-[var(--brand)] rounded-full p-0.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            updateQuantity(inCart.cartItemId, inCart.quantity - 1)
                                          }}
                                          className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/15 rounded-full"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="font-bold text-sm text-white min-w-[20px] text-center">
                                          {inCart.quantity}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            updateQuantity(inCart.cartItemId, inCart.quantity + 1)
                                          }}
                                          className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/15 rounded-full"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleItemClick(item)
                                        }}
                                        className="btn btn-primary btn-sm"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </main>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false)
            setSelectedItem(null)
          }}
          onAddToCart={(menuItemId, modifiers, quantity, sizeId, spices) => {
            addToCart(menuItemId, modifiers, sizeId, spices)
            setShowItemModal(false)
            setSelectedItem(null)
          }}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}
