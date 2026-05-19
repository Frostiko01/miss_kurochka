'use client'

import { useEffect } from 'react'
import { X, Heart, Plus, Minus, Flame, Clock, Zap, Leaf, Info, Weight } from 'lucide-react'

interface CartItemRef {
  id: string
  quantity: number
}

interface MenuItemDetailModalProps {
  item: any | null
  isOpen: boolean
  onClose: () => void
  cartItem?: CartItemRef | null
  onAdd?: (menuItemId: string) => void
  onUpdate?: (cartItemId: string, newQuantity: number) => void
  sizeGroup?: any | null
  cartByOption?: Record<string, CartItemRef>
  onAddSize?: (menuItemId: string, optionId: string) => void
  onUpdateSize?: (cartItemId: string, newQuantity: number) => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
  showFavorite?: boolean
}

export default function MenuItemDetailModal({
  item,
  isOpen,
  onClose,
  cartItem,
  onAdd,
  onUpdate,
  sizeGroup,
  cartByOption = {},
  onAddSize,
  onUpdateSize,
  isFavorite,
  onToggleFavorite,
  showFavorite,
}: MenuItemDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen || !item) return null

  const basePrice = Number(item.price)
  const hasSizes = sizeGroup && sizeGroup.group?.options?.length >= 2
  const options = hasSizes ? (sizeGroup.group.options ?? []) : []

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-md flex flex-col bg-white shadow-2xl"
        style={{
          borderRadius: '20px 20px 0 0',
          maxHeight: '92vh',
          overflow: 'hidden',
        }}
      >
        {/* ── ФОТО ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            flexShrink: 0,
            overflow: 'hidden',
            borderRadius: '20px 20px 0 0',
            backgroundColor: '#f3f3f5',
          }}
        >
          {item.images?.[0]?.imageUrl ? (
            <img
              src={item.images[0].imageUrl}
              alt={item.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              🍗
            </div>
          )}

          {/* Кнопка закрыть */}
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <X size={18} color="#0f0f10" />
          </button>

          {/* Сердечко */}
          {showFavorite && onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Heart
                size={18}
                color={isFavorite ? '#d62300' : '#8a8a90'}
                fill={isFavorite ? '#d62300' : 'none'}
              />
            </button>
          )}

          {/* Бейджи */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6 }}>
            {item.isNew && <span className="badge badge-success">Новинка</span>}
            {item.isFeatured && <span className="badge badge-brand">Хит</span>}
          </div>
        </div>

        {/* ── КОНТЕНТ ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 28px' }}>
          {/* Название */}
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {item.name}
          </h2>
          {item.description && (
            <p style={{ fontSize: 14, color: '#57575c', lineHeight: 1.55, margin: '0 0 16px' }}>
              {item.description}
            </p>
          )}

          {/* Характеристики */}
          {(item.weightGrams || item.calories || item.cookingTimeMinutes || item.spicyLevel > 0 || item.isVegetarian || item.isVegan) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {item.weightGrams && <Chip icon={<Weight size={11} />} label={`${item.weightGrams} г`} />}
              {item.calories && <Chip icon={<Zap size={11} />} label={`${item.calories} ккал`} />}
              {item.cookingTimeMinutes && <Chip icon={<Clock size={11} />} label={`${item.cookingTimeMinutes} мин`} />}
              {item.spicyLevel > 0 && <Chip icon={<Flame size={11} />} label={`Острота ${item.spicyLevel}/3`} accent />}
              {item.isVegetarian && <Chip icon={<Leaf size={11} />} label="Вегетарианское" green />}
              {item.isVegan && <Chip icon={<Leaf size={11} />} label="Веганское" green />}
            </div>
          )}

          {/* КБЖУ */}
          {(item.proteins || item.fats || item.carbohydrates) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {item.proteins && <NutritionCell label="Белки" value={`${item.proteins} г`} />}
              {item.fats && <NutritionCell label="Жиры" value={`${item.fats} г`} />}
              {item.carbohydrates && <NutritionCell label="Углеводы" value={`${item.carbohydrates} г`} />}
            </div>
          )}

          {/* Состав */}
          {item.ingredients && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a8a90', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={12} /> Состав
              </p>
              <p style={{ fontSize: 13, color: '#57575c', lineHeight: 1.5 }}>{item.ingredients}</p>
            </div>
          )}

          {/* Аллергены */}
          {item.allergens && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 2 }}>⚠️ Аллергены</p>
              <p style={{ fontSize: 12, color: '#92400e' }}>{item.allergens}</p>
            </div>
          )}

          {/* Разделитель */}
          <div style={{ height: 1, background: '#ececef', margin: '16px 0' }} />

          {/* Кнопки */}
          {hasSizes ? (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8a8a90', marginBottom: 10 }}>
                Выберите размер
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt: any) => {
                  const fullPrice = basePrice + Number(opt.priceDelta)
                  const cartRef = cartByOption[opt.id]
                  const quantity = cartRef?.quantity ?? 0
                  const inCart = quantity > 0

                  return (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1.5px solid ${inCart ? '#d62300' : '#ececef'}`,
                        background: inCart ? '#fff1ee' : '#f7f7f8',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f0f10', margin: 0 }}>{opt.name}</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: inCart ? '#d62300' : '#0f0f10', margin: '2px 0 0' }}>
                          {fullPrice} <span style={{ fontSize: 11, fontWeight: 600, color: '#8a8a90' }}>сом</span>
                        </p>
                      </div>

                      {inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#d62300', borderRadius: 999, padding: 3 }}>
                          <button
                            onClick={() => cartRef && onUpdateSize?.(cartRef.id, quantity - 1)}
                            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'white', minWidth: 20, textAlign: 'center' }}>{quantity}</span>
                          <button
                            onClick={() => cartRef && onUpdateSize?.(cartRef.id, quantity + 1)}
                            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddSize?.(item.id, opt.id)}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #ececef', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d62300', flexShrink: 0 }}
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                {basePrice} <span style={{ fontSize: 13, fontWeight: 600, color: '#8a8a90' }}>сом</span>
              </p>

              {cartItem && cartItem.quantity > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#d62300', borderRadius: 999, padding: 4 }}>
                  <button
                    onClick={() => onUpdate?.(cartItem.id, cartItem.quantity - 1)}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'white', minWidth: 24, textAlign: 'center' }}>{cartItem.quantity}</span>
                  <button
                    onClick={() => onUpdate?.(cartItem.id, cartItem.quantity + 1)}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAdd?.(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#d62300', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Plus size={16} />
                  В корзину
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Chip({ icon, label, accent, green }: { icon: React.ReactNode; label: string; accent?: boolean; green?: boolean }) {
  const bg = accent ? '#fef2f2' : green ? '#ecfdf5' : '#f1f1f3'
  const color = accent ? '#d62300' : green ? '#047857' : '#57575c'
  const border = accent ? '#fee2e2' : green ? '#d1fae5' : '#ececef'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color, border: `1px solid ${border}` }}>
      {icon}{label}
    </span>
  )
}

function NutritionCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 12, background: '#f7f7f8', border: '1px solid #ececef' }}>
      <p style={{ fontSize: 11, color: '#8a8a90', fontWeight: 600, margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{value}</p>
    </div>
  )
}
