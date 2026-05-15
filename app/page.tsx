'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UserMenu from '@/components/UserMenu'
import AuthModal from '@/components/AuthModal'
import { useTranslations } from '@/app/i18n/hooks/useTranslations'
import MenuItemModal from '@/components/MenuItemModal'
import { Flame, ChevronRight, Phone, Clock, MapPin, Plus, Minus, Menu as MenuIcon, X } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale, changeLocale, t } = useTranslations('landing')
  const [activeCategory, setActiveCategory] = useState('fried')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const comboScrollRef = useRef<HTMLDivElement>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [comboDeals, setComboDeals] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [menuData, setMenuData] = useState<any>({ regular: [], combo: [], mini_combo: [] })
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [cartItems, setCartItems] = useState<{ [key: string]: { quantity: number; cartItemId: string } }>({})

  // Модалка регистрации при первом входе (только для гостей)
  useEffect(() => {
    if (status === 'unauthenticated') {
      const hasSeenModal = localStorage.getItem('hasSeenAuthModal')
      if (!hasSeenModal) {
        setShowAuthModal(true)
        localStorage.setItem('hasSeenAuthModal', 'true')
      }
    }
  }, [status])

  useEffect(() => {
    fetchCombos()
    fetchBranches()
    fetchMenu()
  }, [])

  useEffect(() => {
    if (selectedBranch) fetchMenu()
  }, [selectedBranch])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      const data = await response.json()
      if (response.ok && data.branches) setBranches(data.branches)
    } catch (error) {
      console.error('Ошибка загрузки филиалов:', error)
    }
  }

  const fetchMenu = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBranch) params.append('branchId', selectedBranch)
      const response = await fetch(`/api/menu?${params}`)
      const data = await response.json()
      if (response.ok) {
        setMenuData(data.grouped)
        const allCats = [...data.grouped.regular, ...data.grouped.combo, ...data.grouped.mini_combo]
        if (allCats.length > 0) {
          const categoryWithItems = allCats.find((cat) => cat.items && cat.items.length > 0)
          if (categoryWithItems) setActiveCategory(categoryWithItems.id)
          else if (allCats.length > 0) setActiveCategory(allCats[0].id)
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
        const formattedCombos = data.combos.map((combo: any) => ({
          id: combo.id,
          name: combo.name,
          items: combo.items,
          price: `${combo.price} сом`,
          oldPrice: combo.oldPrice ? `${combo.oldPrice} сом` : null,
          image: combo.imageUrl,
        }))
        setComboDeals(formattedCombos)
      }
    } catch (error) {
      console.error('Ошибка загрузки комбо:', error)
    }
  }

  const heroImages = [
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1920&q=80',
    'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=1920&q=80',
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1920&q=80',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=1920&q=80',
  ]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5500)
    return () => clearInterval(interval)
  }, [])

  // Авто-прокрутка комбо
  useEffect(() => {
    const scrollContainer = comboScrollRef.current
    if (!scrollContainer || comboDeals.length === 0) return
    let scrollAmount = 0
    const scrollSpeed = 0.4
    const cardWidth = 320 + 20
    const totalCards = comboDeals.length
    const autoScroll = () => {
      if (scrollContainer) {
        scrollAmount += scrollSpeed
        scrollContainer.scrollLeft = scrollAmount
        if (scrollAmount >= cardWidth * totalCards) {
          scrollAmount = 0
          scrollContainer.scrollLeft = 0
        }
      }
    }
    const intervalId = setInterval(autoScroll, 16)
    return () => clearInterval(intervalId)
  }, [comboDeals])

  const allCategories = [...menuData.regular, ...menuData.combo, ...menuData.mini_combo].filter(
    (cat) => cat.items && cat.items.length > 0
  )

  // Популярные блюда для лендинга — только isFeatured, максимум 8
  const FEATURED_LIMIT = 8
  const allItems = [...menuData.regular, ...menuData.combo, ...menuData.mini_combo]
    .flatMap((cat: any) => cat.items ?? [])
  const featuredItems: any[] = allItems.filter((item: any) => item.isFeatured).slice(0, FEATURED_LIMIT)
  // Если featured меньше 8 — добираем обычными
  const popularItems: any[] = featuredItems.length >= FEATURED_LIMIT
    ? featuredItems
    : [
        ...featuredItems,
        ...allItems
          .filter((item: any) => !item.isFeatured)
          .slice(0, FEATURED_LIMIT - featuredItems.length),
      ]

  const addToCart = async (menuItemId?: string, modifiers?: string[], quantity?: number) => {
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
          branchId: selectedBranch,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        const itemsMap: { [key: string]: { quantity: number; cartItemId: string } } = {}
        data.cart?.items?.forEach((item: any) => {
          itemsMap[item.menuItem.id] = { quantity: item.quantity, cartItemId: item.id }
        })
        setCartItems(itemsMap)
      }
    } catch (error) {
      console.error('Ошибка:', error)
    }
  }

  const handleItemClick = (item: any) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedMenuItem(item)
      setShowItemModal(true)
    } else {
      addToCart(item.id)
    }
  }

  const updateCartItemQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!session) return
    try {
      if (newQuantity === 0) {
        const response = await fetch(`/api/cart/items?id=${cartItemId}`, { method: 'DELETE' })
        if (response.ok) {
          const data = await response.json()
          const itemsMap: { [key: string]: { quantity: number; cartItemId: string } } = {}
          data.cart?.items?.forEach((item: any) => {
            itemsMap[item.menuItem.id] = { quantity: item.quantity, cartItemId: item.id }
          })
          setCartItems(itemsMap)
        }
      } else {
        const response = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        })
        if (response.ok) {
          const data = await response.json()
          const itemsMap: { [key: string]: { quantity: number; cartItemId: string } } = {}
          data.cart?.items?.forEach((item: any) => {
            itemsMap[item.menuItem.id] = { quantity: item.quantity, cartItemId: item.id }
          })
          setCartItems(itemsMap)
        }
      }
    } catch (error) {
      console.error('Ошибка обновления корзины:', error)
    }
  }

  const increaseQuantity = (menuItemId: string) => {
    const cartItem = cartItems[menuItemId]
    if (cartItem) updateCartItemQuantity(cartItem.cartItemId, cartItem.quantity + 1)
  }
  const decreaseQuantity = (menuItemId: string) => {
    const cartItem = cartItems[menuItemId]
    if (cartItem) updateCartItemQuantity(cartItem.cartItemId, cartItem.quantity - 1)
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {/* ============ HEADER ============ */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-xl border-b border-[var(--border)]'
            : 'bg-white border-b border-[var(--border)]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 shrink-0"
          >
            <Image
              src="/logo.png"
              alt="Miss Kurochka"
              width={44}
              height={44}
              className="w-10 h-10 sm:w-11 sm:h-11"
            />
            <div className="text-left">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--brand)] leading-none">
                {t('header.title')}
              </h1>
              <p className="text-[11px] text-[var(--fg-subtle)] hidden sm:block mt-0.5">
                {t('header.subtitle')}
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => scrollToSection('combo')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
            >
              {t('header.nav.combo')}
            </button>
            <button
              onClick={() => scrollToSection('menu')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
            >
              {t('header.nav.menu')}
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
            >
              {t('header.nav.contacts')}
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {branches.length > 0 && (
              <select
                value={selectedBranch || ''}
                onChange={(e) => setSelectedBranch(e.target.value || null)}
                className="hidden md:block select max-w-[180px] py-2 text-sm"
              >
                <option value="">Все филиалы</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}

            <LanguageSwitcher
              currentLocale={locale}
              onLocaleChange={changeLocale}
              className="hidden sm:block"
            />

            <div className="hidden lg:block">
              <UserMenu onAuthClick={() => setShowAuthModal(true)} />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-muted)] transition"
              aria-label="Меню"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[var(--fg)]" />
              ) : (
                <MenuIcon className="w-5 h-5 text-[var(--fg)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border)] bg-white animate-slide-down">
            <nav className="flex flex-col gap-1 px-4 py-4">
              <button
                onClick={() => scrollToSection('combo')}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
              >
                {t('header.nav.combo')}
              </button>
              <button
                onClick={() => scrollToSection('menu')}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
              >
                {t('header.nav.menu')}
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
              >
                {t('header.nav.contacts')}
              </button>

              <div className="divider my-2" />
              <UserMenu mobile onAuthClick={() => setShowAuthModal(true)} />

              <div className="divider my-2" />
              <LanguageSwitcher currentLocale={locale} onLocaleChange={changeLocale} />
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section
          id="hero"
          className="relative overflow-hidden min-h-[480px] sm:min-h-[560px] flex items-center"
        >
          <div className="absolute inset-0">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/40 to-[var(--brand)]/55" />
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-6' : 'bg-white/50 w-1.5 hover:bg-white/80'
                }`}
                aria-label={`Слайд ${index + 1}`}
              />
            ))}
          </div>

          <div className="container-page relative z-10 w-full py-20">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold mb-5">
                <Flame className="w-3.5 h-3.5" />
                {t('combo.badge')}
              </span>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-4 animate-slide-up">
                {t('hero.title').split('\n').map((line, i) => (
                  <span key={i} className="block text-white">
                    {line}
                  </span>
                ))}
              </h2>
              <p className="text-base sm:text-lg text-white/90 mb-8 max-w-lg">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => scrollToSection('menu')}
                  className="btn btn-primary btn-lg"
                >
                  {t('header.nav.menu')}
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('combo')}
                  className="btn btn-lg bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                >
                  {t('header.nav.combo')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ COMBO ============ */}
        {comboDeals.length > 0 && (
          <section id="combo" className="py-14 sm:py-20">
            <div className="container-page">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="badge badge-brand mb-3">
                    <Flame className="w-3 h-3" />
                    {t('combo.badge')}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    {t('combo.title')}
                  </h2>
                </div>
                <p className="text-xs text-[var(--fg-subtle)] hidden md:block">
                  {t('combo.scrollHint')}
                </p>
              </div>

              <div
                ref={comboScrollRef}
                className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
                style={{ scrollBehavior: 'auto' }}
              >
                {[...comboDeals, ...comboDeals].map((combo, idx) => (
                  <article
                    key={idx}
                    className="card card-hover flex-shrink-0 w-[300px] overflow-hidden flex flex-col animate-fade-in"
                    style={{ animationDelay: `${(idx % 4) * 80}ms` }}
                  >
                    <div className="aspect-square relative overflow-hidden bg-[var(--bg-muted)]">
                      <img
                        src={combo.image}
                        alt={combo.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 badge badge-brand">
                        <Flame className="w-3 h-3" />
                        {t('combo.badge')}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-extrabold mb-3 leading-tight">{combo.name}</h3>
                      <ul className="space-y-1.5 mb-5 flex-1">
                        {combo.items.map((item: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-center text-sm text-[var(--fg-muted)]"
                          >
                            <span className="w-1 h-1 bg-[var(--brand)] rounded-full mr-2.5 flex-shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-end justify-between pt-4 border-t border-[var(--border)]">
                        <div>
                          {combo.oldPrice && (
                            <div className="text-xs text-[var(--fg-subtle)] line-through font-semibold">
                              {combo.oldPrice}
                            </div>
                          )}
                          <div className="text-2xl font-extrabold text-[var(--brand)] leading-none mt-1">
                            {combo.price}
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(combo.id)}
                          className="btn btn-primary btn-sm"
                        >
                          {t('combo.button')}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============ MENU ============ */}
        <section id="menu" className="py-14 sm:py-20 bg-[var(--bg-muted)]">
          <div className="container-page">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="badge badge-brand mb-3">
                  <Flame className="w-3 h-3" />
                  Популярное
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {t('menu.title')}
                </h2>
              </div>
              <p className="text-xs text-[var(--fg-subtle)] hidden sm:block">
                Самые любимые блюда наших гостей
              </p>
            </div>

            {popularItems.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {popularItems.map((item: any, idx: number) => (
                  <article
                    key={item.id}
                    className="card card-hover overflow-hidden flex flex-col animate-fade-in cursor-pointer group"
                    style={{ animationDelay: `${idx * 40}ms` }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-[var(--bg-muted)]">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--fg-subtle)]">
                          🍗
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                        {item.isNew && <span className="badge badge-success">Новинка</span>}
                        {item.isFeatured && <span className="badge badge-brand">Хит</span>}
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <h3 className="text-sm sm:text-base font-extrabold leading-tight mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-[var(--fg-subtle)] mb-3 line-clamp-2 hidden sm:block">
                          {item.description}
                        </p>
                      )}
                      {(item.weightGrams || item.calories) && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.weightGrams && (
                            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--fg-subtle)] font-semibold">
                              {item.weightGrams}г
                            </span>
                          )}
                          {item.calories && (
                            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--fg-subtle)] font-semibold">
                              {item.calories} ккал
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="text-lg sm:text-xl font-extrabold text-[var(--fg)]">
                          {item.price} <span className="text-xs font-bold text-[var(--fg-muted)]">сом</span>
                        </div>
                        {cartItems[item.id] ? (
                          <div className="flex items-center gap-1 bg-[var(--brand)] rounded-lg p-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); decreaseQuantity(item.id) }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/15 rounded-md transition"
                              aria-label="Уменьшить"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-sm text-white min-w-[18px] text-center">
                              {cartItems[item.id].quantity}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); increaseQuantity(item.id) }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/15 rounded-md transition"
                              aria-label="Увеличить"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleItemClick(item) }}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                            aria-label="Добавить"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon="🍴" title="Меню загружается..." subtitle="Пожалуйста, подождите" />
            )}
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section
          id="order"
          className="relative overflow-hidden py-20 sm:py-28 flex items-center"
        >
          <div className="absolute inset-0">
            <img
              src={heroImages[currentSlide]}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/85 to-[var(--brand-dark)]/90" />
          </div>

          <div className="container-page relative z-10 text-center">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight max-w-2xl mx-auto">
              {t('cta.title')}
            </h2>
            <a
              href="tel:+996555123456"
              className="btn btn-lg bg-white text-[var(--brand)] hover:bg-white/95 inline-flex"
            >
              <Phone className="w-4 h-4" />
              {t('cta.button')}
            </a>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="border-t border-[var(--border)] bg-white py-12">
        <div className="container-page">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Image src="/logo.png" alt="Miss Kurochka" width={36} height={36} />
                <h3 className="text-base font-extrabold text-[var(--brand)]">{t('footer.title')}</h3>
              </div>
              <p className="text-sm text-[var(--fg-subtle)]">{t('header.subtitle')}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
                {t('footer.contacts.title')}
              </h4>
              <a
                href="tel:+996555123456"
                className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)] hover:text-[var(--brand)] transition mb-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                {t('footer.contacts.phone')}
              </a>
              <p className="text-sm text-[var(--fg-muted)]">{t('footer.contacts.email')}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
                {t('footer.hours.title')}
              </h4>
              <p className="flex items-center gap-2 text-sm text-[var(--fg-muted)] mb-1.5">
                <Clock className="w-3.5 h-3.5" />
                {t('footer.hours.schedule')}
              </p>
              <p className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                <MapPin className="w-3.5 h-3.5" />
                {t('footer.hours.delivery')}
              </p>
            </div>
          </div>

          <div className="divider mb-6" />
          <p className="text-xs text-center text-[var(--fg-subtle)]">{t('footer.copyright')}</p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <MenuItemModal
        item={selectedMenuItem}
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false)
          setSelectedMenuItem(null)
        }}
        onAddToCart={addToCart}
      />

      {/* Floating cart убран — будет на отдельной странице меню */}
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-lg font-bold text-[var(--fg)] mb-1">{title}</p>
      <p className="text-sm text-[var(--fg-muted)]">{subtitle}</p>
    </div>
  )
}
