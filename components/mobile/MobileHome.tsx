'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react'

import MobileHeader from './MobileHeader'
import SidebarDrawer from './SidebarDrawer'
import PromoSlider, { PromoSlide } from './PromoSlider'
import CategoryTabs, { CategoryItem } from './CategoryTabs'
import ProductCard, { ProductCardItem } from './ProductCard'
import ComboSection, { ComboItem } from './ComboSection'
import RecentOrders from './RecentOrders'

interface Branch {
  id: string
  name: string
  address?: string
}

interface Props {
  branches: Branch[]
  selectedBranch: string | null
  slides: PromoSlide[]
  categories: CategoryItem[]
  activeCategory: string
  items: ProductCardItem[]
  combos: ComboItem[]
  miniCombos: ComboItem[]
  cartItems: Record<string, { quantity: number; cartItemId: string }>
  comboItems: Record<string, { quantity: number; cartItemId: string }>
  cartCount: number
  cartTotal: number
  onBranchChange: (id: string | null) => void
  onCategoryChange: (id: string) => void
  onItemClick: (item: ProductCardItem) => void
  onAddItem: (item: ProductCardItem) => void
  onIncrease: (itemId: string) => void
  onDecrease: (itemId: string) => void
  onAuthClick: () => void
  onComboClick: (combo: ComboItem) => void
  onAddCombo: (id: string) => void
  onRemoveCombo: (cartItemId: string, qty: number) => void
}

export default function MobileHome(props: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAuthenticated = !!session?.user
  const greetingName = session?.user?.fullName?.split(' ')[0] ?? null
  const userAvatar =
    (session?.user as unknown as { avatarUrl?: string | null })?.avatarUrl ?? null

  return (
    <>
      <MobileHeader
        selectedBranch={props.selectedBranch}
        branches={props.branches}
        onBranchChange={props.onBranchChange}
        onMenuOpen={() => setDrawerOpen(true)}
        userName={session?.user?.fullName ?? null}
        userAvatar={userAvatar}
      />

      <SidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={session?.user ?? null}
        isAuthenticated={isAuthenticated}
        onAuthClick={props.onAuthClick}
      />

      <main
        className="flex flex-col gap-5"
        style={{
          paddingTop: 4,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 100px)',
        }}
      >
        {/* Welcome */}
        <section className="px-4 pt-2 animate-fade-in">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {greetingName ? `Привет, ${greetingName}` : 'Добро пожаловать'}
          </h1>
          <p className="text-sm text-[var(--fg-muted)] font-medium mt-0.5">
            Что закажем сегодня?
          </p>
        </section>

        {/* Search */}
        <button
          onClick={() => router.push('/menu')}
          className="mx-4 flex items-center gap-2 h-11 px-4 rounded-2xl active:scale-[0.99] transition-transform"
          style={{ background: 'var(--bg-muted)' }}
        >
          <Search className="w-4 h-4 text-[var(--fg-subtle)]" />
          <span className="flex-1 text-left text-sm text-[var(--fg-subtle)] font-medium">
            Найти блюдо...
          </span>
          <span
            className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
          >
            Меню
          </span>
        </button>

        {/* Promo slider */}
        {props.slides.length > 0 && (
          <PromoSlider
            slides={props.slides}
            onSlideClick={(slide) => {
              if (slide.link) router.push(slide.link)
            }}
          />
        )}

        {/* Combos */}
        <ComboSection
          combos={props.combos}
          cartByComboId={props.comboItems}
          onComboClick={props.onComboClick}
          onAddCombo={props.onAddCombo}
          onRemoveCombo={props.onRemoveCombo}
        />

        {/* Mini Combos */}
        <ComboSection
          combos={props.miniCombos}
          cartByComboId={props.comboItems}
          onComboClick={props.onComboClick}
          onAddCombo={props.onAddCombo}
          onRemoveCombo={props.onRemoveCombo}
          title="Мини-комбо"
          badge="Быстрый перекус"
        />

        {/* Categories — только если переданы */}
        {props.categories.length > 0 && (
          <div>
            <h2 className="text-xl font-extrabold tracking-tight px-4 mb-1">Категории</h2>
            <CategoryTabs
              categories={props.categories}
              activeId={props.activeCategory}
              onChange={props.onCategoryChange}
            />
          </div>
        )}

        {/* Popular products */}
        {props.items.length > 0 && (
          <section>
            <div className="flex items-end justify-between px-4 mb-3">
              <div>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand)' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Хиты
                </span>
                <h2 className="text-xl font-extrabold tracking-tight mt-1.5">Популярное</h2>
              </div>
              <button
                onClick={() => router.push('/menu')}
                className="inline-flex items-center text-xs font-bold text-[var(--brand)] active:scale-95 transition-transform"
              >
                Всё меню
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-3 grid grid-cols-2 gap-3">
              {props.items.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  cartQuantity={props.cartItems[item.id]?.quantity ?? 0}
                  onClick={() => props.onItemClick(item)}
                  onAdd={() => props.onAddItem(item)}
                  onIncrease={() => props.onIncrease(item.id)}
                  onDecrease={() => props.onDecrease(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent orders убраны — история заказов доступна в разделе "Заказы" */}
      </main>

      {/* Плавающая корзина — ярлык с ценой, ведёт в корзину */}
      {props.cartCount > 0 && (
        <button
          onClick={() => router.push('/cart')}
          className="fixed left-4 right-4 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow-lg active:scale-[0.98] transition-transform"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0) + 76px)',
            background:
              'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow: '0 12px 32px rgba(214,35,0,0.28)',
          }}
        >
          <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-[18px] h-[18px]" />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-85">
              В корзине {props.cartCount}{' '}
              {props.cartCount === 1 ? 'товар' : 'товаров'}
            </span>
            <span className="block text-sm font-extrabold">
              Оформить · {props.cartTotal} сом
            </span>
          </span>
          <span className="text-base font-extrabold">→</span>
        </button>
      )}
    </>
  )
}
