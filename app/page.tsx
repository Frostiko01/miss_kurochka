'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslations } from '@/app/i18n/hooks/useTranslations'

export default function Home() {
  const { locale, changeLocale, translations, t, tArray } = useTranslations('landing')
  const [activeCategory, setActiveCategory] = useState('fried')
  const [cartCount, setCartCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

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

  const menuData = {
    fried: translations.menu?.items?.fried || [],
    snacks: translations.menu?.items?.snacks || [],
    burgers: translations.menu?.items?.burgers || [],
    hotdogs: translations.menu?.items?.hotdogs || [],
    ramen: translations.menu?.items?.ramen || []
  }

  const comboDeals = [
    {
      id: 'combo1',
      name: t('combo.deals.combo1.name'),
      items: tArray('combo.deals.combo1.items'),
      price: t('combo.deals.combo1.price'),
      oldPrice: t('combo.deals.combo1.oldPrice'),
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80'
    },
    {
      id: 'combo2',
      name: t('combo.deals.combo2.name'),
      items: tArray('combo.deals.combo2.items'),
      price: t('combo.deals.combo2.price'),
      oldPrice: t('combo.deals.combo2.oldPrice'),
      image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&q=80'
    },
    {
      id: 'combo3',
      name: t('combo.deals.combo3.name'),
      items: tArray('combo.deals.combo3.items'),
      price: t('combo.deals.combo3.price'),
      oldPrice: t('combo.deals.combo3.oldPrice'),
      image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&q=80'
    },
    {
      id: 'combo4',
      name: t('combo.deals.combo4.name'),
      items: tArray('combo.deals.combo4.items'),
      price: t('combo.deals.combo4.price'),
      oldPrice: t('combo.deals.combo4.oldPrice'),
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80'
    }
  ]

  const categories = [
    { id: 'fried', name: t('menu.categories.fried.name'), icon: t('menu.categories.fried.icon') },
    { id: 'snacks', name: t('menu.categories.snacks.name'), icon: t('menu.categories.snacks.icon') },
    { id: 'burgers', name: t('menu.categories.burgers.name'), icon: t('menu.categories.burgers.icon') },
    { id: 'hotdogs', name: t('menu.categories.hotdogs.name'), icon: t('menu.categories.hotdogs.icon') },
    { id: 'ramen', name: t('menu.categories.ramen.name'), icon: t('menu.categories.ramen.icon') }
  ]

  const addToCart = () => {
    setCartCount(prev => prev + 1)
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#d62300]/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d62300]/10 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#d62300]/5 rounded-full blur-3xl opacity-60 animate-pulse delay-500"></div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-40 right-20 w-20 h-20 border-4 border-[#d62300]/20 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-[#d62300]/20 rounded-full animate-bounce-slow"></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-2xl' : 'bg-white shadow-xl'} border-b-4 border-[#d62300]`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-4">
            <Image src="/logo.svg" alt="Miss Kurochka" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20" />
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[#d62300]">{t('header.title')}</h1>
              <p className="text-xs text-[#d62300] hidden sm:block">{t('header.subtitle')}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 text-sm font-bold">
            <button onClick={() => scrollToSection('combo')} className="text-[#d62300] hover:text-[#b01e00] transition-colors">{t('header.nav.combo')}</button>
            <button onClick={() => scrollToSection('menu')} className="text-[#d62300] hover:text-[#b01e00] transition-colors">{t('header.nav.menu')}</button>
            <button onClick={() => scrollToSection('contact')} className="text-[#d62300] hover:text-[#b01e00] transition-colors">{t('header.nav.contacts')}</button>
          </nav>

          {/* Language Switcher */}
          <LanguageSwitcher 
            currentLocale={locale}
            onLocaleChange={changeLocale}
            className="hidden sm:block"
          />

          {/* Cart Button */}
          <button 
            onClick={() => scrollToSection('order')}
            className="relative bg-[#d62300] text-white px-4 sm:px-10 py-3 sm:py-5 rounded-2xl font-black text-sm sm:text-lg uppercase shadow-2xl hover:bg-[#b01e00] transition-all hover:scale-105"
          >
            <span className="hidden sm:inline">{t('header.cart')}</span>
            <span className="sm:hidden">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-[#d62300] w-7 h-7 rounded-full flex items-center justify-center text-sm font-black animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

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
          <div className="lg:hidden bg-white border-t-2 border-red-100 py-4 px-6 animate-slide-down">
            <nav className="flex flex-col gap-4">
              <button onClick={() => scrollToSection('combo')} className="text-left font-bold text-[#d62300] hover:text-[#b01e00] transition-colors">{t('header.nav.combo')}</button>
              <button onClick={() => scrollToSection('menu')} className="text-left font-bold text-[#d62300] hover:text-[#b01e00] transition-colors">{t('header.nav.menu')}</button>
              <button onClick={() => scrollToSection('contact')} className="text-left font-bold text-[#d62300] hover:text-[#b01e00] transition-colors">{t('header.nav.contacts')}</button>
              <div className="pt-2 border-t-2 border-red-100">
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
            <div className="inline-block mb-4 sm:mb-6 animate-fade-in">
              <div className="bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold border border-white/30">
                {t('hero.badge')}
              </div>
            </div>
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
            <button 
              onClick={() => scrollToSection('menu')}
              className="bg-white text-[#d62300] px-8 sm:px-16 py-4 sm:py-7 rounded-2xl text-xl sm:text-3xl font-black uppercase shadow-2xl hover:scale-105 transition-transform"
            >
              {t('hero.cta')}
            </button>
          </div>
        </section>

        {/* Combo Section */}
        <section id="combo" className="py-12 sm:py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 sm:mb-10">
              <h2 className="text-3xl sm:text-5xl font-black text-black uppercase">{t('combo.title')}</h2>
              <div className="text-xs sm:text-sm text-gray-500 hidden md:block">{t('combo.scrollHint')}</div>
            </div>
            
            <div className="relative">
              <div className="flex gap-4 sm:gap-8 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {comboDeals.map((combo, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-80 sm:w-96 group snap-center animate-fade-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(214,35,0,0.3)] transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 h-full flex flex-col">
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
                              <span className="text-lg">🔥</span>
                              <span>{t('combo.badge')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6 sm:p-8 flex flex-col flex-1">
                        <h3 className="text-2xl sm:text-3xl font-black mb-4 uppercase text-black tracking-tight">{combo.name}</h3>
                        
                        {/* Items List */}
                        <ul className="space-y-2.5 mb-6 flex-1">
                          {combo.items.map((item, i) => (
                            <li key={i} className="flex items-center text-sm sm:text-base text-gray-700 font-semibold">
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
                            onClick={addToCart}
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

        {/* Menu Section */}
        <section id="menu" className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-red-50 via-white to-red-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-black uppercase mb-6 sm:mb-10 text-center">{t('menu.title')}</h2>

            {/* Category Pills */}
            <div className="sticky top-24 sm:top-28 z-40 bg-white/80 backdrop-blur-lg py-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-8 sm:mb-12 rounded-2xl shadow-lg">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 sm:px-10 py-3 sm:py-5 rounded-2xl font-black text-sm sm:text-lg uppercase transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#d62300] text-white shadow-2xl scale-105'
                        : 'bg-white text-black hover:bg-[#d62300] hover:text-white shadow-lg'
                    }`}
                  >
                    <span className="mr-1 sm:mr-2">{cat.icon}</span>
                    <span className="hidden sm:inline">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {menuData[activeCategory as keyof typeof menuData].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_20px_60px_rgba(214,35,0,0.3)] transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Image Container */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden group">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    
                    {/* Quick Add Button on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={addToCart}
                        className="bg-white text-[#d62300] px-6 py-3 rounded-xl font-black text-sm uppercase shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
                      >
                        {t('menu.addButton')}
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-black uppercase text-black mb-2 tracking-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">{item.desc}</p>
                    
                    {/* Prices */}
                    <div className="space-y-1 mb-4">
                      {item.prices.map((price, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-semibold">{price.split(' - ')[0]}</span>
                          <span className="text-base sm:text-lg font-black text-[#d62300]">{price.split(' - ')[1]}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Button */}
                    <button 
                      onClick={addToCart}
                      className="w-full relative group/btn"
                    >
                      <div className="absolute inset-0 bg-[#d62300] rounded-xl blur opacity-30 group-hover/btn:opacity-50 transition"></div>
                      <div className="relative bg-gradient-to-r from-[#d62300] to-[#ff0000] text-white py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base uppercase shadow-lg hover:shadow-xl transition-all">
                        {t('menu.cartButton')}
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="absolute top-10 right-10 w-48 sm:w-64 h-48 sm:h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-48 sm:w-64 h-48 sm:h-64 bg-white rounded-full blur-3xl"></div>
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
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-6 sm:mb-10 uppercase leading-tight drop-shadow-2xl">
              {t('cta.title')}
            </h2>
            <p className="text-base sm:text-xl text-white mb-8 sm:mb-10 font-semibold drop-shadow-lg">
              {t('cta.subtitle')}
            </p>
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
      <footer id="contact" className="bg-white py-8 sm:py-12 px-4 sm:px-6 border-t-4 border-[#d62300]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <Image src="/logo.svg" alt="Miss Kurochka" width={50} height={50} />
                <h3 className="text-xl sm:text-2xl font-black text-black">{t('footer.title')}</h3>
              </div>
              <p className="text-gray-600 text-sm">{t('footer.subtitle')}</p>
            </div>
            
            <div className="text-center">
              <h4 className="font-black mb-3 text-black">{t('footer.contacts.title')}</h4>
              <p className="text-black text-base sm:text-lg mb-2">{t('footer.contacts.phone')}</p>
              <p className="text-gray-600 text-sm">{t('footer.contacts.email')}</p>
            </div>
            
            <div className="text-center md:text-right">
              <h4 className="font-black mb-3 text-black">{t('footer.hours.title')}</h4>
              <p className="text-gray-600 text-sm">{t('footer.hours.schedule')}</p>
              <p className="text-gray-600 text-sm">{t('footer.hours.delivery')}</p>
            </div>
          </div>
          
          <div className="border-t-2 border-red-100 pt-6 text-center">
            <p className="text-gray-600 text-sm">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>

      {/* Floating Call Button */}
      <a
        href="tel:+996555123456"
        className="fixed bottom-6 right-6 z-50 bg-[#d62300] text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-bounce"
      >
        <span className="text-2xl sm:text-3xl">📞</span>
      </a>
    </div>
  );
}
