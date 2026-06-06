'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Truck,
  Store,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Phone as PhoneIcon,
  User as UserIcon,
  MessageSquare,
  Search,
  Crosshair,
  Check,
} from 'lucide-react'

const SimpleMap = dynamic(() => import('@/components/map/SimpleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center border border-[var(--border)]">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[var(--fg-muted)] font-semibold">Загрузка карты...</p>
      </div>
    </div>
  ),
})

// ============ TYPES ============
interface ModifierOption {
  id: string
  name: string
  priceDelta: number
  group: { id: string; name: string }
}
interface CartItemModifier {
  id: string
  modifierOption: ModifierOption
}
interface MenuItem {
  id: string
  name: string
  price: number
  images: Array<{ imageUrl: string; isPrimary: boolean }>
}
interface ComboOffer {
  id: string
  name: string
  price: number
  imageUrl: string
}
interface CartItem {
  id: string
  quantity: number
  itemComment: string | null
  menuItem: MenuItem | null
  comboOffer: ComboOffer | null
  modifiers: CartItemModifier[]
}
interface Cart {
  id: string
  items: CartItem[]
  branch: { id: string; name: string; address: string } | null
}
interface SavedAddress {
  id: string
  addressLine: string
  apartment?: string | null
  entrance?: string | null
  floor?: string | null
  intercom?: string | null
  comment?: string | null
}

type Step = 1 | 2 | 3 | 4
type OrderType = 'delivery' | 'pickup'

// ============ PAGE ============
export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Step 2 state
  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [addressForm, setAddressForm] = useState({
    addressLine: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
    comment: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
  })
  const [searching, setSearching] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)

  // Step 3 state
  const [customerComment, setCustomerComment] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod] = useState<'card'>('card')
  const [nearestBranch, setNearestBranch] = useState<{
    id: string
    name: string
    address: string
    distanceKm: number | null
  } | null>(null)
  const [loadingNearest, setLoadingNearest] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/cart')
    else if (status === 'authenticated') {
      // Инициализируем телефон из профиля — храним только 9 цифр без +996
      if (session?.user?.phone) {
        const digits = session.user.phone.replace(/\D/g, '')
        // Убираем 996 в начале если есть
        setCustomerPhone(digits.startsWith('996') && digits.length > 9 ? digits.slice(3) : digits.slice(0, 9))
      }
      Promise.all([fetchCart(), fetchAddresses(), fetchBranches()]).finally(() =>
        setLoading(false)
      )
    }
  }, [status, router])

  // Запрашиваем ближайший филиал при выборе доставки/адреса/шага 3
  useEffect(() => {
    if (step !== 3 || orderType !== 'delivery') {
      setNearestBranch(null)
      return
    }

    const selected = savedAddresses.find(a => a.id === selectedAddressId)

    // Берём координаты только если они валидные. ВАЖНО: в БД координаты могут быть
    // null (адрес введён вручную без карты). Number(null) === 0 — это ломало подбор
    // (0,0 = Гвинейский залив, ~8757 км от Бишкека). Поэтому строго проверяем число.
    const toValidCoord = (v: unknown): number | null => {
      if (v === null || v === undefined || v === '') return null
      const n = Number(v)
      return Number.isFinite(n) && n !== 0 ? n : null
    }

    const selLat = selected ? toValidCoord((selected as any).latitude) : null
    const selLng = selected ? toValidCoord((selected as any).longitude) : null
    const formLat = toValidCoord(addressForm.coordinates?.lat)
    const formLng = toValidCoord(addressForm.coordinates?.lng)

    // Координаты валидны только если есть И широта, И долгота
    const lat = selLat !== null && selLng !== null ? selLat : formLat
    const lng = selLat !== null && selLng !== null ? selLng : formLng
    const addressLine = selected?.addressLine ?? addressForm.addressLine

    if (!addressLine && lat === null) return

    setLoadingNearest(true)
    fetch('/api/branches/nearest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        addressLine: addressLine ?? null,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.branch) {
          setNearestBranch({
            id: data.branch.id,
            name: data.branch.name,
            address: data.branch.address,
            distanceKm: data.distanceKm,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingNearest(false))
  }, [step, orderType, selectedAddressId, savedAddresses, addressForm.coordinates, addressForm.addressLine])

  // ============ DATA ============
  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      if (res.ok) setCart(data.cart)
    } catch (e) {
      console.error('Cart error:', e)
    }
  }

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses')
      const data = await res.json()
      if (res.ok && data.addresses) {
        setSavedAddresses(data.addresses)
        if (data.addresses.length > 0) setSelectedAddressId(data.addresses[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      const data = await res.json()
      if (res.ok) {
        const list = data.data ?? data.branches ?? []
        setBranches(list)
        if (list.length > 0) setSelectedBranchId(list[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // ============ CART OPS ============
  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (updating) return
    setUpdating(cartItemId)
    try {
      if (newQuantity === 0) {
        await removeItem(cartItemId)
      } else {
        const res = await fetch('/api/cart/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        })
        const data = await res.json()
        if (res.ok) setCart(data.cart)
      }
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (cartItemId: string) => {
    setUpdating(cartItemId)
    try {
      const res = await fetch(`/api/cart/items?id=${cartItemId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) setCart(data.cart)
    } finally {
      setUpdating(null)
    }
  }

  // ============ ADDRESS OPS ============
  const handleMapLocationSelect = (loc: { lat: number; lng: number; address: string }) => {
    setAddressForm({
      ...addressForm,
      addressLine: loc.address,
      coordinates: { lat: loc.lat, lng: loc.lng },
    })
    setSelectedAddressId(null)
  }

  const searchAddress = async () => {
    if (!addressForm.addressLine || addressForm.addressLine.length < 3) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressForm.addressLine
        )}&limit=1&accept-language=ru&countrycodes=kg`
      )
      const data = await res.json()
      if (data?.[0]) {
        setAddressForm({
          ...addressForm,
          addressLine: data[0].display_name,
          coordinates: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) },
        })
      }
    } finally {
      setSearching(false)
    }
  }

  const saveNewAddress = async (): Promise<string | null> => {
    if (!addressForm.addressLine) return null
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressLine: addressForm.addressLine,
          apartment: addressForm.apartment,
          entrance: addressForm.entrance,
          floor: addressForm.floor,
          intercom: addressForm.intercom,
          comment: addressForm.comment,
          latitude: addressForm.coordinates?.lat ?? null,
          longitude: addressForm.coordinates?.lng ?? null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.address) {
        setSavedAddresses(prev => [data.address, ...prev])
        return data.address.id
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }

  // ============ CALC ============
  const calculateItemTotal = (item: CartItem): number => {
    // Комбо — фиксированная цена без модификаторов
    if (item.comboOffer) {
      return Number(item.comboOffer.price) * item.quantity
    }
    if (!item.menuItem) return 0
    let t = Number(item.menuItem.price)
    item.modifiers.forEach(m => {
      t += Number(m.modifierOption.priceDelta)
    })
    return t * item.quantity
  }
  const totalAmount = cart?.items.reduce((s, i) => s + calculateItemTotal(i), 0) ?? 0
  const itemsCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0

  // ============ NAV ============
  const canProceedToStep2 = cart && cart.items.length > 0
  const canProceedToStep3 =
    orderType === 'pickup'
      ? !!selectedBranchId
      : !!selectedAddressId || !!addressForm.addressLine

  const handleNext = async () => {
    if (step === 1) {
      if (canProceedToStep2) setStep(2)
    } else if (step === 2) {
      if (!canProceedToStep3) return
      // Если введён новый адрес — сохраняем
      if (orderType === 'delivery' && !selectedAddressId && addressForm.addressLine) {
        const newId = await saveNewAddress()
        if (newId) setSelectedAddressId(newId)
        else return
      }
      setStep(3)
    } else if (step === 3) {
      // Переходим к оплате
      setStep(4)
    } else if (step === 4) {
      await submitOrder()
    }
  }

  const submitOrder = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/finik/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          customerName: session?.user?.fullName,
          customerPhone: customerPhone ? `+996${customerPhone}` : (session?.user?.phone || ''),
          customerComment: customerComment || null,
          deliveryAddressId: orderType === 'delivery' ? selectedAddressId : null,
          pickupBranchId: orderType === 'pickup' ? selectedBranchId : null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.paymentUrl) {
        // Перенаправляем пользователя на платёжную страницу Finik
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Ошибка создания платежа')
        setSubmitting(false)
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка создания платежа')
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step === 1) router.push('/home')
    else setStep((step - 1) as Step)
  }

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--fg-muted)] font-semibold">Загружаем корзину...</p>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return <EmptyCart onGoHome={() => router.push('/home')} />
  }

  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId)
  const selectedBranch = branches.find(b => b.id === selectedBranchId)

  const stepLabels = ['Корзина', 'Доставка', 'Подтверждение', 'Оплата']
  const FINIK_PRICE = 5
  const nextLabel =
    step === 3
      ? `Перейти к оплате · ${FINIK_PRICE} сом`
      : step === 4
      ? (submitting ? 'Обработка...' : `Оплатить · ${FINIK_PRICE} сом`)
      : 'Продолжить'

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-30">
        <div className="container-page max-w-3xl flex items-center gap-3 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-muted)] transition"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold">
              Шаг {step} из 4
            </p>
            <h1 className="text-base font-extrabold tracking-tight truncate">
              {stepLabels[step - 1]}
            </h1>
          </div>
        </div>

        {/* Stepper */}
        <div className="container-page max-w-3xl pb-3">
          <Stepper step={step} labels={stepLabels} />
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 container-page max-w-3xl py-4 pb-32">
        {step === 1 && (
          <Step1Items
            cart={cart}
            updating={updating}
            onUpdate={updateQuantity}
            onRemove={removeItem}
            calc={calculateItemTotal}
            onAddToCart={async (menuItemId: string) => {
              try {
                const res = await fetch('/api/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ menuItemId, quantity: 1, modifiers: [] }),
                })
                if (res.ok) fetchCart()
              } catch (e) { console.error(e) }
            }}
          />
        )}
        {step === 2 && (
          <Step2Address
            orderType={orderType}
            setOrderType={setOrderType}
            branches={branches}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            addressForm={addressForm}
            setAddressForm={setAddressForm}
            showMap={showMap}
            setShowMap={setShowMap}
            onMapSelect={handleMapLocationSelect}
            onSearchAddress={searchAddress}
            searching={searching}
          />
        )}
        {step === 3 && (
          <Step3Confirm
            cart={cart}
            calc={calculateItemTotal}
            orderType={orderType}
            address={selectedAddress}
            newAddress={!selectedAddressId ? addressForm : null}
            branch={selectedBranch}
            nearestBranch={nearestBranch}
            loadingNearest={loadingNearest}
            user={session?.user}
            customerComment={customerComment}
            setCustomerComment={setCustomerComment}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            paymentMethod={paymentMethod}
            onEditStep={(s: Step) => setStep(s)}
          />
        )}
        {step === 4 && (
          <Step4Payment
            totalAmount={totalAmount}
            submitting={submitting}
            onPay={submitOrder}
            onBack={() => setStep(3)}
          />
        )}
      </main>

      {/* STICKY FOOTER — скрыт на шаге 4 (там своя кнопка) */}
      {step < 4 && (
        <footer className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-[var(--border)]">
          <div className="container-page max-w-3xl py-3">
            <div className="flex items-baseline justify-between mb-3 px-1">
              <span className="text-xs text-[var(--fg-muted)] font-semibold">
                {itemsCount} {itemsCount === 1 ? 'товар' : 'товаров'}
              </span>
              <span className="text-xl font-extrabold text-[var(--brand)]">
                {totalAmount} сом
              </span>
            </div>
            <button
              onClick={handleNext}
              disabled={
                submitting ||
                (step === 1 && !canProceedToStep2) ||
                (step === 2 && !canProceedToStep3)
              }
              className="btn btn-primary btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nextLabel}
              {step < 3 && !submitting && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

// ============ EMPTY ============
function EmptyCart({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center px-4">
      <div className="surface p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-muted)] rounded-2xl flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 text-[var(--fg-subtle)]" />
        </div>
        <h2 className="text-xl font-extrabold mb-2">Корзина пуста</h2>
        <p className="text-sm text-[var(--fg-muted)] mb-6">
          Добавьте блюда из меню, чтобы оформить заказ
        </p>
        <button onClick={onGoHome} className="btn btn-primary w-full">
          Перейти в меню
        </button>
      </div>
    </div>
  )
}

// ============ STEPPER ============
function Stepper({ step, labels }: { step: Step; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const idx = (i + 1) as Step
        const isDone = idx < step
        const isActive = idx === step
        return (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 transition ${
                isDone
                  ? 'bg-[var(--brand)] text-white'
                  : isActive
                  ? 'bg-[var(--brand-soft)] text-[var(--brand)] ring-2 ring-[var(--brand)]'
                  : 'bg-[var(--bg-muted)] text-[var(--fg-subtle)]'
              }`}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : idx}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:block ${
                isActive ? 'text-[var(--fg)]' : 'text-[var(--fg-subtle)]'
              }`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded ${
                  isDone ? 'bg-[var(--brand)]' : 'bg-[var(--bg-muted)]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============ STEP 1: ITEMS ============
function Step1Items({
  cart,
  updating,
  onUpdate,
  onRemove,
  calc,
  onAddToCart,
}: {
  cart: Cart
  updating: string | null
  onUpdate: (id: string, q: number) => void
  onRemove: (id: string) => void
  calc: (item: CartItem) => number
  onAddToCart: (menuItemId: string) => void
}) {
  const [extras, setExtras] = useState<{ offers: any[]; grouped: Record<string, any[]>; categories: string[] }>({
    offers: [],
    grouped: {},
    categories: [],
  })

  useEffect(() => {
    fetchExtras()
  }, [])

  const fetchExtras = async () => {
    try {
      const res = await fetch('/api/additional-offers')
      const data = await res.json()
      if (res.ok) {
        setExtras({
          offers: data.offers ?? [],
          grouped: data.grouped ?? {},
          categories: data.categories ?? [],
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
    sauce: { label: 'Соусы', emoji: '🫙' },
    drink: { label: 'Напитки', emoji: '🥤' },
    side: { label: 'Гарниры', emoji: '🍟' },
    dessert: { label: 'Десерты', emoji: '🍰' },
    bread: { label: 'Хлеб', emoji: '🍞' },
    snack: { label: 'Закуски', emoji: '🥟' },
  }

  // ID товаров уже в корзине (для подсветки)
  const cartMenuItemIds = new Set(
    cart.items
      .map(i => i.menuItem?.id)
      .filter((id): id is string => !!id)
  )

  return (
    <div className="space-y-5">
      {/* Основные товары */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] px-1 mb-2">
          Ваш заказ
        </h2>
        <div className="surface divide-y divide-[var(--border)]">
          {cart.items.map(item => {
            const isUpdating = updating === item.id
            // Объединяем данные из menuItem или comboOffer для единообразного отображения
            const displayName = item.menuItem?.name ?? item.comboOffer?.name ?? ''
            const displayImage = item.menuItem?.images?.[0]?.imageUrl ?? item.comboOffer?.imageUrl ?? null
            const isCombo = !!item.comboOffer

            return (
              <div key={item.id} className="flex items-start gap-3 p-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍗</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold leading-tight">{displayName}</h3>
                    {isCombo && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--brand)]">
                        Комбо
                      </span>
                    )}
                  </div>
                  {item.modifiers.length > 0 && (
                    <p className="text-xs text-[var(--fg-subtle)] mt-0.5 line-clamp-1">
                      {item.modifiers.map(m => m.modifierOption.name).join(', ')}
                    </p>
                  )}
                  <p className="text-sm font-extrabold mt-1.5">{calc(item)} сом</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-0.5 bg-[var(--bg-muted)] rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdate(item.id, item.quantity - 1)}
                      disabled={isUpdating}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white transition disabled:opacity-50"
                      aria-label="Уменьшить"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdate(item.id, item.quantity + 1)}
                      disabled={isUpdating}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white transition disabled:opacity-50"
                      aria-label="Увеличить"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    disabled={isUpdating}
                    className="text-[var(--fg-subtle)] hover:text-[var(--brand)] transition disabled:opacity-50 p-1"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Дополнительные предложения */}
      {extras.categories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] px-1">
            Добавить к заказу
          </h2>

          {extras.categories.map(cat => {
            const items = extras.grouped[cat] ?? []
            if (items.length === 0) return null
            const meta = CATEGORY_LABELS[cat] || { label: cat, emoji: '➕' }

            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="text-base">{meta.emoji}</span>
                  <h3 className="text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
                    {meta.label}
                  </h3>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                  {items.map((offer: any) => (
                    <div
                      key={offer.id}
                      className="flex-shrink-0 w-32 surface overflow-hidden flex flex-col"
                    >
                      {offer.imageUrl ? (
                        <div className="aspect-square bg-[var(--bg-muted)]">
                          <img
                            src={offer.imageUrl}
                            alt={offer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-[var(--bg-muted)] flex items-center justify-center text-3xl">
                          {meta.emoji}
                        </div>
                      )}
                      <div className="p-2.5 flex flex-col flex-1">
                        <p className="text-xs font-bold leading-tight line-clamp-2 mb-1.5 flex-1">
                          {offer.name}
                        </p>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold">{Number(offer.price)} сом</span>
                          <button
                            onClick={() => onAddToCart(offer.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                            aria-label="Добавить"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============ STEP 2: ADDRESS ============
function Step2Address(props: {
  orderType: OrderType
  setOrderType: (t: OrderType) => void
  branches: any[]
  selectedBranchId: string | null
  setSelectedBranchId: (id: string) => void
  savedAddresses: SavedAddress[]
  selectedAddressId: string | null
  setSelectedAddressId: (id: string | null) => void
  addressForm: any
  setAddressForm: (a: any) => void
  showMap: boolean
  setShowMap: (s: boolean) => void
  onMapSelect: (loc: { lat: number; lng: number; address: string }) => void
  onSearchAddress: () => void
  searching: boolean
}) {
  const {
    orderType,
    setOrderType,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    addressForm,
    setAddressForm,
    showMap,
    setShowMap,
    onMapSelect,
    onSearchAddress,
    searching,
  } = props

  return (
    <div className="space-y-4">
      {/* Type switch */}
      <section className="surface p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
          Способ получения
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderType('delivery')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-sm transition ${
              orderType === 'delivery'
                ? 'bg-[var(--brand)] text-white'
                : 'bg-[var(--bg-muted)] text-[var(--fg-muted)]'
            }`}
          >
            <Truck className="w-4 h-4" />
            Доставка
          </button>
          <button
            onClick={() => setOrderType('pickup')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-sm transition ${
              orderType === 'pickup'
                ? 'bg-[var(--brand)] text-white'
                : 'bg-[var(--bg-muted)] text-[var(--fg-muted)]'
            }`}
          >
            <Store className="w-4 h-4" />
            Самовывоз
          </button>
        </div>
      </section>

      {/* Pickup branches */}
      {orderType === 'pickup' && (
        <section className="surface p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
            Выберите филиал
          </h2>
          {branches.length === 0 ? (
            <p className="text-sm text-[var(--fg-muted)]">Филиалы недоступны</p>
          ) : (
            <div className="space-y-2">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`w-full p-3.5 rounded-xl text-left transition border ${
                    selectedBranchId === branch.id
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Store
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        selectedBranchId === branch.id ? 'text-[var(--brand)]' : 'text-[var(--fg-muted)]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{branch.name}</p>
                      <p className="text-xs text-[var(--fg-muted)] mt-0.5">{branch.address}</p>
                    </div>
                    {selectedBranchId === branch.id && (
                      <Check className="w-4 h-4 text-[var(--brand)] shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Delivery */}
      {orderType === 'delivery' && (
        <>
          {/* Saved addresses */}
          {savedAddresses.length > 0 && (
            <section className="surface p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
                Сохранённые адреса
              </h2>
              <div className="space-y-2">
                {savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id)
                      setAddressForm({ ...addressForm, addressLine: '' })
                    }}
                    className={`w-full p-3.5 rounded-xl text-left transition border ${
                      selectedAddressId === addr.id
                        ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          selectedAddressId === addr.id ? 'text-[var(--brand)]' : 'text-[var(--fg-muted)]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-tight">{addr.addressLine}</p>
                        {(addr.apartment || addr.entrance || addr.floor) && (
                          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                            {addr.apartment && `Кв. ${addr.apartment}`}
                            {addr.entrance && `, под. ${addr.entrance}`}
                            {addr.floor && `, эт. ${addr.floor}`}
                          </p>
                        )}
                      </div>
                      {selectedAddressId === addr.id && (
                        <Check className="w-4 h-4 text-[var(--brand)] shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* New address */}
          <section className="surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)]">
                {savedAddresses.length > 0 ? 'Или новый адрес' : 'Адрес доставки'}
              </h2>
              <button
                onClick={() => setShowMap(!showMap)}
                className="btn btn-ghost btn-sm"
              >
                <Crosshair className="w-3.5 h-3.5" />
                {showMap ? 'Скрыть карту' : 'На карте'}
              </button>
            </div>

            {showMap && (
              <div className="mb-3">
                <SimpleMap
                  onLocationSelect={onMapSelect}
                  initialLocation={addressForm.coordinates}
                />
              </div>
            )}

            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Улица, дом"
                  value={addressForm.addressLine}
                  onChange={e => {
                    setAddressForm({ ...addressForm, addressLine: e.target.value })
                    setSelectedAddressId(null)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onSearchAddress()
                    }
                  }}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={onSearchAddress}
                  disabled={searching || addressForm.addressLine.length < 3}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[var(--fg-subtle)] hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] transition disabled:opacity-50"
                  aria-label="Найти"
                >
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Квартира"
                  value={addressForm.apartment}
                  onChange={e => setAddressForm({ ...addressForm, apartment: e.target.value })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Подъезд"
                  value={addressForm.entrance}
                  onChange={e => setAddressForm({ ...addressForm, entrance: e.target.value })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Этаж"
                  value={addressForm.floor}
                  onChange={e => setAddressForm({ ...addressForm, floor: e.target.value })}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Домофон"
                  value={addressForm.intercom}
                  onChange={e => setAddressForm({ ...addressForm, intercom: e.target.value })}
                  className="input"
                />
              </div>

              <textarea
                placeholder="Комментарий курьеру"
                value={addressForm.comment}
                onChange={e => setAddressForm({ ...addressForm, comment: e.target.value })}
                rows={2}
                className="textarea"
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// ============ STEP 3: CONFIRM ============

/**
 * Убирает из адреса почтовый индекс (6 цифр) и страну в конце.
 * "Октябрьский район, город Бишкек, 720060, Киргизия" →
 * "Октябрьский район, город Бишкек"
 */
function cleanAddress(address: string): string {
  return address
    // убираем ", 6-значный индекс"
    .replace(/,?\s*\d{6}/g, '')
    // убираем ", Киргизия" / ", Кыргызстан" / ", Kyrgyzstan" в конце
    .replace(/,?\s*(Киргизия|Кыргызстан|Kyrgyzstan|KG)\s*$/i, '')
    .trim()
    // убираем висячую запятую в конце
    .replace(/,\s*$/, '')
    .trim()
}

function Step3Confirm({
  cart,
  calc,
  orderType,
  address,
  newAddress,
  branch,
  nearestBranch,
  loadingNearest,
  user,
  customerComment,
  setCustomerComment,
  customerPhone,
  setCustomerPhone,
  paymentMethod,
  onEditStep,
}: {
  cart: Cart
  calc: (item: CartItem) => number
  orderType: OrderType
  address: SavedAddress | undefined
  newAddress: any | null
  branch: any | undefined
  nearestBranch: { id: string; name: string; address: string; distanceKm: number | null } | null
  loadingNearest: boolean
  user: any
  customerComment: string
  setCustomerComment: (s: string) => void
  customerPhone: string
  setCustomerPhone: (s: string) => void
  paymentMethod: 'card'
  onEditStep: (s: Step) => void
}) {
  const showAddress = address ?? (newAddress && newAddress.addressLine ? newAddress : null)

  return (
    <div className="space-y-4">
      {/* Items preview */}
      <section className="surface">
        <SectionHeader
          title="Состав заказа"
          count={cart.items.length}
          onEdit={() => onEditStep(1)}
        />
        <div className="divide-y divide-[var(--border)]">
          {cart.items.map(item => {
            const displayName = item.menuItem?.name ?? item.comboOffer?.name ?? ''
            const displayImage = item.menuItem?.images?.[0]?.imageUrl ?? item.comboOffer?.imageUrl ?? null
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-muted)] shrink-0">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🍗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{displayName}</p>
                  <p className="text-xs text-[var(--fg-muted)]">× {item.quantity}</p>
                </div>
                <p className="text-sm font-extrabold shrink-0">{calc(item)} сом</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Delivery info */}
      <section className="surface">
        <SectionHeader
          title={orderType === 'delivery' ? 'Адрес доставки' : 'Самовывоз'}
          onEdit={() => onEditStep(2)}
        />
        <div className="px-4 pb-4">
          {orderType === 'delivery' ? (
            showAddress ? (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--fg-muted)] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight">{cleanAddress(showAddress.addressLine)}</p>
                  {(showAddress.apartment || showAddress.entrance || showAddress.floor) && (
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                      {showAddress.apartment && `Кв. ${showAddress.apartment}`}
                      {showAddress.entrance && `, под. ${showAddress.entrance}`}
                      {showAddress.floor && `, эт. ${showAddress.floor}`}
                      {showAddress.intercom && `, домофон ${showAddress.intercom}`}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--fg-muted)]">Адрес не указан</p>
            )
          ) : branch ? (
            <div className="flex items-start gap-2.5">
              <Store className="w-4 h-4 text-[var(--fg-muted)] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold">{branch.name}</p>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{cleanAddress(branch.address)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--fg-muted)]">Филиал не выбран</p>
          )}
        </div>
      </section>

      {/* Готовится в филиале — для доставки */}
      {orderType === 'delivery' && (
        <section className="surface p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
            Готовится в филиале
          </h2>
          {loadingNearest ? (
            <p className="text-sm text-[var(--fg-muted)]">Определяем ближайший филиал...</p>
          ) : nearestBranch ? (
            <div className="flex items-start gap-2.5">
              <Store className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold">{nearestBranch.name}</p>
                  {nearestBranch.distanceKm !== null && (
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--brand)]">
                      ~{nearestBranch.distanceKm.toFixed(1)} км
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{cleanAddress(nearestBranch.address)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--fg-muted)]">
              Не удалось определить филиал — будет назначен автоматически
            </p>
          )}
        </section>
      )}

      {/* Contacts */}
      <section className="surface p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3">
          Контактные данные
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-4 h-4 text-[var(--fg-muted)] shrink-0" />
            <span className="font-semibold truncate">{user?.fullName ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <PhoneIcon className="w-4 h-4 text-[var(--fg-muted)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                {/* Префикс +996 — фиксированный */}
                <span className="px-3 py-2 text-sm font-bold text-[var(--fg-muted)] shrink-0 select-none border-r border-[var(--border)]">
                  +996
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="555 123 456"
                  className="flex-1 px-3 py-2 text-sm font-semibold focus:outline-none bg-transparent"
                  style={{ color: 'var(--fg)' }}
                  maxLength={9}
                />
              </div>
              {!customerPhone && (
                <p className="text-[11px] text-[var(--brand)] mt-1 font-semibold">
                  Укажите телефон для связи с курьером
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comment */}
      <section className="surface p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-3 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Комментарий к заказу
        </h2>
        <textarea
          value={customerComment}
          onChange={e => setCustomerComment(e.target.value)}
          placeholder="Например: не звонить в дверь"
          rows={2}
          className="textarea"
        />
      </section>

      {/* Payment */}
      {/* Speed promise */}
      {orderType === 'delivery' && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#ecfdf5] border border-[#d1fae5]">
          <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#065f46]">Быстрая доставка</p>
            <p className="text-xs text-[#047857] mt-0.5">Доставим за 30 минут</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  count,
  onEdit,
}: {
  title: string
  count?: number
  onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
      <h2 className="text-sm font-extrabold flex items-center gap-2">
        {title}
        {typeof count === 'number' && (
          <span className="badge text-[10px]">{count}</span>
        )}
      </h2>
      <button onClick={onEdit} className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)]">
        Изменить
      </button>
    </div>
  )
}

// ============ STEP 4: PAYMENT ============
// Цена платежа фиксированная — 5 сом (передаётся в Finik отдельно).
// Здесь просто кнопка "Оплатить через Finik" — после нажатия пользователя
// перенаправит на платёжную страницу Finik (QR-код).
const FINIK_FIXED_AMOUNT = 5

function Step4Payment({
  totalAmount,
  submitting,
  onPay,
  onBack,
}: {
  totalAmount: number
  submitting: boolean
  onPay: () => void
  onBack: () => void
}) {
  return (
    <div className="space-y-4 pb-8">
      {/* Заголовок */}
      <div className="surface p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">Оплата через Finik</h2>
            <p className="text-xs text-[var(--fg-muted)]">Безопасная оплата по QR-коду</p>
          </div>
        </div>
      </div>

      {/* Информация о платеже */}
      <div className="surface p-5 space-y-3">
        <div className="flex items-baseline justify-between pb-3 border-b border-[var(--border)]">
          <span className="text-sm text-[var(--fg-muted)] font-semibold">Сумма заказа</span>
          <span className="text-base font-bold text-[var(--fg-muted)] line-through">
            {totalAmount} сом
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold">К оплате</span>
          <span className="text-3xl font-extrabold text-[var(--brand)]">
            {FINIK_FIXED_AMOUNT} сом
          </span>
        </div>
        <p className="text-[11px] text-[var(--fg-subtle)] text-center pt-2">
          Тестовый платёж — фиксированная сумма {FINIK_FIXED_AMOUNT} сом
        </p>
      </div>

      {/* Шаги оплаты */}
      <div className="surface p-5">
        <h3 className="text-sm font-extrabold mb-3">Как это работает</h3>
        <ol className="space-y-2.5">
          {[
            'Нажмите кнопку «Оплатить»',
            'Откроется страница Finik с QR-кодом',
            'Отсканируйте QR-код в приложении банка',
            'После оплаты вернётесь на чек заказа',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="w-5 h-5 rounded-full text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'var(--brand)' }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-[var(--fg)]">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Кнопки */}
      <div className="surface p-5 space-y-3">
        <button
          onClick={onPay}
          disabled={submitting}
          className="btn btn-primary btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: 'var(--shadow-brand)' }}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Создание платежа...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Оплатить {FINIK_FIXED_AMOUNT} сом через Finik
            </>
          )}
        </button>
        <button
          onClick={onBack}
          disabled={submitting}
          className="btn btn-secondary w-full disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к подтверждению
        </button>
        <p className="text-center text-[11px] text-[var(--fg-subtle)] mt-3 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Защищённое соединение · Finik Acquiring
        </p>
      </div>
    </div>
  )
}

