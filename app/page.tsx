'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UserMenu from '@/components/UserMenu'
import AuthModal from '@/components/AuthModal'
import NewsletterModal from '@/components/NewsletterModal'
import { useTranslations } from '@/app/i18n/hooks/useTranslations'
import MenuItemModal from '@/components/MenuItemModal'
import MobileHome from '@/components/mobile/MobileHome'
import BranchClosedModal from '@/components/BranchClosedModal'
import {
  Flame, ChevronRight, Phone, MapPin, Plus, Minus,
  Menu as MenuIcon, X, Sparkles, Truck, Award, Heart,
  ShieldCheck, Timer, Star, MessageCircle, Mail,
} from 'lucide-react'

interface LandingMenuItem {
  id: string
  name: string
  description?: string | null
  isNew?: boolean
  isFeatured?: boolean
  modifiers?: unknown[]
  spices?: unknown[]
  sizes?: { id: string; price: number; weightGrams?: number | null }[]
  images?: { imageUrl: string; isPrimary?: boolean }[]
}

interface LandingCombo {
  id: string
  name: string
  description?: string | null
  items: string[]
  price: number
  oldPrice?: number | null
  image?: string | null
  type?: 'regular' | 'mini'
}

interface LandingBranch {
  id: string
  name: string
  address?: string
  phone?: string
}

function cleanAddress(address: string): string {
  return address
    .replace(/,?\s*\d{6}/g, '')
    .replace(/,?\s*(Киргизия|Кыргызстан|Kyrgyzstan|KG)\s*$/i, '')
    .trim()
    .replace(/,\s*$/, '')
    .trim()
}

interface CartApiItem {
  id: string
  quantity: number
  menuItem?: { id: string; price?: number | string } | null
  comboOffer?: { id: string; price?: number | string } | null
}

interface CartApiResponse {
  items?: CartApiItem[]
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale, changeLocale, t } = useTranslations('landing')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const comboScrollRef = useRef<HTMLDivElement>(null)
  const comboDragging = useRef(false)
  const comboDragStartX = useRef(0)
  const comboDragScrollLeft = useRef(0)
  const comboPaused = useRef(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showNewsletterModal, setShowNewsletterModal] = useState(false)
  const [comboDeals, setComboDeals] = useState<LandingCombo[]>([])
  const [miniComboDeals, setMiniComboDeals] = useState<LandingCombo[]>([])
  const [popularItems, setPopularItems] = useState<LandingMenuItem[]>([])
  const [branches, setBranches] = useState<LandingBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [nearestBranchDetected, setNearestBranchDetected] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<LandingMenuItem | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [cartItems, setCartItems] = useState<{ [key: string]: { quantity: number; cartItemId: string } }>({})
  const [comboItems, setComboItems] = useState<{ [key: string]: { quantity: number; cartItemId: string } }>({})
  const [mobileCartTotal, setMobileCartTotal] = useState(0)
  const [selectedCombo, setSelectedCombo] = useState<LandingCombo | null>(null)

  const syncCart = (cartData: CartApiResponse | null | undefined) => {
    const itemsMap: { [key: string]: { quantity: number; cartItemId: string } } = {}
    const combosMap: { [key: string]: { quantity: number; cartItemId: string } } = {}
    let total = 0
    cartData?.items?.forEach((item) => {
      if (item.menuItem) {
        itemsMap[item.menuItem.id] = { quantity: item.quantity, cartItemId: item.id }
        total += Number(item.menuItem.price ?? 0) * item.quantity
      } else if (item.comboOffer) {
        combosMap[item.comboOffer.id] = { quantity: item.quantity, cartItemId: item.id }
        total += Number(item.comboOffer.price ?? 0) * item.quantity
      }
    })
    setCartItems(itemsMap)
    setComboItems(combosMap)
    setMobileCartTotal(total)
  }

  // Модалка регистрации при первом входе (только для гостей)
  useEffect(() => {
    if (status !== 'unauthenticated') return
    const hasSeenModal = localStorage.getItem('hasSeenAuthModal')
    if (hasSeenModal) return
    Promise.resolve().then(() => {
      setShowAuthModal(true)
      localStorage.setItem('hasSeenAuthModal', 'true')
    })
  }, [status])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      const data = await response.json()
      if (response.ok && data.branches) setBranches(data.branches)
    } catch {}
  }

  const fetchPopular = async (branchId?: string | null) => {
    try {
      const bid = branchId ?? (typeof window !== 'undefined' ? localStorage.getItem('selectedBranchId') : null)
      const qs = bid ? `&branchId=${bid}` : ''
      const response = await fetch(`/api/menu/popular?limit=6${qs}`)
      const data = await response.json()
      if (response.ok && data.items) setPopularItems(data.items)
    } catch {}
  }

  const fetchCombos = async () => {
    try {
      const response = await fetch('/api/combo-offers')
      const data = await response.json()
      if (response.ok && data.combos) {
        const formattedCombos = data.combos.map((combo: {
          id: string
          name: string
          description?: string | null
          items: string[]
          price: number | string
          oldPrice?: number | string | null
          imageUrl?: string | null
        }) => ({
          id: combo.id,
          name: combo.name,
          description: combo.description,
          items: combo.items,
          price: Number(combo.price),
          oldPrice: combo.oldPrice ? Number(combo.oldPrice) : null,
          image: combo.imageUrl ?? null,
        }))
        setComboDeals(formattedCombos)
      }
    } catch {}
  }

  const fetchMiniCombos = async () => {
    try {
      const response = await fetch('/api/mini-combos')
      const data = await response.json()
      if (response.ok && data.combos) {
        const formattedMiniCombos = data.combos.map((combo: {
          id: string
          name: string
          description?: string | null
          items: string[]
          price: number | string
          oldPrice?: number | string | null
          imageUrl?: string | null
        }) => ({
          id: combo.id,
          name: combo.name,
          description: combo.description,
          items: combo.items,
          price: Number(combo.price),
          oldPrice: combo.oldPrice ? Number(combo.oldPrice) : null,
          image: combo.imageUrl ?? null,
        }))
        setMiniComboDeals(formattedMiniCombos)
      }
    } catch {}
  }

  const detectNearestBranch = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/branches/nearest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          })
          const data = await res.json()
          if (res.ok && data.branch?.id) {
            // Обновляем филиал, меню перезагрузится через эффект на selectedBranch
            setSelectedBranch(data.branch.id)
            setNearestBranchDetected(true)
          }
        } catch {}
      },
      // Если пользователь запретил геолокацию — молча оставляем ручной выбор
      () => {},
      { timeout: 5000, maximumAge: 300000 }
    )
  }

  // Определяет филиал при загрузке страницы.
  // - Если доступ к геолокации уже выдан ранее (granted) — переопределяем
  //   ближайший филиал при каждом открытии (для всех пользователей).
  // - Если разрешение ещё не запрашивалось (prompt) и сохранённого филиала нет —
  //   запрашиваем геолокацию.
  // - Если запрещено (denied) — ничего не делаем, остаётся ручной выбор.
  const initBranchSelection = async () => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem('selectedBranchId')
    } catch {}

    if (saved) setSelectedBranch(saved)

    // Пытаемся узнать состояние разрешения через Permissions API (если есть)
    let permission: PermissionState | null = null
    try {
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        permission = status.state
      }
    } catch {}

    if (permission === 'granted') {
      // Доступ уже есть — всегда переопределяем ближайший филиал
      detectNearestBranch()
    } else if (permission === 'denied') {
      // Запрещено — ручной выбор, ничего не запрашиваем
    } else {
      // 'prompt' или Permissions API недоступен — определяем только если
      // филиал ещё не выбран, чтобы не дёргать пользователя лишний раз
      if (!saved) detectNearestBranch()
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      initBranchSelection()
      fetchCombos()
      fetchMiniCombos()
      fetchBranches()
      fetchPopular()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      localStorage.setItem('selectedBranchId', selectedBranch)
      // Перезагружаем популярные блюда под выбранный/определённый филиал,
      // чтобы учесть стоп-лист и индивидуальные блюда филиала.
      fetchPopular(selectedBranch)
    }
  }, [selectedBranch])

  useEffect(() => {
    if (!session) {
      // Сбрасываем корзину асинхронно, чтобы избежать react-hooks/set-state-in-effect
      Promise.resolve().then(() => {
        setCartItems({})
        setComboItems({})
        setMobileCartTotal(0)
      })
      return
    }
    let cancelled = false
    fetch('/api/cart')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.cart) syncCart(data.cart)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session])

  const heroImages = [
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1920&q=80',
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=1920&q=80',
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1920&q=80',
  ]

  const [dbBanners, setDbBanners] = useState<{ id: string; title: string; subtitle: string | null; imageUrl: string; linkTarget: string | null }[]>([])

  useEffect(() => {
    fetch('/api/banners')
      .then(r => r.json())
      .then(data => { if (data.banners?.length > 0) setDbBanners(data.banners) })
      .catch(() => {})
  }, [])

  const slides = dbBanners.length > 0
    ? dbBanners.map(b => ({ image: b.imageUrl, title: b.title, subtitle: b.subtitle, link: b.linkTarget }))
    : heroImages.map(img => ({ image: img, title: null, subtitle: null, link: null }))

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5500)
    return () => clearInterval(interval)
  }, [slides.length])

  // Авто-прокрутка комбо
  useEffect(() => {
    const scrollContainer = comboScrollRef.current
    if (!scrollContainer || comboDeals.length === 0) return
    let scrollAmount = scrollContainer.scrollLeft
    const scrollSpeed = 0.5
    const cardWidth = 320

    const autoScroll = () => {
      if (!comboPaused.current && scrollContainer && !comboDragging.current) {
        scrollAmount += scrollSpeed
        if (scrollAmount >= cardWidth * comboDeals.length) {
          scrollAmount = 0
          scrollContainer.scrollLeft = 0
        } else {
          scrollContainer.scrollLeft = scrollAmount
        }
      } else {
        scrollAmount = scrollContainer?.scrollLeft ?? 0
      }
    }
    const intervalId = setInterval(autoScroll, 16)
    return () => clearInterval(intervalId)
  }, [comboDeals])

  const addToCart = async (menuItemId?: string, modifiers?: string[], quantity?: number, sizeId?: string | null, spices?: string[]) => {
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
          spices: spices || [],
          sizeId: sizeId ?? null,
          branchId: selectedBranch,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        syncCart(data.cart)
      }
    } catch {}
  }

  const addComboToCart = async (comboOfferId: string, quantity: number = 1) => {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comboOfferId, quantity, branchId: selectedBranch }),
      })
      const data = await response.json()
      if (response.ok) syncCart(data.cart)
    } catch {}
  }

  const handleItemClick = (item: LandingMenuItem) => {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    const hasModifiers = item.modifiers && item.modifiers.length > 0
    const hasSpices = item.spices && item.spices.length > 0
    const hasSizes = item.sizes && item.sizes.length > 0
    if (hasModifiers || hasSpices || hasSizes) {
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
          syncCart(data.cart)
        }
      } else {
        const response = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        })
        if (response.ok) {
          const data = await response.json()
          syncCart(data.cart)
        }
      }
    } catch {}
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

  // Блюдо дня — самое популярное
  const dishOfTheDay = popularItems[0] ?? null

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {/* MOBILE LAYOUT */}
      <div className="md:hidden">
        <MobileHome
          branches={branches}
          selectedBranch={selectedBranch}
          slides={slides}
          categories={[]}
          activeCategory="all"
          items={popularItems}
          combos={comboDeals}
          miniCombos={miniComboDeals}
          cartItems={cartItems}
          comboItems={comboItems}
          cartCount={Object.values(cartItems).reduce((s, c) => s + c.quantity, 0)
            + Object.values(comboItems).reduce((s, c) => s + c.quantity, 0)}
          cartTotal={mobileCartTotal}
          onBranchChange={(id) => setSelectedBranch(id)}
          onCategoryChange={() => {}}
          onItemClick={handleItemClick}
          onAddItem={handleItemClick}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onAuthClick={() => setShowAuthModal(true)}
          onComboClick={(combo: LandingCombo) => setSelectedCombo(combo)}
          onAddCombo={(id: string) => addComboToCart(id)}
          onRemoveCombo={(cartItemId: string, qty: number) => updateCartItemQuantity(cartItemId, qty)}
        />
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex md:flex-col md:flex-1">
        {/* HEADER */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-white/90 backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 shrink-0"
            >
              <Image src="/logo.png" alt="Miss Kurochka" width={44} height={44} className="w-10 h-10 sm:w-11 sm:h-11" />
              <div className="text-left">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--brand)] leading-none">
                  {t('header.title')}
                </h1>
                <p className={`text-[11px] hidden sm:block mt-0.5 transition-colors ${scrolled ? 'text-[var(--fg-subtle)]' : 'text-white/85'}`}>
                  {t('header.subtitle')}
                </p>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-1">
              {[
                { id: 'combo', label: t('header.nav.combo') },
                { id: 'popular', label: 'Популярное' },
                { id: 'about', label: 'О нас' },
                { id: 'contact', label: t('header.nav.contacts') },
              ].map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    scrolled
                      ? 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)]'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {/* 1. Кнопка "Все филиалы" - белый фон, черный текст, иконка геолокации, стрелка */}
              {branches.length > 0 && (
                <div className="relative">
                  {nearestBranchDetected && selectedBranch && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 z-10" />
                  )}
                  <button
                    onClick={() => {
                      // Логика выбора филиала (можно добавить dropdown)
                      const nextIndex = selectedBranch 
                        ? (branches.findIndex(b => b.id === selectedBranch) + 1) % branches.length
                        : 0;
                      setSelectedBranch(branches[nextIndex]?.id || null);
                      setNearestBranchDetected(false);
                    }}
                    className="flex items-center gap-2.5 px-5 bg-white text-black rounded-[18px] font-bold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
                    style={{
                      height: '52px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <MapPin className="w-4.5 h-4.5" style={{ strokeWidth: 2.5 }} />
                    <span className="max-w-[140px] truncate">
                      {selectedBranch 
                        ? branches.find(b => b.id === selectedBranch)?.name || 'Все филиалы'
                        : 'Все филиалы'}
                    </span>
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}

              {/* 2. Кнопка переключения языка - Glassmorphism */}
              <button
                onClick={() => {
                  const locales = ['ru', 'kg'] as const;
                  const currentIndex = locales.indexOf(locale);
                  const nextLocale = locales[(currentIndex + 1) % locales.length];
                  changeLocale(nextLocale);
                }}
                className="flex items-center gap-2 px-4 font-bold text-sm text-white transition-all hover:bg-white/20 active:scale-[0.98]"
                style={{
                  height: '52px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <span className="uppercase tracking-wider">
                  {locale === 'ru' ? 'RU' : locale === 'kg' ? 'КГ' : 'EN'}
                </span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 3. Кнопка "Войти" - красно-оранжевый градиент */}
              {session ? (
                <div className="hidden lg:block">
                  <UserMenu onAuthClick={() => setShowAuthModal(true)} />
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden lg:flex items-center gap-2.5 px-5 text-white font-bold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{
                    height: '52px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #ff4d00 0%, #d62300 100%)',
                    boxShadow: '0 6px 20px rgba(214, 35, 0, 0.3)',
                  }}
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Войти
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition ${
                  scrolled ? 'hover:bg-[var(--bg-muted)] text-[var(--fg)]' : 'hover:bg-white/10 text-white'
                }`}
                aria-label="Меню"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-[var(--border)] bg-white animate-slide-down">
              <nav className="flex flex-col gap-1 px-4 py-4">
                {[
                  { id: 'combo', label: t('header.nav.combo') },
                  { id: 'popular', label: 'Популярное' },
                  { id: 'about', label: 'О нас' },
                  { id: 'contact', label: t('header.nav.contacts') },
                ].map(link => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="divider my-2" />
                <UserMenu mobile onAuthClick={() => setShowAuthModal(true)} />
                <div className="divider my-2" />
                <LanguageSwitcher currentLocale={locale} onLocaleChange={changeLocale} />
              </nav>
            </div>
          )}
        </header>

        <main className="flex-1">
          {/* HERO */}
          <section
            id="hero"
            className="relative overflow-hidden min-h-[640px] flex items-center"
          >
            <div className="absolute inset-0">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img src={slide.image} alt={slide.title ?? ''} className="w-full h-full object-cover scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-dark)]/40 via-transparent to-transparent" />
                </div>
              ))}
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-8' : 'bg-white/40 w-1.5 hover:bg-white/60'
                  }`}
                  aria-label={`Слайд ${index + 1}`}
                />
              ))}
            </div>

            <div className="container-page relative z-10 w-full pt-32 pb-16">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs font-bold mb-6 animate-fade-in">
                  <Sparkles className="w-3.5 h-3.5" />
                  Самая вкусная курочка в городе
                </span>
                <h1 className="text-5xl sm:text-7xl font-black text-white leading-[1.02] tracking-tight mb-5 animate-slide-up">
                  <span className="block">Мисс Курочка</span>
                  {t('hero.title').split('\n').slice(1).map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </h1>
                <p className="text-base sm:text-lg text-white/85 mb-8 max-w-lg leading-relaxed">
                  {t('hero.subtitle')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => scrollToSection('popular')}
                    className="btn btn-primary btn-lg shadow-[var(--shadow-brand)]"
                  >
                    Заказать сейчас
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollToSection('combo')}
                    className="btn btn-lg bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                  >
                    Посмотреть комбо
                  </button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 sm:gap-10 mt-12">
                  {[
                    { value: '30 мин', label: 'Доставка' },
                    { value: '15+', label: 'Блюд в меню' },
                    { value: '4.9 ★', label: 'Рейтинг' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl sm:text-3xl font-black text-white leading-none">{stat.value}</p>
                      <p className="text-xs text-white/70 font-semibold mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="py-12 border-b border-[var(--border)] bg-white">
            <div className="container-page">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Timer, title: 'Быстро', text: 'Доставка за 30 минут' },
                  { icon: Award, title: 'Свежее', text: 'Готовим из свежих продуктов' },
                  { icon: ShieldCheck, title: 'Безопасно', text: 'Контроль качества' },
                  { icon: Heart, title: 'С душой', text: 'Каждое блюдо с любовью' },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-muted)] transition"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{f.title}</p>
                      <p className="text-xs text-[var(--fg-muted)] leading-snug">{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DISH OF THE DAY */}
          {dishOfTheDay && (
            <section className="py-16 sm:py-20 bg-gradient-to-br from-[var(--brand-soft)] via-white to-[var(--brand-tint)] relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--brand)]/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[var(--brand)]/10 blur-3xl" />

              <div className="container-page relative z-10">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
                  <div className="order-2 md:order-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand)] text-white text-xs font-extrabold uppercase tracking-wider mb-4 animate-pulse-soft">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Товар дня
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 leading-tight">
                      {dishOfTheDay.name}
                    </h2>
                    {dishOfTheDay.description && (
                      <p className="text-base text-[var(--fg-muted)] mb-6 leading-relaxed max-w-md">
                        {dishOfTheDay.description}
                      </p>
                    )}
                    <div className="flex items-baseline gap-3 mb-6">
                      <span className="text-4xl sm:text-5xl font-black text-[var(--brand)]">
                        {dishOfTheDay.sizes?.[0]?.price ?? '—'}
                      </span>
                      <span className="text-lg font-bold text-[var(--fg-muted)]">сом</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleItemClick(dishOfTheDay)}
                        className="btn btn-primary btn-lg shadow-[var(--shadow-brand)]"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить в корзину
                      </button>
                      <button
                        onClick={() => scrollToSection('popular')}
                        className="btn btn-secondary btn-lg"
                      >
                        Все хиты
                      </button>
                    </div>
                  </div>

                  <div className="order-1 md:order-2 relative">
                    <div className="aspect-square max-w-md mx-auto relative">
                      {dishOfTheDay.images?.[0]?.imageUrl ? (
                        <>
                          <div className="absolute inset-0 bg-[var(--brand)]/20 rounded-full blur-3xl scale-90 animate-pulse-soft" />
                          <img
                            src={dishOfTheDay.images[0].imageUrl}
                            alt={dishOfTheDay.name}
                            className="relative w-full h-full object-cover rounded-3xl shadow-2xl"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-9xl">🍗</div>
                      )}
                      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white shadow-lg flex flex-col items-center justify-center rotate-12">
                        <Flame className="w-6 h-6 text-[var(--brand)]" />
                        <span className="text-[10px] font-extrabold text-[var(--brand)] mt-0.5">ХИТ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* COMBO CAROUSEL */}
          {comboDeals.length > 0 && (
            <section id="combo" className="py-12 sm:py-20 bg-white">
              <div className="container-page">
                <div className="flex items-end justify-between mb-6 sm:mb-8 flex-wrap gap-3">
                  <div>
                    <span className="badge badge-brand mb-3">
                      <Flame className="w-3 h-3" />
                      Выгодные комбо
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight">
                      {t('combo.title')}
                    </h2>
                    <p className="text-sm text-[var(--fg-muted)] mt-2 max-w-md">
                      Сэкономьте до 30% — вкусные наборы на любой случай
                    </p>
                  </div>
                  <p className="text-xs text-[var(--fg-subtle)] hidden md:block">
                    💡 Перетащите чтобы посмотреть больше
                  </p>
                </div>

                {/* Десктопная версия карусели */}
                <div
                  ref={comboScrollRef}
                  className="hidden md:flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 cursor-grab active:cursor-grabbing select-none"
                  style={{ scrollBehavior: 'auto' }}
                  onMouseEnter={() => { comboPaused.current = true }}
                  onMouseLeave={() => {
                    comboPaused.current = false
                    comboDragging.current = false
                  }}
                  onMouseDown={(e) => {
                    comboDragging.current = true
                    comboPaused.current = true
                    comboDragStartX.current = e.pageX - (comboScrollRef.current?.offsetLeft ?? 0)
                    comboDragScrollLeft.current = comboScrollRef.current?.scrollLeft ?? 0
                  }}
                  onMouseMove={(e) => {
                    if (!comboDragging.current || !comboScrollRef.current) return
                    e.preventDefault()
                    const x = e.pageX - (comboScrollRef.current.offsetLeft ?? 0)
                    const walk = (x - comboDragStartX.current) * 1.5
                    comboScrollRef.current.scrollLeft = comboDragScrollLeft.current - walk
                  }}
                  onMouseUp={() => { comboDragging.current = false }}
                  onTouchStart={() => { comboPaused.current = true }}
                  onTouchEnd={() => { setTimeout(() => { comboPaused.current = false }, 2000) }}
                >
                  {[...comboDeals, ...comboDeals].map((combo, idx) => {
                    const cartRef = comboItems[combo.id]
                    const qty = cartRef?.quantity ?? 0
                    const discount = combo.oldPrice ? Math.round((1 - combo.price / combo.oldPrice) * 100) : 0

                    return (
                      <article
                        key={idx}
                        className="group flex-shrink-0 w-[300px] bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--brand)]/30 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        <div
                          className="aspect-square relative overflow-hidden bg-[var(--bg-muted)] cursor-pointer"
                          onClick={() => setSelectedCombo(combo)}
                        >
                          {combo.image ? (
                            <img
                              src={combo.image}
                              alt={combo.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">🍗</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand)] text-white text-[11px] font-extrabold">
                            <Flame className="w-3 h-3" />
                            Комбо
                          </span>
                          {discount > 0 && (
                            <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-amber-400 text-amber-900 text-xs font-extrabold">
                              −{discount}%
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3
                            className="text-base font-extrabold mb-2 leading-tight cursor-pointer hover:text-[var(--brand)] transition-colors line-clamp-1"
                            onClick={() => setSelectedCombo(combo)}
                          >
                            {combo.name}
                          </h3>

                          <ul className="space-y-1 mb-4 flex-1">
                            {combo.items.slice(0, 3).map((item: string, i: number) => (
                              <li key={i} className="flex items-center text-xs text-[var(--fg-muted)]">
                                <span className="w-1 h-1 bg-[var(--brand)] rounded-full mr-2 flex-shrink-0" />
                                <span className="truncate">{item}</span>
                              </li>
                            ))}
                            {combo.items.length > 3 && (
                              <li
                                className="text-xs text-[var(--brand)] font-semibold cursor-pointer"
                                onClick={() => setSelectedCombo(combo)}
                              >
                                +{combo.items.length - 3} ещё...
                              </li>
                            )}
                          </ul>

                          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                            <div>
                              {combo.oldPrice && (
                                <div className="text-xs text-[var(--fg-subtle)] line-through font-semibold">
                                  {combo.oldPrice} сом
                                </div>
                              )}
                              <div className="text-xl font-black text-[var(--brand)] leading-none">
                                {combo.price} <span className="text-xs font-bold text-[var(--fg-muted)]">сом</span>
                              </div>
                            </div>

                            {qty > 0 ? (
                              <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
                                <button
                                  onClick={() => cartRef && updateCartItemQuantity(cartRef.cartItemId, qty - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-sm text-white min-w-[20px] text-center">{qty}</span>
                                <button
                                  onClick={() => addComboToCart(combo.id)}
                                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addComboToCart(combo.id)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition shadow-sm"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* MINI COMBO */}
          {miniComboDeals.length > 0 && (
            <section id="mini-combo" className="py-16 sm:py-20 bg-white">
              <div className="container-page">
                <div className="flex items-end justify-between mb-6 sm:mb-8 flex-wrap gap-3">
                  <div>
                    <span className="badge badge-brand mb-3">
                      <Sparkles className="w-3 h-3" />
                      Мини-комбо
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight">
                      Быстрые перекусы
                    </h2>
                    <p className="text-sm text-[var(--fg-muted)] mt-2 max-w-md">
                      Идеально для одного — вкусно и экономно
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {miniComboDeals.map((combo) => {
                    const cartRef = comboItems[combo.id]
                    const qty = cartRef?.quantity ?? 0
                    const discount = combo.oldPrice ? Math.round((1 - combo.price / combo.oldPrice) * 100) : 0

                    return (
                      <article
                        key={combo.id}
                        className="group bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--brand)]/30 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                      >
                        <div
                          className="aspect-square relative overflow-hidden bg-[var(--bg-muted)] cursor-pointer"
                          onClick={() => setSelectedCombo(combo)}
                        >
                          {combo.image ? (
                            <img
                              src={combo.image}
                              alt={combo.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">🍗</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand)] text-white text-[11px] font-extrabold">
                            <Sparkles className="w-3 h-3" />
                            Мини
                          </span>
                          {discount > 0 && (
                            <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-amber-400 text-amber-900 text-xs font-extrabold">
                              −{discount}%
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3
                            className="text-base font-extrabold mb-2 leading-tight cursor-pointer hover:text-[var(--brand)] transition-colors line-clamp-1"
                            onClick={() => setSelectedCombo(combo)}
                          >
                            {combo.name}
                          </h3>

                          <ul className="space-y-1 mb-4 flex-1">
                            {combo.items.slice(0, 3).map((item: string, i: number) => (
                              <li key={i} className="flex items-center text-xs text-[var(--fg-muted)]">
                                <span className="w-1 h-1 bg-[var(--brand)] rounded-full mr-2 flex-shrink-0" />
                                <span className="truncate">{item}</span>
                              </li>
                            ))}
                            {combo.items.length > 3 && (
                              <li
                                className="text-xs text-[var(--brand)] font-semibold cursor-pointer"
                                onClick={() => setSelectedCombo(combo)}
                              >
                                +{combo.items.length - 3} ещё...
                              </li>
                            )}
                          </ul>

                          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                            <div>
                              {combo.oldPrice && (
                                <div className="text-xs text-[var(--fg-subtle)] line-through font-semibold">
                                  {combo.oldPrice} сом
                                </div>
                              )}
                              <div className="text-xl font-black text-[var(--brand)] leading-none">
                                {combo.price} <span className="text-xs font-bold text-[var(--fg-muted)]">сом</span>
                              </div>
                            </div>

                            {qty > 0 ? (
                              <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
                                <button
                                  onClick={() => cartRef && updateCartItemQuantity(cartRef.cartItemId, qty - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-sm text-white min-w-[20px] text-center">{qty}</span>
                                <button
                                  onClick={() => addComboToCart(combo.id)}
                                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addComboToCart(combo.id)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition shadow-sm"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* POPULAR ITEMS */}
          {popularItems.length > 0 && (
            <section id="popular" className="py-16 sm:py-20 bg-[var(--bg-muted)]">
              <div className="container-page">
                <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
                  <div>
                    <span className="badge badge-brand mb-3">
                      <Star className="w-3 h-3 fill-current" />
                      Чаще всего заказывают
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                      Хиты продаж
                    </h2>
                    <p className="text-sm text-[var(--fg-muted)] mt-2">
                      Любимые блюда наших гостей
                    </p>
                  </div>
                  <button
                    onClick={() => session ? router.push('/menu') : setShowAuthModal(true)}
                    className="btn btn-secondary"
                  >
                    Всё меню
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                  {popularItems.map((item, idx: number) => (
                    <article
                      key={item.id}
                      className="group bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--brand)]/30 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${idx * 60}ms` }}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden bg-[var(--bg-muted)]">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0].imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl text-[var(--fg-subtle)]">🍗</div>
                        )}

                        {/* Rank badge */}
                        {idx < 3 && (
                          <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center">
                            <span className="text-base font-black text-[var(--brand)]">#{idx + 1}</span>
                          </div>
                        )}

                        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                          {item.isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase">
                              Новинка
                            </span>
                          )}
                          {item.isFeatured && !item.isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--brand)] text-white text-[10px] font-extrabold uppercase">
                              Хит
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-base font-extrabold leading-tight mb-1 line-clamp-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-[var(--fg-muted)] mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-2">
                          <div className="text-xl font-black text-[var(--fg)]">
                            {item.sizes?.[0]?.price ?? '—'}
                            <span className="text-xs font-bold text-[var(--fg-muted)] ml-0.5">сом</span>
                          </div>
                          {cartItems[item.id] ? (
                            <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); decreaseQuantity(item.id) }}
                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/15 rounded-full transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-sm text-white min-w-[20px] text-center">
                                {cartItems[item.id].quantity}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); increaseQuantity(item.id) }}
                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/15 rounded-full transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleItemClick(item) }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition group-hover:scale-110"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ABOUT */}
          <section id="about" className="py-16 sm:py-20 bg-white">
            <div className="container-page">
              <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div>
                  <span className="badge badge-brand mb-3">
                    <Heart className="w-3 h-3 fill-current" />
                    О нас
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-5 leading-tight">
                    Готовим с душой каждый день
                  </h2>
                  <p className="text-base text-[var(--fg-muted)] leading-relaxed mb-6">
                    Miss Kurochka — это история о любви к еде. Мы готовим из свежих фермерских продуктов,
                    используем фирменные специи и подаём блюда с заботой о каждом госте.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: '5+', label: 'Лет на рынке' },
                      { value: '10K+', label: 'Довольных клиентов' },
                      { value: '15+', label: 'Уникальных блюд' },
                      { value: '24/7', label: 'Поддержка' },
                    ].map(stat => (
                      <div key={stat.label} className="p-4 rounded-xl bg-[var(--bg-muted)]">
                        <p className="text-2xl font-black text-[var(--brand)]">{stat.value}</p>
                        <p className="text-xs text-[var(--fg-muted)] font-semibold mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="aspect-square rounded-3xl overflow-hidden bg-[var(--bg-muted)] group">
                    <img
                      src="/krylswki.png"
                      alt="Премиальное ассорти куриных крылышек Miss Kurochka"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-white rounded-2xl shadow-xl p-4 border border-[var(--border)] max-w-[180px]">
                    <div className="flex items-center gap-1 text-amber-400 mb-1">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                    <p className="text-2xl font-black">4.9</p>
                    <p className="text-[11px] text-[var(--fg-muted)] font-semibold">из 1000+ отзывов</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 sm:py-24 relative overflow-hidden">
            <div className="absolute inset-0">
              <img
                src={slides[currentSlide]?.image ?? heroImages[0]}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/95 via-[var(--brand-dark)]/90 to-black/85" />
            </div>

            <div className="container-page relative z-10 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs font-bold mb-5">
                <Truck className="w-3.5 h-3.5" />
                Доставка по всему городу
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 leading-tight tracking-tight max-w-2xl mx-auto">
                Голоден прямо сейчас?
              </h2>
              <p className="text-base text-white/85 mb-8 max-w-md mx-auto">
                Закажи и получи горячую курочку у себя дома уже через 30 минут
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => session ? router.push('/menu') : setShowAuthModal(true)}
                  className="btn btn-lg bg-white text-[var(--brand)] hover:bg-white/95 shadow-2xl"
                >
                  Заказать
                  <ChevronRight className="w-4 h-4" />
                </button>
                <a href="tel:+996555123456" className="btn btn-lg bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20">
                  <Phone className="w-4 h-4" />
                  Позвонить
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* MOBILE FOOTER — только на мобиле */}
      <footer className="md:hidden bg-[#0a0e1a] text-white px-5 pt-8 pb-8">
        {/* Бренд */}
        <div className="flex items-center gap-3 mb-6">
          <Image src="/logo.png" alt="Miss Kurochka" width={40} height={40} className="rounded-lg" />
          <div>
            <p className="text-base font-black">Miss Kurochka</p>
            <p className="text-xs text-white/50">Самая вкусная курочка</p>
          </div>
        </div>

        {/* Контакт */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-white/40 mb-3 flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" />
            Наши филиалы
          </p>
          {branches.slice(0, 2).map((branch: LandingBranch) => (
            <div key={branch.id} className="mb-2">
              <p className="text-[10px] text-white/50">{branch.name}</p>
              {branch.phone && (
                <a 
                  href={`tel:${branch.phone}`}
                  className="text-sm font-bold text-white block"
                >
                  {branch.phone}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Меню навигации */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Меню */}
          <div>
            <h3 className="text-white font-bold text-xs mb-3">Меню</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-xs text-white/60">
                  Основное меню
                </Link>
              </li>
              <li>
                <a 
                  href="#combo" 
                  className="text-xs text-white/60"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('combo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Комбо
                </a>
              </li>
              <li>
                <Link href="/cart" className="text-xs text-white/60">Корзина</Link>
              </li>
            </ul>
          </div>

          {/* О компании */}
          <div>
            <h3 className="text-white font-bold text-xs mb-3">О компании</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#about" 
                  className="text-xs text-white/60"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  О нас
                </a>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-xs text-white/60">Политика</Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-xs text-white/60">Условия</Link>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="text-xs text-white/60"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Контакты
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Подписка */}
        <button 
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white mb-6 transition-all active:scale-95"
          style={{ 
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow: '0 4px 12px rgba(214, 35, 0, 0.3)'
          }}
          onClick={() => setShowNewsletterModal(true)}
        >
          <Mail className="w-3.5 h-3.5" />
          Подписаться на рассылку
        </button>

        {/* Разделитель */}
        <div className="border-t border-white/10 pt-4 mb-4">
          {/* Социальные сети */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-[10px] text-white/40">Мы в соцсетях</span>
            
            {/* Instagram */}
            <a
              href="https://instagram.com/miss.kurochka"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>

            {/* WhatsApp */}
            {branches.length > 0 && branches[0].phone && (
              <a
                href={`https://wa.me/${branches[0].phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}

            {/* Telegram */}
            <a
              href="https://t.me/misskurochka"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              aria-label="Telegram"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.038-1.36 5.356-.168.558-.5.745-.82.763-.696.064-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.122.099.155.232.171.325.016.093.036.305.02.471z"/>
              </svg>
            </a>
          </div>

          {/* Копирайт */}
          <p className="text-[10px] text-white/30 text-center">
            © {new Date().getFullYear()} Miss Kurochka. Все права защищены.
          </p>
        </div>
      </footer>

      {/* FOOTER — только на десктопе */}
      <footer id="contact" className="hidden md:block bg-[#0a0e1a] text-white pt-16 pb-8">
        <div className="container-page">
          <div className="grid grid-cols-12 gap-8 mb-12">
            {/* Левая колонка: Бренд + контакты */}
            <div className="col-span-12 lg:col-span-4">
              {/* Бренд */}
              <div className="flex items-center gap-3 mb-6">
                <Image src="/logo.png" alt="Miss Kurochka" width={48} height={48} className="rounded-lg" />
                <div>
                  <p className="text-xl font-black text-white">Miss Kurochka</p>
                  <p className="text-sm text-white/50">Самая вкусная курочка</p>
                </div>
              </div>

              {/* Отдел продаж */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-white/40 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Наши контакты
                </p>
                {branches.slice(0, 2).map((branch: LandingBranch, index: number) => (
                  <div key={branch.id} className={index > 0 ? 'mt-3' : ''}>
                    <p className="text-xs text-white/50 mb-1">{branch.name}</p>
                    {branch.phone && (
                      <a 
                        href={`tel:${branch.phone}`}
                        className="text-base font-bold text-white hover:text-[var(--brand-light)] transition block"
                      >
                        {branch.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Подписка на рассылку */}
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                style={{ 
                  background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                  boxShadow: '0 4px 12px rgba(214, 35, 0, 0.3)'
                }}
                onClick={() => setShowNewsletterModal(true)}
              >
                <Mail className="w-4 h-4" />
                Подписаться на рассылку
              </button>
            </div>

            {/* Колонка: Меню */}
            <div className="col-span-6 lg:col-span-2">
              <h3 className="text-white font-bold text-sm mb-4">Меню</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/menu" className="text-sm text-white/60 hover:text-white transition">
                    Основное меню
                  </Link>
                </li>
                <li>
                  <a 
                    href="#combo" 
                    className="text-sm text-white/60 hover:text-white transition"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('combo')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Комбо-предложения
                  </a>
                </li>
                <li>
                  <a 
                    href="#popular" 
                    className="text-sm text-white/60 hover:text-white transition"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('popular')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Популярное
                  </a>
                </li>
                <li>
                  <Link href="/cart" className="text-sm text-white/60 hover:text-white transition">
                    Корзина
                  </Link>
                </li>
              </ul>
            </div>

            {/* Колонка: Наши филиалы */}
            <div className="col-span-6 lg:col-span-3">
              <h3 className="text-white font-bold text-sm mb-4">Наши филиалы</h3>
              <ul className="space-y-2.5">
                {branches.slice(0, 3).map((branch: LandingBranch) => (
                  <li key={branch.id}>
                    <div className="text-left w-full group">
                      <div className="font-semibold text-sm text-white/80 group-hover:text-white transition">{branch.name}</div>
                      {branch.phone && (
                        <a 
                          href={`tel:${branch.phone}`}
                          className="text-xs text-white/40 hover:text-[var(--brand-light)] transition block mt-0.5"
                        >
                          {branch.phone}
                        </a>
                      )}
                      {branch.address && (
                        <p className="text-xs text-white/30 mt-0.5">{cleanAddress(branch.address)}</p>
                      )}
                    </div>
                  </li>
                ))}
                {branches.length > 3 && (
                  <li>
                    <Link
                      href="/branches"
                      className="text-sm font-semibold text-[var(--brand-light)] hover:text-white transition inline-block"
                    >
                      Все филиалы →
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Колонка: О компании */}
            <div className="col-span-6 lg:col-span-2">
              <h3 className="text-white font-bold text-sm mb-4">О компании</h3>
              <ul className="space-y-2.5">
                <li>
                  <a 
                    href="#about" 
                    className="text-sm text-white/60 hover:text-white transition"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    О нас
                  </a>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-sm text-white/60 hover:text-white transition">
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-sm text-white/60 hover:text-white transition">
                    Условия использования
                  </Link>
                </li>
                <li>
                  <a 
                    href="#contact" 
                    className="text-sm text-white/60 hover:text-white transition"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Контакты
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Разделитель */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Копирайт */}
              <p className="text-sm text-white/40">
                © {new Date().getFullYear()} Miss Kurochka. Все права защищены.
              </p>

              {/* Социальные сети */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40 mr-2">Мы в социальных сетях</span>
                
                {/* Instagram */}
                <a
                  href="https://instagram.com/miss.kurochka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }}
                  aria-label="Instagram"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                {branches.length > 0 && branches[0].phone && (
                  <a
                    href={`https://wa.me/${branches[0].phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)'
                    }}
                    aria-label="WhatsApp"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#25D366';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}

                {/* Telegram (опционально) */}
                <a
                  href="https://t.me/misskurochka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }}
                  aria-label="Telegram"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0088cc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.038-1.36 5.356-.168.558-.5.745-.82.763-.696.064-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.122.099.155.232.171.325.016.093.036.305.02.471z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <NewsletterModal isOpen={showNewsletterModal} onClose={() => setShowNewsletterModal(false)} />

      {/* Окно "филиалы закрыты" — только в нерабочее время (23:00–11:00 по КГ) */}
      <BranchClosedModal />
      <MenuItemModal
        item={selectedMenuItem}
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false)
          setSelectedMenuItem(null)
        }}
        onAddToCart={addToCart}
      />

      {/* Combo Modal */}
      {selectedCombo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedCombo(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedCombo.image && (
              <div className="relative h-60 bg-[var(--bg-muted)]">
                <img src={selectedCombo.image} alt={selectedCombo.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <button
                  onClick={() => setSelectedCombo(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-white transition shadow-md"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            )}
            <div className="p-6">
              <h2 className="text-2xl font-black mb-1.5">{selectedCombo.name}</h2>
              {selectedCombo.description && (
                <p className="text-sm text-[var(--fg-muted)] mb-4">{selectedCombo.description}</p>
              )}

              {selectedCombo.items && Array.isArray(selectedCombo.items) && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-2.5">Состав</p>
                  <ul className="space-y-2">
                    {selectedCombo.items.map((item: string, i: number) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-5 border-t border-[var(--border)]">
                <div>
                  {selectedCombo.oldPrice && (
                    <p className="text-xs text-[var(--fg-subtle)] line-through font-semibold">{selectedCombo.oldPrice} сом</p>
                  )}
                  <p className="text-3xl font-black text-[var(--brand)]">{selectedCombo.price} сом</p>
                </div>

                {(() => {
                  const cartRef = comboItems[selectedCombo.id]
                  const qty = cartRef?.quantity ?? 0
                  return qty > 0 ? (
                    <div className="flex items-center gap-1 bg-[var(--brand)] rounded-full p-0.5">
                      <button
                        onClick={() => cartRef && updateCartItemQuantity(cartRef.cartItemId, qty - 1)}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-base text-white min-w-[28px] text-center">{qty}</span>
                      <button
                        onClick={() => addComboToCart(selectedCombo.id)}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => addComboToCart(selectedCombo.id)} className="btn btn-primary">
                      <Plus className="w-4 h-4" />
                      В корзину
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
