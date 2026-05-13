'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UserMenu from '@/components/UserMenu'
import AuthModal from '@/components/AuthModal'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslations } from '@/app/i18n/hooks/useTranslations'
import MenuItemModal from '@/components/MenuItemModal'
import { Flame } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme } = useTheme() // Используем хук напрямую
  const { locale, changeLocale, translations, t, tArray } = useTranslations('landing')
  const [activeCategory, setActiveCategory] = useState('fried')
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const comboScrollRef = useRef<HTMLDivElement>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [comboDeals, setComboDeals] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [menuData, setMenuData] = useState<any>({
    regular: [],
    combo: [],
    mini_combo: []
  })
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [cartItems, setCartItems] = useState<{[key: string]: {quantity: number, cartItemId: string}}>({}) // Храним количество товаров по ID

  // Перенаправляем админов и сотрудников филиалов на их панели
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (session.user.role === 'branch') {
        router.push('/branch/dashboard')
      }
      // Обычные пользователи (customer) могут оставаться на главной странице
    }
  }, [status, session, router])

  // Показываем модальное окно регистрации при первом входе
  useEffect(() => {
    if (status === 'unauthenticated') {
      const hasSeenModal = localStorage.getItem('hasSeenAuthModal')
      if (!hasSeenModal) {
        setShowAuthModal(true)
        localStorage.setItem('hasSeenAuthModal', 'true')
      }
    }
  }, [status])

  // Загружаем количество товаров в корзине
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCartCount()
    }
  }, [status])

  // Загружаем комбо-наборы, филиалы и меню при монтировании
  useEffect(() => {
    fetchCombos()
    fetchBranches()
    fetchMenu() // Загружаем меню сразу
  }, [])

  // Обновляем меню при изменении филиала (для учёта стоп-листа)
  useEffect(() => {
    if (selectedBranch) {
      fetchMenu()
    }
  }, [selectedBranch])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      const data = await response.json()
      
      if (response.ok && data.branches) {
        setBranches(data.branches)
        // Не выбираем филиал автоматически - показываем все блюда по умолчанию
      }
    } catch (error) {
      console.error('Ошибка загрузки филиалов:', error)
    }
  }

  const fetchMenu = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBranch) {
        params.append('branchId', selectedBranch)
      }
      
      const response = await fetch(`/api/menu?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setMenuData(data.grouped)
        // Устанавливаем первую категорию как активную из всех доступных типов
        const allCats = [
          ...data.grouped.regular,
          ...data.grouped.combo,
          ...data.grouped.mini_combo
        ]
        if (allCats.length > 0) {
          // Выбираем первую категорию, у которой есть блюда
          const categoryWithItems = allCats.find(cat => cat.items && cat.items.length > 0)
          if (categoryWithItems) {
            setActiveCategory(categoryWithItems.id)
          } else if (allCats.length > 0) {
            // Если ни в одной категории нет блюд, выбираем первую категорию
            setActiveCategory(allCats[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки меню:', error)
    }
  }

  const fetchCombos = async () => {
    try {
      const response = await fetch('/api/combo-offers')
      const data = await response.json()
      
      if (response.ok && data.combos) {
        // Преобразуем данные из БД в формат для отображения
        const formattedCombos = data.combos.map((combo: any) => ({
          id: combo.id,
          name: combo.name,
          items: combo.items,
          price: `${combo.price} сом`,
          oldPrice: combo.oldPrice ? `${combo.oldPrice} сом` : null,
          image: combo.imageUrl
        }))
        setComboDeals(formattedCombos)
      }
    } catch (error) {
      console.error('Ошибка загрузки комбо:', error)
    }
  }

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      
      if (response.ok && data.cart) {
        const count = data.cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartCount(count)
        
        // Сохраняем информацию о товарах в корзине
        const itemsMap: {[key: string]: {quantity: number, cartItemId: string}} = {}
        data.cart.items.forEach((item: any) => {
          itemsMap[item.menuItem.id] = {
            quantity: item.quantity,
            cartItemId: item.id
          }
        })
        setCartItems(itemsMap)
        
        // Вычисляем общую сумму
        const total = data.cart.items.reduce((sum: number, item: any) => {
          let itemTotal = Number(item.menuItem.price) * item.quantity
          // Добавляем стоимость модификаторов
          if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach((mod: any) => {
              itemTotal += Number(mod.modifierOption.priceDelta) * item.quantity
            })
          }
          return sum + itemTotal
        }, 0)
        setCartTotal(total)
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error)
    }
  }

  const heroImages = [
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1920&q=80',
    'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=1920&q=80',
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1920&q=80',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=1920&q=80'
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Автоматическая прокрутка карусели комбо
  useEffect(() => {
    const scrollContainer = comboScrollRef.current
    if (!scrollContainer) return

    let scrollAmount = 0
    const scrollSpeed = 0.5 // Медленная скорость (пиксели за кадр)
    const cardWidth = 384 + 32 // ширина карточки (w-96 = 384px) + gap (32px)
    const totalCards = 4 // количество оригинальных карточек

    const autoScroll = () => {
      if (scrollContainer) {
        scrollAmount += scrollSpeed
        scrollContainer.scrollLeft = scrollAmount

        // Когда прокрутили половину (все оригинальные карточки), возвращаемся в начало
        if (scrollAmount >= cardWidth * totalCards) {
          scrollAmount = 0
          scrollContainer.scrollLeft = 0
        }
      }
    }

    const intervalId = setInterval(autoScroll, 16) // ~60 FPS

    return () => clearInterval(intervalId)
  }, [])

  // Получаем все категории из загруженного меню (только те, у которых есть блюда)
  const allCategories = [
    ...menuData.regular,
    ...menuData.combo,
    ...menuData.mini_combo
  ].filter(cat => cat.items && cat.items.length > 0)

  const addToCart = async (menuItemId?: string, modifiers?: string[], quantity?: number) => {
    // Если пользователь не авторизован, показываем модальное окно
    if (!session) {
      setShowAuthModal(true)
      return
    }

    if (!menuItemId) return

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId,
          quantity: quantity || 1,
          modifiers: modifiers || [],
          branchId: selectedBranch
        })
      })

      if (response.ok) {
        fetchCartCount()
        // Можно добавить toast уведомление
        console.log('Добавлено в корзину')
      } else {
        console.error('Ошибка добавления в корзину')
      }
    } catch (error) {
      console.error('Ошибка:', error)
    }
  }

  const handleItemClick = (item: any) => {
    // Если есть модификаторы, показываем модальное окно
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedMenuItem(item)
      setShowItemModal(true)
    } else {
      // Если нет модификаторов, сразу добавляем в корзину
      addToCart(item.id)
    }
  }

  const updateCartItemQuantity = async (cartItemId: string, newQuantity: number, menuItemId: string) => {
    if (!session) return

    try {
      if (newQuantity === 0) {
        // Удаляем товар из корзины
        const response = await fetch(`/api/cart/items?id=${cartItemId}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          fetchCartCount()
        }
      } else {
        // Обновляем количество
        const response = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        })
        
        if (response.ok) {
          fetchCartCount()
        }
      }
    } catch (error) {
      console.error('Ошибка обновления корзины:', error)
    }
  }

  const increaseQuantity = (menuItemId: string) => {
    const cartItem = cartItems[menuItemId]
    if (cartItem) {
      updateCartItemQuantity(cartItem.cartItemId, cartItem.quantity + 1, menuItemId)
    }
  }

  const decreaseQuantity = (menuItemId: string) => {
    const cartItem = cartItems[menuItemId]
    if (cartItem) {
      updateCartItemQuantity(cartItem.cartItemId, cartItem.quantity - 1, menuItemId)
    }
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className={`flex flex-col min-h-screen relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-50 animate-pulse ${theme === 'dark' ? 'bg-[#ff0000]/10' : 'bg-[#ff0000]/15'}`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-50 animate-pulse delay-1000 ${theme === 'dark' ? 'bg-[#ff0000]/10' : 'bg-[#ff0000]/15'}`}></div>
        <div className={`absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-60 animate-pulse delay-500 ${theme === 'dark' ? 'bg-[#ff0000]/5' : 'bg-[#ff0000]/10'}`}></div>
        
        {/* Decorative Shapes */}
        <div className={`absolute top-40 right-20 w-20 h-20 border-4 rounded-lg rotate-45 animate-spin-slow ${theme === 'dark' ? 'border-[#ff0000]/20' : 'border-[#ff0000]/30'}`}></div>
        <div className={`absolute bottom-40 left-20 w-16 h-16 border-4 rounded-full animate-bounce-slow ${theme === 'dark' ? 'border-[#ff0000]/20' : 'border-[#ff0000]/30'}`}></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 border-b-4 border-[#d62300] ${
        scrolled 
          ? theme === 'dark' 
            ? 'bg-gray-900/95 backdrop-blur-lg shadow-2xl' 
            : 'bg-white/95 backdrop-blur-lg shadow-2xl'
          : theme === 'dark'
            ? 'bg-gray-900 shadow-xl'
            : 'bg-white shadow-xl'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image src="/logo.png" alt="Miss Kurochka" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[#d62300]">{t('header.title')}</h1>
                <p className={`text-xs hidden sm:block ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>{t('header.subtitle')}</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 text-sm font-bold">
            <button onClick={() => scrollToSection('combo')} className={`transition-colors ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`}>{t('header.nav.combo')}</button>
            <button onClick={() => scrollToSection('menu')} className={`transition-colors ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`}>{t('header.nav.menu')}</button>
            <button onClick={() => scrollToSection('contact')} className={`transition-colors ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`}>{t('header.nav.contacts')}</button>
          </nav>

          {/* Branch Selector */}
          {branches.length > 0 && (
            <select
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(e.target.value || null)}
              className={`hidden sm:block px-4 py-2 rounded-lg font-semibold transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-gray-100 text-black border-gray-300'
              } border-2`}
            >
              <option value="">Все филиалы</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher 
            currentLocale={locale}
            onLocaleChange={changeLocale}
            className="hidden sm:block"
          />

          {/* Cart Button */}
          <button
            onClick={() => router.push('/cart')}
            className={`relative p-2 rounded-lg transition-colors hidden sm:block ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d62300] text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="hidden lg:block">
            <UserMenu onAuthClick={() => setShowAuthModal(true)} />
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden ml-2 p-2"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-[#d62300] transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-[#d62300] transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-[#d62300] transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-t-2 py-4 px-6 animate-slide-down ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-red-100'}`}>
            <nav className="flex flex-col gap-4">
              <button onClick={() => scrollToSection('combo')} className={`text-left font-bold transition-colors ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`}>{t('header.nav.combo')}</button>
              <button onClick={() => scrollToSection('menu')} className={`text-left font-bold transition-colors ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`}>{t('header.nav.menu')}</button>
              <button onClick={() => scrollToSection('contact')} className={`text-left font-bold transition-colors ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`}>{t('header.nav.contacts')}</button>
              
              {/* User Menu Mobile */}
              <div className={`pt-2 border-t-2 ${theme === 'dark' ? 'border-gray-700' : 'border-red-100'}`}>
                <UserMenu mobile onAuthClick={() => setShowAuthModal(true)} />
              </div>
              
              {/* Language Switcher */}
              <div className={`pt-2 border-t-2 ${theme === 'dark' ? 'border-gray-700' : 'border-red-100'}`}>
                <LanguageSwitcher 
                  currentLocale={locale}
                  onLocaleChange={changeLocale}
                />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section id="hero" className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden min-h-[600px] flex items-center">
          {/* Background Carousel */}
          <div className="absolute inset-0">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#d62300]/60 to-[#b01e00]/60"></div>
              </div>
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10 z-10">
            <div className="absolute top-10 left-10 w-32 sm:w-40 h-32 sm:h-40 border-4 border-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-24 sm:w-32 h-24 sm:h-32 border-4 border-white rounded-full animate-pulse delay-75"></div>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
          
          <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
            <h2 className="text-4xl sm:text-7xl md:text-8xl font-black mb-6 sm:mb-8 tracking-tight leading-none animate-slide-up" style={{ color: '#ffffffff', textShadow: '4px 4px 8px rgba(114, 114, 114, 0.8)' }}>
              {t('hero.title').split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </h2>
            <p className="text-base sm:text-xl text-white mb-6 sm:mb-10 font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Combo Section */}
        {comboDeals.length > 0 && (
          <section id="combo" className={`py-12 sm:py-20 px-4 sm:px-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6 sm:mb-10">
                <h2 className={`text-3xl sm:text-5xl font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('combo.title')}</h2>
                <div className={`text-xs sm:text-sm hidden md:block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('combo.scrollHint')}</div>
              </div>
              
              <div className="relative">
                <div ref={comboScrollRef} className="flex gap-4 sm:gap-8 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollBehavior: 'auto' }}>
                  {/* Дублируем элементы для бесконечной прокрутки */}
                  {[...comboDeals, ...comboDeals].map((combo, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-80 sm:w-96 group animate-fade-in"
                    style={{ animationDelay: `${(idx % 4) * 100}ms` }}
                  >
                    <div className={`rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(214,35,0,0.3)] transition-all duration-300 hover:-translate-y-2 border-2 h-full flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      {/* Image Container */}
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                        <img
                          src={combo.image}
                          alt={combo.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        
                        {/* ВЫГОДНО Badge - Top Left */}
                        <div className="absolute top-4 left-4 z-10">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#d62300] blur-md opacity-50"></div>
                            <div className="relative bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white px-5 py-2.5 rounded-xl font-black uppercase text-sm shadow-2xl flex items-center gap-2 border-2 border-white/30">
                              <Flame className="w-5 h-5" />
                              <span>{t('combo.badge')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6 sm:p-8 flex flex-col flex-1">
                        <h3 className={`text-2xl sm:text-3xl font-black mb-4 uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{combo.name}</h3>
                        
                        {/* Items List */}
                        <ul className="space-y-2.5 mb-6 flex-1">
                          {combo.items.map((item: string, i: number) => (
                            <li key={i} className={`flex items-center text-sm sm:text-base font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="w-1.5 h-1.5 bg-[#d62300] rounded-full mr-3 flex-shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* Price and Button */}
                        <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100">
                          <div>
                            <div className="text-lg text-gray-400 line-through font-bold mb-1">
                              {combo.oldPrice}
                            </div>
                            <div className="text-4xl sm:text-5xl font-black text-[#d62300] leading-none">
                              {combo.price}
                            </div>
                          </div>
                          <button 
                            onClick={() => addToCart(combo.id)}
                            className="relative group/btn"
                          >
                            <div className="absolute inset-0 bg-[#d62300] rounded-xl blur opacity-50 group-hover/btn:opacity-75 transition"></div>
                            <div className="relative bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base uppercase shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                              {t('combo.button')}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Menu Section */}
        <section id="menu" className={`py-12 sm:py-20 px-4 sm:px-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-red-50 via-white to-red-50'}`}>
          <div className="max-w-7xl mx-auto">
            <h2 className={`text-3xl sm:text-5xl font-black uppercase mb-6 sm:mb-10 text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('menu.title')}</h2>

            {/* Category Pills */}
            {allCategories.length > 0 && (
              <div className={`sticky top-24 sm:top-28 z-40 backdrop-blur-lg py-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-8 sm:mb-12 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'}`}>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                  {allCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 sm:px-10 py-3 sm:py-5 rounded-2xl font-black text-sm sm:text-lg uppercase transition-all ${
                        activeCategory === cat.id
                          ? 'bg-[#d62300] text-white shadow-2xl scale-105'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-white hover:bg-[#d62300] hover:text-white shadow-lg'
                          : 'bg-white text-black hover:bg-[#d62300] hover:text-white shadow-lg'
                      }`}
                    >
                      <span className="hidden sm:inline">{cat.name}</span>
                      <span className="sm:hidden">{cat.name.substring(0, 10)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Grid */}
            {allCategories.length > 0 ? (
              <>
                {/* Проверяем, есть ли активная категория и блюда в ней */}
                {(() => {
                  const currentCategory = allCategories.find(cat => cat.id === activeCategory)
                  const hasItems = currentCategory && currentCategory.items && currentCategory.items.length > 0
                  
                  return hasItems ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                      {currentCategory.items.map((item: any, idx: number) => (
                    <div
                      key={item.id}
                      className={`rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_20px_60px_rgba(214,35,0,0.3)] transition-all duration-300 hover:-translate-y-2 border-2 animate-fade-in cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Image Container */}
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden group">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0].imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400 text-4xl">🍗</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {item.isNew && (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              НОВИНКА
                            </span>
                          )}
                          {item.isFeatured && (
                            <span className="bg-[#d62300] text-white px-3 py-1 rounded-full text-xs font-bold">
                              ХИТ
                            </span>
                          )}
                        </div>
                        
                        {/* Quick Add Button on Hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemClick(item)
                            }}
                            className="bg-white text-[#d62300] px-6 py-3 rounded-xl font-black text-sm uppercase shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                          >
                            {t('menu.addButton') || 'Добавить'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4 sm:p-6">
                        <h3 className={`text-lg sm:text-xl font-black uppercase mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className={`text-xs sm:text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.description}
                          </p>
                        )}
                        
                        {/* Info */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.weightGrams && (
                            <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              {item.weightGrams}г
                            </span>
                          )}
                          {item.calories && (
                            <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              {item.calories} ккал
                            </span>
                          )}
                          {item.spicyLevel && item.spicyLevel > 0 && (
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600">
                              {'🌶️'.repeat(item.spicyLevel)}
                            </span>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="mb-4">
                          <div className="text-2xl sm:text-3xl font-black text-[#d62300]">
                            {item.price} сом
                          </div>
                        </div>
                        
                        {/* Add Button or Quantity Controls */}
                        {cartItems[item.id] ? (
                          // Если товар в корзине - показываем счётчик
                          <div className="flex items-center justify-between bg-gradient-to-r from-[#d62300] to-[#ff0000] rounded-xl p-2 shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                decreaseQuantity(item.id)
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg font-black text-2xl text-white transition-all"
                            >
                              −
                            </button>
                            <span className="font-black text-2xl text-white px-4">
                              {cartItems[item.id].quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                increaseQuantity(item.id)
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg font-black text-2xl text-white transition-all"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          // Если товара нет в корзине - показываем кнопку
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemClick(item)
                            }}
                            className="w-full relative group/btn"
                          >
                            <div className="absolute inset-0 bg-[#d62300] rounded-xl blur opacity-30 group-hover/btn:opacity-50 transition"></div>
                            <div className="relative bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base uppercase shadow-lg hover:shadow-xl transition-all">
                              {t('menu.cartButton') || 'В корзину'}
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    В этой категории пока нет блюд
                  </p>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Попробуйте выбрать другую категорию
                  </p>
                </div>
              )
            })()}
          </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🍴</div>
                <p className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  Меню загружается...
                </p>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Пожалуйста, подождите
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section id="order" className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden min-h-[400px] flex items-center">
          {/* Background Carousel */}
          <div className="absolute inset-0">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image}
                  alt={`Background ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#d62300]/70 to-[#b01e00]/70"></div>
              </div>
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10 z-10">
            <div className="absolute top-10 right-10 w-48 sm:w-64 h-48 sm:h-64 bg-[#ff0000] rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-48 sm:w-64 h-48 sm:h-64 bg-[#ff0000] rounded-full blur-3xl"></div>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-8 sm:mb-10 uppercase leading-tight drop-shadow-2xl">
              {t('cta.title')}
            </h2>
            <a 
              href="tel:+996555123456"
              className="inline-block bg-white text-[#d62300] px-10 sm:px-16 py-5 sm:py-7 rounded-2xl text-xl sm:text-3xl font-black uppercase shadow-2xl hover:scale-105 transition-transform"
            >
              {t('cta.button')}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className={`py-8 sm:py-12 px-4 sm:px-6 border-t-4 border-[#d62300] transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <Image src="/logo.png" alt="Miss Kurochka" width={50} height={50} />
                <h3 className="text-xl sm:text-2xl font-black text-[#d62300]">{t('footer.title')}</h3>
              </div>
            </div>
            
            <div className="text-center">
              <h4 className={`font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('footer.contacts.title')}</h4>
              <p className={`text-base sm:text-lg mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('footer.contacts.phone')}</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('footer.contacts.email')}</p>
            </div>
            
            <div className="text-center md:text-right">
              <h4 className={`font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('footer.hours.title')}</h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('footer.hours.schedule')}</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('footer.hours.delivery')}</p>
            </div>
          </div>
          
          <div className={`border-t-2 pt-6 text-center ${theme === 'dark' ? 'border-gray-700' : 'border-red-100'}`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
      
      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Menu Item Modal */}
      <MenuItemModal 
        item={selectedMenuItem} 
        isOpen={showItemModal} 
        onClose={() => {
          setShowItemModal(false)
          setSelectedMenuItem(null)
        }} 
        onAddToCart={addToCart} 
      />

      {/* Floating Cart Button - Yandex.Eda Style */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_rgba(214,35,0,0.5)] transition-all hover:scale-[1.02] overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                    {cartCount}
                  </div>
                  <span className="font-black text-lg">Корзина</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-2xl">{cartTotal} сом</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
