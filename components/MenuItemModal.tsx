'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Plus, Minus, ShoppingCart, Clock, Flame } from 'lucide-react'

interface MenuItemModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onAddToCart: (
    itemId: string,
    modifiers: string[],
    quantity: number,
    sizeId?: string | null,
    spices?: string[],
  ) => void
}

export default function MenuItemModal({ item, isOpen, onClose, onAddToCart }: MenuItemModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([])
  // Специи — радио (один вкус за раз), null = без специи / классический
  const [selectedSpiceId, setSelectedSpiceId] = useState<string | null>(null)
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (item) {
      setSelectedSizeId(item.sizes?.[0]?.id ?? null)
    }
    if (!isOpen) {
      setSelectedModifiers([])
      setSelectedSpiceId(null)
      setQuantity(1)
    }
  }, [isOpen, item])

  // Базовая цена выбранного размера
  const basePrice = useMemo(() => {
    if (!item) return 0
    const sizes = item.sizes ?? []
    const activeSize = sizes.find((s: any) => s.id === selectedSizeId) ?? sizes[0]
    return activeSize ? Number(activeSize.price) : Number(item.price ?? 0)
  }, [item, selectedSizeId])

  // Итоговая цена = базовая + выбранная специя + модификаторы
  const unitPrice = useMemo(() => {
    let price = basePrice
    // Выбранная специя добавляет свою цену
    if (selectedSpiceId) {
      const spice = item?.spices?.find((s: any) => s.id === selectedSpiceId)
      price += Number(spice?.price ?? 0)
    }
    // Модификаторы
    item?.modifiers?.forEach((mod: any) => {
      mod.group?.options?.forEach((opt: any) => {
        if (selectedModifiers.includes(opt.id)) price += Number(opt.priceDelta)
      })
    })
    return price
  }, [item, basePrice, selectedSpiceId, selectedModifiers])

  const totalPrice = unitPrice * quantity

  const toggleModifier = (groupId: string, optionId: string, selectionType: string) => {
    if (selectionType === 'single') {
      const newMods = selectedModifiers.filter(modId => {
        let fromGroup = false
        item.modifiers?.forEach((mod: any) => {
          if (mod.group.id === groupId && mod.group.options.find((o: any) => o.id === modId))
            fromGroup = true
        })
        return !fromGroup
      })
      setSelectedModifiers([...newMods, optionId])
    } else {
      setSelectedModifiers(prev =>
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId],
      )
    }
  }

  const canAddToCart = () => {
    if (!item) return false
    const required = item.modifiers?.filter((mod: any) => mod.group.isRequired) || []
    return required.every((mod: any) =>
      mod.group.options.some((opt: any) => selectedModifiers.includes(opt.id)),
    )
  }

  const handleAddToCart = () => {
    if (!canAddToCart()) return
    onAddToCart(item.id, selectedModifiers, quantity, selectedSizeId, selectedSpiceId ? [selectedSpiceId] : [])
    onClose()
  }

  if (!isOpen || !item) return null

  const hasSpices = item?.spices?.length > 0
  const hasModifiers = item?.modifiers?.length > 0
  const hasSizes = item?.sizes?.length > 0

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="surface shadow-lg max-w-xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Фото */}
        {item.images && item.images.length > 0 && (
          <div className="relative h-56 sm:h-64">
            <img
              src={item.images[0].imageUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded-t-[var(--radius-xl)]"
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:bg-white transition shadow-sm"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-[var(--fg)]" />
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1.5">{item.name}</h2>
          {item.description && (
            <p className="text-sm text-[var(--fg-muted)] mb-4 leading-relaxed">{item.description}</p>
          )}

          {/* Бейджи */}
          {(item.weightGrams || item.calories || item.cookingTimeMinutes || item.spicyLevel) && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {item.weightGrams && <span className="badge">{item.weightGrams}г</span>}
              {item.calories && <span className="badge">{item.calories} ккал</span>}
              {item.cookingTimeMinutes && (
                <span className="badge">
                  <Clock className="w-3 h-3" />
                  {item.cookingTimeMinutes} мин
                </span>
              )}
              {item.spicyLevel > 0 && (
                <span className="badge badge-danger">
                  <Flame className="w-3 h-3" />
                  Острое × {item.spicyLevel}
                </span>
              )}
            </div>
          )}

          {/* Размеры */}
          {hasSizes && (
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-2">
                Размер
              </h3>
              <div className="space-y-1.5">
                {item.sizes.map((size: any) => {
                  const sel = selectedSizeId === size.id
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        sel
                          ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                          : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                            sel ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border-strong)]'
                          }`}
                        >
                          {sel && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className={`text-sm font-semibold ${sel ? 'text-[var(--brand)]' : ''}`}>
                          {size.name}
                          {size.weightGrams ? (
                            <span className="text-[var(--fg-muted)] font-normal ml-1.5">{size.weightGrams}г</span>
                          ) : null}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${sel ? 'text-[var(--brand)]' : 'text-[var(--fg)]'}`}>
                        {Number(size.price)} сом
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Специи / соусы — радио (один вкус за раз) */}
          {hasSpices && (
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-2">
                Специи / соусы
              </h3>
              <div className="space-y-1.5">
                {item.spices.map((spice: any) => {
                  const sel = selectedSpiceId === spice.id
                  const spicePrice = Number(spice.price)
                  return (
                    <button
                      key={spice.id}
                      onClick={() => setSelectedSpiceId(sel ? null : spice.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        sel
                          ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                          : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Радио-кружок */}
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                            sel ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border-strong)]'
                          }`}
                        >
                          {sel && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className={`text-sm font-semibold ${sel ? 'text-[var(--brand)]' : ''}`}>
                          {spice.name}
                        </span>
                      </div>
                      {spicePrice > 0 && (
                        <span className={`text-sm font-bold ${sel ? 'text-[var(--brand)]' : 'text-[var(--fg-muted)]'}`}>
                          +{spicePrice} сом
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Модификаторы */}
          {hasModifiers && (
            <div className="space-y-5 mb-5">
              {item.modifiers.map((mod: any) => (
                <div key={mod.id}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)]">
                      {mod.group.name}
                      {mod.group.isRequired && <span className="text-[var(--brand)] ml-1">*</span>}
                    </h3>
                    <span className="text-xs text-[var(--fg-subtle)] font-semibold">
                      {mod.group.selectionType === 'single' ? 'Выбор: 1' : 'Несколько'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {mod.group.options.map((option: any) => {
                      const sel = selectedModifiers.includes(option.id)
                      const isSingle = mod.group.selectionType === 'single'
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleModifier(mod.group.id, option.id, mod.group.selectionType)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                            sel
                              ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                              : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-4 h-4 ${isSingle ? 'rounded-full' : 'rounded'} border-2 flex items-center justify-center transition ${
                                sel ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border-strong)]'
                              }`}
                            >
                              {sel && (isSingle
                                ? <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                : <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              )}
                            </span>
                            <span className={`text-sm font-semibold ${sel ? 'text-[var(--brand)]' : ''}`}>
                              {option.name}
                            </span>
                          </div>
                          {Number(option.priceDelta) !== 0 && (
                            <span className={`text-sm font-bold ${sel ? 'text-[var(--brand)]' : 'text-[var(--fg-muted)]'}`}>
                              {Number(option.priceDelta) > 0 ? '+' : ''}{option.priceDelta} сом
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Количество + кнопка */}
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-stretch gap-2.5">
              <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white transition"
                  aria-label="Уменьшить"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-base w-7 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white transition"
                  aria-label="Увеличить"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart()}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold"
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Выбрать · {totalPrice} сом
              </button>
            </div>

            {!canAddToCart() && (
              <p className="text-[var(--brand)] text-xs text-center mt-2 font-semibold">
                Выберите обязательные опции
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
