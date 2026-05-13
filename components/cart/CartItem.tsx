'use client'

import { useState } from 'react'
import Image from 'next/image'
import QuantityCounter from './QuantityCounter'

interface ModifierOption {
  id: string
  name: string
  priceDelta: number
  group: {
    id: string
    name: string
  }
}

interface CartItemModifier {
  id: string
  modifierOption: ModifierOption
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  weightGrams: number | null
  images: Array<{ imageUrl: string; isPrimary: boolean }>
  category: {
    id: string
    name: string
  }
}

interface CartItemData {
  id: string
  quantity: number
  itemComment: string | null
  menuItem: MenuItem
  modifiers: CartItemModifier[]
}

interface CartItemProps {
  item: CartItemData
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  isUpdating: boolean
}

export default function CartItem({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isUpdating 
}: CartItemProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const primaryImage = item.menuItem.images.find(img => img.isPrimary) || item.menuItem.images[0]
  const unitPrice = Number(item.menuItem.price) + item.modifiers.reduce((sum, mod) => sum + Number(mod.modifierOption.priceDelta), 0)
  const itemTotal = unitPrice * item.quantity

  const handleQuantityUpdate = (newQuantity: number) => {
    if (newQuantity === 0) {
      setShowRemoveConfirm(true)
    } else {
      onUpdateQuantity(item.id, newQuantity)
    }
  }

  const handleRemove = () => {
    onRemove(item.id)
    setShowRemoveConfirm(false)
  }

  return (
    <>
      <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 ${
        isUpdating ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'
      }`}>
        <div className="p-4">
          <div className="flex gap-3">
            {/* Изображение товара */}
            {primaryImage && (
              <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 relative">
                <Image
                  src={primaryImage.imageUrl}
                  alt={item.menuItem.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}

            {/* Информация о товаре */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 leading-tight pr-2">
                  {item.menuItem.name}
                </h3>
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={isUpdating}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {item.menuItem.weightGrams && (
                <p className="text-xs text-gray-500 mb-2">
                  {item.menuItem.weightGrams} г
                </p>
              )}

              {/* Модификаторы */}
              {item.modifiers.length > 0 && (
                <div className="mb-3 space-y-1">
                  {item.modifiers.map((mod) => (
                    <div key={mod.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">+ {mod.modifierOption.name}</span>
                      {mod.modifierOption.priceDelta > 0 && (
                        <span className="text-gray-500 font-medium">+{mod.modifierOption.priceDelta} ₽</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Комментарий */}
              {item.itemComment && (
                <div className="mb-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <span className="font-medium">Комментарий:</span> {item.itemComment}
                  </p>
                </div>
              )}

              {/* Цена и количество */}
              <div className="flex items-center justify-between">
                <QuantityCounter
                  quantity={item.quantity}
                  onUpdate={(newQuantity) => handleQuantityUpdate(newQuantity)}
                  disabled={isUpdating}
                  size="md"
                />
                
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">
                    {itemTotal} ₽
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-500">
                      {unitPrice} ₽ × {item.quantity}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Удалить товар?
              </h3>
              <p className="text-gray-600 mb-6">
                «{item.menuItem.name}» будет удален из корзины
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleRemove}
                  disabled={isUpdating}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Удаляем...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}