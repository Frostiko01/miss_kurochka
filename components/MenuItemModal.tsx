'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, Clock, Flame } from 'lucide-react'

interface MenuItemModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onAddToCart: (itemId: string, modifiers: string[], quantity: number) => void
}

export default function MenuItemModal({ item, isOpen, onClose, onAddToCart }: MenuItemModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([])
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    if (item) {
      // Автовыбор первого размера
      const firstSize = item.sizes?.[0]
      setSelectedSizeId(firstSize?.id ?? null)
    }
  }, [item])

  useEffect(() => {
    if (item) calculatePrice()
  }, [item, selectedModifiers, selectedSizeId, quantity])

  useEffect(() => {
    if (!isOpen) {
      setSelectedModifiers([])
      setSelectedSizeId(item?.sizes?.[0]?.id ?? null)
      setQuantity(1)
    }
  }, [isOpen])

  const calculatePrice = () => {
    if (!item) return
    // Базовая цена — из выбранного размера, иначе из первого размера
    const sizes = item.sizes ?? []
    const activeSize = sizes.find((s: any) => s.id === selectedSizeId) ?? sizes[0]
    let price = activeSize ? Number(activeSize.price) : 0
    // Добавляем специи
    item.spices?.forEach((spice: any) => {
      if (selectedModifiers.includes(spice.id)) price += Number(spice.price)
    })
    // Добавляем модификаторы
    item.modifiers?.forEach((mod: any) => {
      mod.group.options.forEach((opt: any) => {
        if (selectedModifiers.includes(opt.id)) price += Number(opt.priceDelta)
      })
    })
    setTotalPrice(price * quantity)
  }

  const toggleModifier = (groupId: string, optionId: string, selectionType: string) => {
    if (selectionType === 'single') {
      const newModifiers = selectedModifiers.filter((modId) => {
        let isFromThisGroup = false
        item.modifiers?.forEach((mod: any) => {
          if (mod.group.id === groupId && mod.group.options.find((opt: any) => opt.id === modId)) {
            isFromThisGroup = true
          }
        })
        return !isFromThisGroup
      })
      setSelectedModifiers([...newModifiers, optionId])
    } else {
      if (selectedModifiers.includes(optionId)) {
        setSelectedModifiers(selectedModifiers.filter((id) => id !== optionId))
      } else {
        setSelectedModifiers([...selectedModifiers, optionId])
      }
    }
  }

  const isModifierSelected = (optionId: string) => selectedModifiers.includes(optionId)

  const canAddToCart = () => {
    if (!item) return false
    const requiredGroups = item.modifiers?.filter((mod: any) => mod.group.isRequired) || []
    for (const mod of requiredGroups) {
      const hasSelection = mod.group.options.some((opt: any) => selectedModifiers.includes(opt.id))
      if (!hasSelection) return false
    }
    return true
  }

  const handleAddToCart = () => {
    if (canAddToCart()) {
      onAddToCart(item.id, selectedModifiers, quantity)
      onClose()
    }
  }

  if (!isOpen || !item) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="surface shadow-lg max-w-xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
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

          {(item.weightGrams || item.calories || item.cookingTimeMinutes || item.spicyLevel) && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {item.weightGrams && (
                <span className="badge">
                  {item.weightGrams}г
                </span>
              )}
              {item.calories && (
                <span className="badge">
                  {item.calories} ккал
                </span>
              )}
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
          {item.sizes && item.sizes.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold mb-2">
                Размер <span className="text-[var(--brand)]">*</span>
              </h3>
              <div className="space-y-1.5">
                {item.sizes.map((size: any) => {
                  const selected = selectedSizeId === size.id
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition ${
                        selected
                          ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                          : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                          selected ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border-strong)]'
                        }`}>
                          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className={`text-sm font-semibold ${selected ? 'text-[var(--brand)]' : ''}`}>
                          {size.name}{size.weightGrams ? ` · ${size.weightGrams}г` : ''}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[var(--fg)]">{Number(size.price)} сом</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Специи */}
          {item.spices && item.spices.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold mb-2">Специи / соусы</h3>
              <div className="space-y-1.5">
                {item.spices.map((spice: any) => {
                  const selected = selectedModifiers.includes(spice.id)
                  return (
                    <button
                      key={spice.id}
                      onClick={() => {
                        setSelectedModifiers(prev =>
                          prev.includes(spice.id)
                            ? prev.filter(id => id !== spice.id)
                            : [...prev, spice.id]
                        )
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition ${
                        selected
                          ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                          : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                          selected ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--border-strong)]'
                        }`}>
                          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className={`text-sm font-semibold ${selected ? 'text-[var(--brand)]' : ''}`}>
                          {spice.name}
                        </span>
                      </div>
                      {Number(spice.price) > 0 && (
                        <span className="text-sm font-bold text-[var(--fg)]">+{Number(spice.price)} сом</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {item.modifiers && item.modifiers.length > 0 && (
            <div className="space-y-5 mb-5">
              {item.modifiers.map((mod: any) => (
                <div key={mod.id}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-bold">
                      {mod.group.name}
                      {mod.group.isRequired && <span className="text-[var(--brand)] ml-1">*</span>}
                    </h3>
                    <span className="text-xs text-[var(--fg-subtle)] font-semibold">
                      {mod.group.selectionType === 'single' ? 'Выбор: 1' : 'Несколько'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {mod.group.options.map((option: any) => {
                      const selected = isModifierSelected(option.id)
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleModifier(mod.group.id, option.id, mod.group.selectionType)}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition ${
                            selected
                              ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                              : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-4 h-4 rounded ${
                                mod.group.selectionType === 'single' ? 'rounded-full' : 'rounded'
                              } border-2 flex items-center justify-center transition ${
                                selected
                                  ? 'border-[var(--brand)] bg-[var(--brand)]'
                                  : 'border-[var(--border-strong)]'
                              }`}
                            >
                              {selected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </span>
                            <span className={`text-sm font-semibold ${selected ? 'text-[var(--brand)]' : ''}`}>
                              {option.name}
                            </span>
                          </div>
                          {Number(option.priceDelta) !== 0 && (
                            <span className="text-sm font-bold text-[var(--fg)]">
                              {Number(option.priceDelta) > 0 ? '+' : ''}
                              {option.priceDelta} сом
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

          {/* Quantity + add */}
          <div className="flex items-stretch gap-2.5 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-[var(--fg)] transition"
                aria-label="Уменьшить"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-base w-7 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-[var(--fg)] transition"
                aria-label="Увеличить"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              В корзину • {totalPrice} сом
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
  )
}
