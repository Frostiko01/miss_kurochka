'use client'

import { Plus, Minus, Flame, UtensilsCrossed } from 'lucide-react'

export interface ComboItem {
  id: string
  name: string
  description?: string | null
  items: string[]
  price: number
  oldPrice?: number | null
  image?: string | null
}

interface Props {
  combos: ComboItem[]
  cartByComboId: Record<string, { quantity: number; cartItemId: string }>
  onComboClick: (combo: ComboItem) => void
  onAddCombo: (id: string) => void
  onRemoveCombo: (cartItemId: string, qty: number) => void
}

export default function ComboSection({
  combos,
  cartByComboId,
  onComboClick,
  onAddCombo,
  onRemoveCombo,
}: Props) {
  if (combos.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between px-4 mb-3">
        <div>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand)' }}
          >
            <Flame className="w-3 h-3" />
            Выгодно
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-1.5">Комбо</h2>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory">
        {combos.map((combo) => {
          const cartRef = cartByComboId[combo.id]
          const qty = cartRef?.quantity ?? 0
          const discount =
            combo.oldPrice && combo.oldPrice > combo.price
              ? Math.round((1 - combo.price / combo.oldPrice) * 100)
              : null

          return (
            <article
              key={combo.id}
              onClick={() => onComboClick(combo)}
              className="snap-start shrink-0 w-[260px] rounded-2xl bg-white border border-[var(--border)] overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(15,15,16,0.04)' }}
            >
              {/* Image */}
              <div className="relative w-full bg-[var(--bg-muted)]" style={{ aspectRatio: '4 / 3' }}>
                {combo.image ? (
                  <img
                    src={combo.image}
                    alt={combo.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-subtle)]">
                    <UtensilsCrossed className="w-12 h-12" strokeWidth={1.5} />
                  </div>
                )}
                {discount && (
                  <span
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    −{discount}%
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-sm font-extrabold leading-tight line-clamp-2 mb-1.5">
                  {combo.name}
                </h3>
                <p className="text-[11px] text-[var(--fg-subtle)] line-clamp-2 mb-2.5">
                  {combo.items.slice(0, 4).join(' · ')}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {combo.oldPrice && (
                      <div className="text-[11px] text-[var(--fg-subtle)] line-through font-semibold leading-none">
                        {combo.oldPrice} сом
                      </div>
                    )}
                    <div className="text-base font-extrabold text-[var(--brand)] leading-tight">
                      {combo.price}{' '}
                      <span className="text-[10px] font-bold text-[var(--fg-muted)]">сом</span>
                    </div>
                  </div>

                  {qty > 0 ? (
                    <div
                      className="flex items-center gap-0.5 rounded-full p-0.5 shrink-0"
                      style={{ backgroundColor: 'var(--brand)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => cartRef && onRemoveCombo(cartRef.cartItemId, qty - 1)}
                        className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform"
                        aria-label="Убрать"
                      >
                        <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="font-bold text-xs text-white min-w-[16px] text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => onAddCombo(combo.id)}
                        className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform"
                        aria-label="Ещё"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddCombo(combo.id)
                      }}
                      aria-label="Добавить"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 active:scale-90 transition-transform shadow-md"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                      }}
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.6} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
