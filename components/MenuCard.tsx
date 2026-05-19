'use client'

import { useState } from 'react'
import { Plus, Minus, Heart } from 'lucide-react'
import SegmentedControl from './SegmentedControl'
import { useFavorites } from '@/hooks/useFavorites'

interface CartItemRef {
  quantity: number
  cartItemId: string
}

interface MenuCardProps {
  item: any
  // Корзина для обычного блюда
  cartItem?: CartItemRef | null
  onAdd: (itemId: string) => void
  onUpdate: (cartItemId: string, qty: number) => void
  // Корзина для размеров (если есть sizeGroup)
  sizeGroup?: any | null
  cartByOption?: Record<string, CartItemRef>
  onAddSize?: (itemId: string, optionId: string) => void
  onUpdateSize?: (cartItemId: string, qty: number) => void
  // Клик на карточку — открыть детали
  onCardClick?: () => void
}

export default function MenuCard({
  item,
  cartItem,
  onAdd,
  onUpdate,
  sizeGroup,
  cartByOption = {},
  onAddSize,
  onUpdateSize,
  onCardClick,
}: MenuCardProps) {
  const hasSizes = !!(sizeGroup && sizeGroup.group?.options?.length >= 2)
  const options = hasSizes ? (sizeGroup.group.options as any[]) : []

  // Выбранный вариант размера
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    options[0]?.id ?? ''
  )
  const { isFavorite, toggle: toggleFavorite } = useFavorites()

  const selectedOption = options.find((o: any) => o.id === selectedOptionId) ?? options[0]
  const basePrice = Number(item.price)

  // Цена для отображения
  const displayPrice = hasSizes && selectedOption
    ? basePrice + Number(selectedOption.priceDelta)
    : basePrice

  // Состояние корзины для выбранного варианта
  const currentCartRef = hasSizes
    ? (cartByOption[selectedOptionId] ?? null)
    : (cartItem ?? null)
  const qty = currentCartRef?.quantity ?? 0

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasSizes && onAddSize) {
      onAddSize(item.id, selectedOptionId)
    } else {
      onAdd(item.id)
    }
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentCartRef) return
    if (hasSizes && onUpdateSize) {
      onUpdateSize(currentCartRef.cartItemId, qty - 1)
    } else {
      onUpdate(currentCartRef.cartItemId, qty - 1)
    }
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasSizes && onAddSize) {
      onAddSize(item.id, selectedOptionId)
    } else if (currentCartRef) {
      onUpdate(currentCartRef.cartItemId, qty + 1)
    } else {
      onAdd(item.id)
    }
  }

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
      {/* Фото */}
      <div
        className="relative overflow-hidden bg-gray-100 cursor-pointer group"
        style={{ aspectRatio: '4/3' }}
        onClick={onCardClick}
      >
        {item.images?.[0]?.imageUrl ? (
          <img
            src={item.images[0].imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍗</div>
        )}

        {/* Бейджи */}
        {(item.isNew || item.isFeatured) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.isNew && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Новинка
              </span>
            )}
            {item.isFeatured && (
              <span className="bg-[var(--brand)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Хит
              </span>
            )}
          </div>
        )}
        {/* Кнопка избранного */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id) }}
          aria-label={isFavorite(item.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite(item.id)
                ? 'fill-[var(--brand)] text-[var(--brand)]'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Контент */}
      <div className="p-3 flex flex-col flex-1">

        {/* Название + цена в одной строке */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="text-sm font-extrabold leading-tight line-clamp-1 cursor-pointer hover:text-[var(--brand)] transition-colors flex-1"
            onClick={onCardClick}
          >
            {item.name}
          </h3>
          <span className="text-sm font-extrabold text-[var(--fg)] shrink-0 whitespace-nowrap">
            {displayPrice}{' '}
            <span className="text-[10px] font-bold text-[var(--fg-muted)]">сом</span>
          </span>
        </div>

        {/* Описание — 2 строки */}
        <p className="text-[11px] text-[var(--fg-subtle)] line-clamp-2 leading-relaxed mb-3 min-h-[2.4em]">
          {item.description ?? ''}
        </p>

        {/* Нижняя строка: переключатель слева, кнопка справа */}
        <div className="mt-auto flex items-center justify-between gap-2">
          {/* Слева: SegmentedControl (размеры) или пусто */}
          {hasSizes ? (
            <SegmentedControl
              items={options.map((o: any) => ({
                label: o.name,
                value: o.id,
              }))}
              value={selectedOptionId}
              onChange={(val) => setSelectedOptionId(val)}
            />
          ) : (
            <div />
          )}

          {/* Справа: кнопка "Добавить" или счётчик */}
          {qty > 0 ? (
            <div
              className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5 shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                aria-label="Уменьшить"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-xs text-white min-w-[16px] text-center">{qty}</span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                aria-label="Увеличить"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition text-xs font-bold shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
