'use client'

import { Plus, Minus, Heart } from 'lucide-react'

interface SizeOption {
  id: string
  name: string
  priceDelta: number
  isDefault?: boolean
}

interface CartItemRef {
  id: string
  quantity: number
}

interface MultiSizeCardProps {
  item: any
  sizeGroup: any
  cartByOption: Record<string, CartItemRef>
  onAddSize: (menuItemId: string, optionId: string) => void
  onUpdateSize: (cartItemId: string, newQuantity: number) => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
  showFavorite?: boolean
  onCardClick?: () => void
}

/**
 * Карточка блюда с несколькими размерами.
 * Современный дизайн: большое фото, название, строки "граммовка — цена — кнопка".
 */
export default function MultiSizeCard({
  item,
  sizeGroup,
  cartByOption,
  onAddSize,
  onUpdateSize,
  isFavorite,
  onToggleFavorite,
  showFavorite,
  onCardClick,
}: MultiSizeCardProps) {
  const basePrice = Number(item.price)
  const options: SizeOption[] = sizeGroup.group.options ?? []

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
      {/* Фото */}
      <div
        className="relative overflow-hidden bg-gray-100 cursor-pointer"
        style={{ aspectRatio: '16/9' }}
        onClick={onCardClick}
      >
        {item.images?.[0]?.imageUrl ? (
          <img
            src={item.images[0].imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍗</div>
        )}

        {/* Бейджи */}
        {(item.isNew || item.isFeatured) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {item.isNew && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Новинка
              </span>
            )}
            {item.isFeatured && (
              <span className="bg-[var(--brand)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Хит
              </span>
            )}
          </div>
        )}

        {/* Сердечко */}
        {showFavorite && onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition hover:scale-110"
            aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          >
            <Heart
              className={`w-4 h-4 transition ${
                isFavorite ? 'fill-[var(--brand)] text-[var(--brand)]' : 'text-gray-400'
              }`}
            />
          </button>
        )}
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col flex-1">
        {/* Название */}
        <h3
          className="text-base font-extrabold leading-tight mb-3 cursor-pointer hover:text-[var(--brand)] transition-colors"
          onClick={onCardClick}
        >
          {item.name}
        </h3>

        {/* Строки размеров */}
        <div className="flex flex-col gap-0 flex-1">
          {options.map((opt, idx) => {
            const fullPrice = basePrice + Number(opt.priceDelta)
            const cartRef = cartByOption[opt.id]
            const quantity = cartRef?.quantity ?? 0
            const inCart = quantity > 0

            return (
              <div
                key={opt.id}
                className={`flex items-center gap-2 py-2.5 ${
                  idx < options.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Граммовка */}
                <span className="flex-1 text-sm font-bold text-gray-800">
                  {opt.name}
                </span>

                {/* Цена */}
                <span className="text-sm font-extrabold text-gray-900 shrink-0 mr-2">
                  {fullPrice}{' '}
                  <span className="text-[10px] font-semibold text-gray-400">сом</span>
                </span>

                {/* Кнопка или счётчик */}
                {inCart ? (
                  <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5 shrink-0">
                    <button
                      onClick={() => cartRef && onUpdateSize(cartRef.id, quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                      aria-label="Уменьшить"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-xs text-white min-w-[18px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => cartRef && onUpdateSize(cartRef.id, quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                      aria-label="Увеличить"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onAddSize(item.id, opt.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition shrink-0"
                    aria-label="Добавить"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}
