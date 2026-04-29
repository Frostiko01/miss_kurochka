'use client'

import { useState } from 'react'
import type { MenuCategoryWithItems } from '@/types'
import { formatPrice, getI18nText, type Language } from '@/types'

interface MenuListProps {
  categories: MenuCategoryWithItems[]
  language?: Language
}

export default function MenuList({ categories, language = 'ru' }: MenuListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories[0]?.id || null
  )

  const currentCategory = categories.find(cat => cat.id === selectedCategory)

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 uppercase">Наше меню</h1>
          <p className="text-xl text-gray-600">Выберите категорию и наслаждайтесь вкусом</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-2xl font-black mb-6 uppercase">Категории</h2>
              <nav className="space-y-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-6 py-4 rounded-xl font-black uppercase text-sm tracking-wide transition-all border-4 ${
                      selectedCategory === category.id
                        ? 'bg-[#d62300] text-white border-black shadow-[6px_6px_0_#000] translate-x-[-2px] translate-y-[-2px]'
                        : 'bg-white text-black border-black hover:bg-black hover:text-white shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#d62300] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                    }`}
                  >
                    {getI18nText(category.nameI18n as any, category.name, language)}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Menu Items */}
          <main className="flex-1">
            {currentCategory && (
              <>
                <div className="mb-8">
                  <h2 className="text-5xl font-black uppercase tracking-tight mb-2">
                    {getI18nText(currentCategory.nameI18n as any, currentCategory.name, language)}
                  </h2>
                  <div className="h-2 w-24 bg-[#d62300]"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentCategory.menuItems.map(item => {
                    const primaryImage = item.images.find(img => img.isPrimary)

                    return (
                      <article
                        key={item.id}
                        className="bg-white rounded-2xl border-4 border-black overflow-hidden shadow-[6px_6px_0_#000] hover:shadow-[8px_8px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group"
                      >
                        {/* Image */}
                        {primaryImage && (
                          <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                            <img
                              src={primaryImage.imageUrl}
                              alt={getI18nText(item.nameI18n as any, item.name, language)}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {item.isNew && (
                                <span className="bg-[#d62300] text-white px-3 py-1 rounded-full text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_#000]">
                                  {language === 'ru' ? 'Новинка' : language === 'en' ? 'New' : 'Жаңы'}
                                </span>
                              )}
                              {item.isFeatured && (
                                <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-black uppercase border-2 border-white shadow-[2px_2px_0_#d62300]">
                                  {language === 'ru' ? 'Хит' : language === 'en' ? 'Hit' : 'Хит'}
                                </span>
                              )}
                            </div>

                            {/* Spicy Level */}
                            {item.spicyLevel > 0 && (
                              <div className="absolute top-3 right-3 bg-white border-2 border-black rounded-full px-2 py-1 shadow-[2px_2px_0_#000]">
                                <span className="text-lg">{'🌶️'.repeat(item.spicyLevel)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-[#d62300] transition-colors">
                            {getI18nText(item.nameI18n as any, item.name, language)}
                          </h3>

                          {item.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {getI18nText(item.descriptionI18n as any, item.description, language)}
                            </p>
                          )}

                          {/* Details */}
                          <div className="flex items-center gap-3 text-xs font-bold text-gray-500 mb-4 flex-wrap">
                            {item.weightGrams && (
                              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-300">{item.weightGrams}г</span>
                            )}
                            {item.volumeMl && (
                              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-300">{item.volumeMl}мл</span>
                            )}
                            {item.cookingTimeMinutes && (
                              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-300">⏱ {item.cookingTimeMinutes} мин</span>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.isVegetarian && (
                              <span className="text-xs bg-white border-2 border-black px-2 py-1 rounded-full font-black">
                                🌱 {language === 'ru' ? 'Вегетарианское' : language === 'en' ? 'Vegetarian' : 'Вегетариан'}
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="text-xs bg-white border-2 border-black px-2 py-1 rounded-full font-black">
                                🌿 {language === 'ru' ? 'Веганское' : language === 'en' ? 'Vegan' : 'Веган'}
                              </span>
                            )}
                          </div>

                          {/* Price and Button */}
                          <div className="flex items-center justify-between pt-4 border-t-2 border-black">
                            <span className="text-4xl font-black text-[#d62300]">
                              {formatPrice(item.price)}
                            </span>
                            <button className="bg-[#d62300] hover:bg-black text-white px-6 py-3 rounded-full font-black uppercase text-xs tracking-wide transition-all border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]">
                              {language === 'ru' ? 'В корзину' : language === 'en' ? 'Add' : 'Себетке'}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
