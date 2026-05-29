'use client'

import { useState, useEffect } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useFavorites } from '@/hooks/useFavorites'
import AuthModal from '@/components/AuthModal'
import Link from 'next/link'
import MobileSubScreen from '@/components/mobile/MobileSubScreen'
import ProductCard, { ProductCardItem } from '@/components/mobile/ProductCard'
import MenuItemModal from '@/components/MenuItemModal'

interface CartApiItem {
  id: string
  quantity: number
  sizeId?: string | null
  menuItem?: { id: string } | null
}

interface CartApiCart {
  items?: CartApiItem[]
}

export default function FavoritesPage() {
  const { data: session } = useSession()
  const { ids: favorites, mounted, isFavorite, toggle: toggleFavorite } = useFavorites()

  const [items, setItems] = useState<ProductCardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [cartItems, setCartItems] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  const [selectedItem, setSelectedItem] = useState<ProductCardItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Загружаем блюда по ID из localStorage
  useEffect(() => {
    if (!mounted) return
    // Читаем напрямую из localStorage — хук может ещё не успеть прочитать
    let currentIds: string[] = []
    try {
      const stored = localStorage.getItem('favorites')
      currentIds = stored ? JSON.parse(stored) : []
    } catch {
      currentIds = favorites
    }

    if (currentIds.length === 0) {
      Promise.resolve().then(() => setItems([]))
      return
    }
    let cancelled = false
    Promise.resolve().then(() => setLoading(true))
    fetch(`/api/menu/by-ids?ids=${currentIds.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.items) setItems(data.items as ProductCardItem[])
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mounted, favorites])

  // Синхронизируем корзину
  const syncCart = (cart: CartApiCart | null | undefined) => {
    const map: Record<string, { quantity: number; cartItemId: string }> = {}
    cart?.items?.forEach((ci) => {
      if (ci.menuItem) {
        map[ci.menuItem.id] = { quantity: ci.quantity, cartItemId: ci.id }
      }
    })
    setCartItems(map)
  }

  useEffect(() => {
    if (!session) {
      Promise.resolve().then(() => setCartItems({}))
      return
    }
    let cancelled = false
    fetch('/api/cart')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data?.cart) syncCart(data.cart) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session])

  const handleItemClick = (item: ProductCardItem) => {
    if (!session) { setShowAuthModal(true); return }
    const hasModifiers = ((item as unknown as { modifiers?: unknown[] }).modifiers?.length ?? 0) > 0
    const hasSpices = ((item as unknown as { spices?: unknown[] }).spices?.length ?? 0) > 0
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
    if (!session) { setShowAuthModal(true); return }
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
      if (r.ok) { const data = await r.json(); syncCart(data.cart) }
    } catch {}
  }

  const updateQty = async (cartItemId: string, qty: number) => {
    try {
      if (qty <= 0) {
        const r = await fetch(`/api/cart/items?id=${cartItemId}`, { method: 'DELETE' })
        if (r.ok) { const data = await r.json(); syncCart(data.cart) }
      } else {
        const r = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: qty }),
        })
        if (r.ok) { const data = await r.json(); syncCart(data.cart) }
      }
    } catch {}
  }

  const isEmpty = !loading && mounted && favorites.length === 0
  const allRemoved = !loading && mounted && favorites.length > 0 && items.length === 0

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mb-5">
        <Heart className="w-9 h-9 text-[var(--fg-subtle)]" />
      </div>
      <h2 className="text-xl font-extrabold mb-2">Пока пусто</h2>
      <p className="text-[var(--fg-muted)] text-sm max-w-xs mb-6">
        Нажмите на сердечко на карточке блюда, чтобы добавить его в избранное
      </p>
      <Link href="/menu" className="btn btn-primary">
        <ShoppingBag className="w-4 h-4" />
        Перейти в меню
      </Link>
    </div>
  )

  const renderSkeleton = () => (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: favorites.length || 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-[var(--bg-muted)] animate-pulse" style={{ aspectRatio: '3/4' }} />
      ))}
    </div>
  )

  const renderGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          cartQuantity={cartItems[item.id]?.quantity ?? 0}
          isFavorite={isFavorite(item.id)}
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
          onToggleFavorite={() => toggleFavorite(item.id)}
        />
      ))}
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <MobileSubScreen
        title="Избранное"
        subtitle={
          favorites.length > 0
            ? `${favorites.length} ${favorites.length === 1 ? 'блюдо' : favorites.length < 5 ? 'блюда' : 'блюд'}`
            : undefined
        }
      >
        <div className="px-3 pt-3">
          {isEmpty || allRemoved
            ? renderEmpty()
            : (loading || !mounted) && favorites.length > 0
            ? renderSkeleton()
            : renderGrid()}
        </div>
      </MobileSubScreen>

      {/* Desktop */}
      <div className="hidden md:block min-h-screen bg-[var(--bg)]">
        <div className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
          <div className="container-page py-4 flex items-center gap-3">
            <Heart className="w-5 h-5 text-[var(--brand)]" />
            <h1 className="text-xl font-extrabold tracking-tight">Избранное</h1>
            {favorites.length > 0 && (
              <span className="ml-auto text-sm text-[var(--fg-muted)] font-semibold">
                {favorites.length}{' '}
                {favorites.length === 1 ? 'блюдо' : favorites.length < 5 ? 'блюда' : 'блюд'}
              </span>
            )}
          </div>
        </div>
        <div className="container-page py-8">
          {isEmpty || allRemoved
            ? renderEmpty()
            : (loading || !mounted) && favorites.length > 0
            ? renderSkeleton()
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    cartQuantity={cartItems[item.id]?.quantity ?? 0}
                    isFavorite={isFavorite(item.id)}
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
                    onToggleFavorite={() => toggleFavorite(item.id)}
                  />
                ))}
              </div>
            )}
        </div>
      </div>

      {showAuthModal && <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />}

      <MenuItemModal
        item={selectedItem as unknown}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedItem(null) }}
        onAddToCart={addToCart}
      />
    </>
  )
}
