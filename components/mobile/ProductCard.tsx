'use client'

import { Plus, Minus, UtensilsCrossed, Flame } from 'lucide-react'

export interface ProductCardItem {
  id: string
  name: string
  description?: string | null
  isNew?: boolean
  isFeatured?: boolean
  spicyLevel?: number
  images?: { imageUrl: string; isPrimary?: boolean }[]
  sizes?: { id: string; price: number; weightGrams?: number | null }[]
  price?: number
  weightGrams?: number | null
}

interface Props {
  item: ProductCardItem
  cartQuantity?: number
  isFavorite?: boolean
  onClick: () => void
  onIncrease?: () => void
  onDecrease?: () => void
  onToggleFavorite?: () => void
  onAdd?: () => void
}

export default function ProductCard({
  item,
  cartQuantity = 0,
  isFavorite = false,
  onClick,
  onIncrease,
  onDecrease,
  onToggleFavorite,
  onAdd,
}: Props) {
  const image = item.images?.[0]?.imageUrl
  const minPrice =
    item.sizes && item.sizes.length > 0
      ? Math.min(...item.sizes.map((s) => Number(s.price)))
      : Number(item.price ?? 0)
  const weight = item.sizes?.[0]?.weightGrams ?? item.weightGrams

  return (
    <article
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl bg-white border border-[var(--border)] active:scale-[0.97] transition-transform duration-150 cursor-pointer flex flex-col"
      style={{ boxShadow: '0 1px 3px rgba(15,15,16,0.04)' }}
    >
      {/* Image */}
      <div className="relative w-full bg-[var(--bg-muted)]" style={{ aspectRatio: '1 / 1' }}>
        {image ? (
          <img
            src={image}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-subtle)]">
            <UtensilsCrossed className="w-10 h-10" strokeWidth={1.5} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isNew && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wide">
              Новинка
            </span>
          )}
          {item.isFeatured && !item.isNew && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold uppercase tracking-wide"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Flame className="w-2.5 h-2.5" />
              Хит
            </span>
          )}
        </div>

        {/* Favorite button removed */}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-extrabold leading-tight line-clamp-2 min-h-[34px]">
          {item.name}
        </h3>

        {weight && (
          <p className="text-[11px] text-[var(--fg-subtle)] font-semibold mt-0.5">
            {weight} г
          </p>
        )}

        {/* Price + Add */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-base font-extrabold text-[var(--fg)]">
              {minPrice > 0 ? minPrice : '—'}
            </span>
            <span className="text-[10px] font-bold text-[var(--fg-muted)] ml-0.5">сом</span>
          </div>

          {cartQuantity > 0 ? (
            <div
              className="flex items-center gap-0.5 rounded-full p-0.5 shrink-0"
              style={{ backgroundColor: 'var(--brand)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onDecrease}
                aria-label="Убрать"
                className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <span className="font-bold text-xs text-white min-w-[16px] text-center">
                {cartQuantity}
              </span>
              <button
                onClick={onIncrease}
                aria-label="Добавить"
                className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAdd?.()
              }}
              aria-label="Добавить в корзину"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 active:scale-90 transition-transform shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
