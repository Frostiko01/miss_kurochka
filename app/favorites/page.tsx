'use client'

import { useState, useEffect } from 'react'
import { Heart, ShoppingBag, Flame, Plus, Minus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useFavorites } from '@/hooks/useFavorites'
import MenuItemCard from '@/components/MenuItemCard'
import AuthModal from '@/components/AuthModal'
import Link from 'next/link'

// Карточка для комбо-оффера на странице избранного
function ComboFavoriteCard({
  item,
  comboQty,
  onAdd,
  onUpdate,
}: {
  item: any
  comboQty: number
  onAdd: () => void
  onUpdate: (cartItemId: string, qty: number) => void
}) {
  const { isFavorite, toggle } = useFavorites()

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--border)] flex flex-col h-full">
      {/* Фото */}
      <div className="relative overflow-hidden bg-[var(--bg-muted)]" style={{ aspectRatio: '4/3' }}>
        {item.images?.[0]?.imageUrl ? (
          <img
            src={item.images[0].imageUrl}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍗</div>
        )}
        <span className="absolute top-2 left-2 badge badge-brand text-[10px]">
          <Flame className="w-2.5 h-2.5" />
          Комбо
        </span>
        {/* Кнопка избранного */}
        <button
          onClick={() => toggle(item.storageId)}
          aria-label="Убрать из избранного"
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite(item.storageId)
                ? 'fill-[var(--brand)] text-[var(--brand)]'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Контент */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-extrabold leading-tight mb-1 line-clamp-2">{item.name}</h3>

        {item.comboItems?.length > 0 && (
          <ul className="mb-2 space-y-0.5 flex-1">
            {item.comboItems.slice(0, 3).map((name: string, i: number) => (
              <li key={i} className="flex items-center text-[11px] text-[var(--fg-muted)]">
                <span className="w-1 h-1 bg-[var(--brand)] rounded-full mr-1.5 shrink-0" />
                <span className="truncate">{name}</span>
              </li>
            ))}
            {item.comboItems.length > 3 && (
              <li className="text-[11px] text-[var(--brand)] font-semibold">
                +{item.comboItems.length - 3} ещё
              </li>
            )}
          </ul>
        )}

        {/* Цена + кнопка */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
          <div>
            {item.oldPrice && (
              <div className="text-[10px] text-[var(--fg-subtle)] line-through font-semibold">
                {item.oldPrice} сом
              </div>
            )}
            <div className="text-sm font-extrabold text-[var(--fg)]">
              {item.price}{' '}
              <span className="text-[10px] font-bold text-[var(--fg-muted)]">сом</span>
            </div>
          </div>

          {comboQty > 0 ? (
            <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
              <button
                onClick={() => onUpdate('', comboQty - 1)}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                aria-label="Уменьшить"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold text-xs text-white min-w-[16px] text-center">{comboQty}</span>
              <button
                onClick={onAdd}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                aria-label="Увеличить"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
              aria-label="Добавить"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function FavoritesPage() {
  const { data: session } = useSession()
  const { ids: favorites, mounted } = useFavorites()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [cartBySizeId, setCartBySizeId] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  const [cartByItemId, setCartByItemId] = useState<Record<string, { quantity: number; cartItemId: string }>>({})
  const [comboItems, setComboItems] = useState<Record<string, { quantity: number; cartItemId: string }>>({})

  // Загружаем блюда по ID из localStorage (только после монтирования)
  useEffect(() => {
    if (!mounted) return
    if (favorites.length === 0) {
      setItems([])
      return
    }
    setLoading(true)
    fetch(`/api/menu/by-ids?ids=${favorites.join(',')}`)
      .then(r => r.json())
      .then(data => {
        if (data.items) setItems(data.items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [favorites, mounted])

  // Синхронизируем корзину
  const syncCart = (cartData: any) => {
    const bySizeId: Record<string, { quantity: number; cartItemId: string }> = {}
    const byItemId: Record<string, { quantity: number; cartItemId: string }> = {}
    const byComboId: Record<string, { quantity: number; cartItemId: string }> = {}
    cartData?.items?.forEach((ci: any) => {
      if (ci.menuItem) {
        byItemId[ci.menuItem.id] = { quantity: ci.quantity, cartItemId: ci.id }
        if (ci.sizeId) bySizeId[ci.sizeId] = { quantity: ci.quantity, cartItemId: ci.id }
      } else if (ci.comboOffer) {
        byComboId[ci.comboOffer.id] = { quantity: ci.quantity, cartItemId: ci.id }
      }
    })
    setCartBySizeId(bySizeId)
    setCartByItemId(byItemId)
    setComboItems(byComboId)
  }

  useEffect(() => {
    if (!session) {
      setCartBySizeId({})
      setCartByItemId({})
      setComboItems({})
      return
    }
    fetch('/api/cart')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.cart) syncCart(data.cart) })
      .catch(() => {})
  }, [session])

  const handleAddToCart = async (menuItemId: string, sizeId: string | null, spiceIds: string[]) => {
    if (!session) { setShowAuthModal(true); return }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, sizeId, spiceIds, quantity: 1 }),
      })
      if (res.ok) { const data = await res.json(); syncCart(data.cart) }
    } catch {}
  }

  const handleAddComboToCart = async (comboOfferId: string) => {
    if (!session) { setShowAuthModal(true); return }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comboOfferId, quantity: 1 }),
      })
      if (res.ok) { const data = await res.json(); syncCart(data.cart) }
    } catch {}
  }

  const handleUpdateCart = async (cartItemId: string, qty: number) => {
    if (!session) return
    try {
      if (qty === 0) {
        const res = await fetch(`/api/cart/items?id=${cartItemId}`, { method: 'DELETE' })
        if (res.ok) { const data = await res.json(); syncCart(data.cart) }
      } else {
        const res = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: qty }),
        })
        if (res.ok) { const data = await res.json(); syncCart(data.cart) }
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Шапка */}
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
        {/* Пустое состояние */}
        {!loading && mounted && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mb-5">
              <Heart className="w-9 h-9 text-[var(--fg-subtle)]" />
            </div>
            <h2 className="text-xl font-extrabold mb-2">Пока пусто</h2>
            <p className="text-[var(--fg-muted)] text-sm max-w-xs mb-6">
              Нажмите на сердечко на карточке блюда, чтобы добавить его в избранное
            </p>
            <Link href="/#menu" className="btn btn-primary">
              <ShoppingBag className="w-4 h-4" />
              Перейти в меню
            </Link>
          </div>
        )}

        {/* Загрузка */}
        {(loading || !mounted) && favorites.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: favorites.length }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[var(--bg-muted)] animate-pulse"
                style={{ aspectRatio: '3/4' }}
              />
            ))}
          </div>
        )}

        {/* Список блюд */}
        {!loading && mounted && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(item =>
              item.type === 'combo' ? (
                <ComboFavoriteCard
                  key={item.storageId}
                  item={item}
                  comboQty={comboItems[item.id]?.quantity ?? 0}
                  onAdd={() => handleAddComboToCart(item.id)}
                  onUpdate={(_, qty) => {
                    const ref = comboItems[item.id]
                    if (ref) handleUpdateCart(ref.cartItemId, qty)
                  }}
                />
              ) : (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  cartBySizeId={cartBySizeId}
                  cartByItemId={cartByItemId}
                  onAddToCart={handleAddToCart}
                  onUpdateCart={handleUpdateCart}
                />
              )
            )}
          </div>
        )}

        {/* Блюда удалены из меню */}
        {!loading && mounted && favorites.length > 0 && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mb-5">
              <Heart className="w-9 h-9 text-[var(--fg-subtle)]" />
            </div>
            <h2 className="text-xl font-extrabold mb-2">Блюда недоступны</h2>
            <p className="text-[var(--fg-muted)] text-sm max-w-xs mb-6">
              Сохранённые блюда временно недоступны или были удалены из меню
            </p>
            <Link href="/#menu" className="btn btn-primary">
              <ShoppingBag className="w-4 h-4" />
              Перейти в меню
            </Link>
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}
