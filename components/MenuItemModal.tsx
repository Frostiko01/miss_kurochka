'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface MenuItemModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onAddToCart: (itemId: string, modifiers: string[], quantity: number) => void
}

export default function MenuItemModal({ item, isOpen, onClose, onAddToCart }: MenuItemModalProps) {
  const { theme } = useTheme()
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    if (item) {
      calculatePrice()
    }
  }, [item, selectedModifiers, quantity])

  const calculatePrice = () => {
    if (!item) return

    let price = Number(item.price)

    // Добавляем стоимость модификаторов
    selectedModifiers.forEach(modId => {
      item.modifiers?.forEach((mod: any) => {
        const option = mod.group.options.find((opt: any) => opt.id === modId)
        if (option) {
          price += Number(option.priceDelta)
        }
      })
    })

    setTotalPrice(price * quantity)
  }

  const toggleModifier = (groupId: string, optionId: string, selectionType: string) => {
    if (selectionType === 'single') {
      // Для single - заменяем выбор в этой группе
      const newModifiers = selectedModifiers.filter(modId => {
        // Убираем все опции из этой группы
        let isFromThisGroup = false
        item.modifiers?.forEach((mod: any) => {
          if (mod.group.id === groupId) {
            if (mod.group.options.find((opt: any) => opt.id === modId)) {
              isFromThisGroup = true
            }
          }
        })
        return !isFromThisGroup
      })
      setSelectedModifiers([...newModifiers, optionId])
    } else {
      // Для multiple - toggle
      if (selectedModifiers.includes(optionId)) {
        setSelectedModifiers(selectedModifiers.filter(id => id !== optionId))
      } else {
        setSelectedModifiers([...selectedModifiers, optionId])
      }
    }
  }

  const isModifierSelected = (optionId: string) => {
    return selectedModifiers.includes(optionId)
  }

  const canAddToCart = () => {
    if (!item) return false

    // Проверяем обязательные группы
    const requiredGroups = item.modifiers?.filter((mod: any) => mod.group.isRequired) || []
    
    for (const mod of requiredGroups) {
      const hasSelection = mod.group.options.some((opt: any) => 
        selectedModifiers.includes(opt.id)
      )
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Изображение */}
        {item.images && item.images.length > 0 && (
          <div className="relative h-64 w-full">
            <img
              src={item.images[0].imageUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded-t-2xl"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Название и описание */}
          <h2 className={`text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {item.name}
          </h2>
          {item.description && (
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.description}
            </p>
          )}

          {/* Информация о блюде */}
          <div className="flex flex-wrap gap-4 mb-6">
            {item.weightGrams && (
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="font-semibold">Вес:</span> {item.weightGrams}г
              </div>
            )}
            {item.calories && (
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="font-semibold">Калории:</span> {item.calories} ккал
              </div>
            )}
            {item.cookingTimeMinutes && (
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="font-semibold">Время:</span> {item.cookingTimeMinutes} мин
              </div>
            )}
          </div>

          {/* Модификаторы */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="mb-6">
              {item.modifiers.map((mod: any) => (
                <div key={mod.id} className="mb-4">
                  <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {mod.group.name}
                    {mod.group.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <div className="space-y-2">
                    {mod.group.options.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => toggleModifier(mod.group.id, option.id, mod.group.selectionType)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          isModifierSelected(option.id)
                            ? 'border-[#d62300] bg-[#d62300]/10'
                            : theme === 'dark'
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            {option.name}
                          </span>
                          {Number(option.priceDelta) !== 0 && (
                            <span className="text-[#d62300] font-bold">
                              {Number(option.priceDelta) > 0 ? '+' : ''}{option.priceDelta} сом
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Количество */}
          <div className="flex items-center gap-4 mb-6">
            <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Количество:
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg bg-[#d62300] text-white font-bold hover:bg-[#b01e00] transition-colors"
              >
                -
              </button>
              <span className={`text-xl font-bold w-12 text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg bg-[#d62300] text-white font-bold hover:bg-[#b01e00] transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Кнопка добавления */}
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
              canAddToCart()
                ? 'bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Добавить в корзину • {totalPrice} сом
          </button>

          {!canAddToCart() && (
            <p className="text-red-500 text-sm text-center mt-2">
              Выберите обязательные опции
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
