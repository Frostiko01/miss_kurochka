"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import {
  ShoppingCart,
  Package,
  ChevronRight,
  User,
  MapPin,
  Clock,
  Flame,
  Star,
  Plus,
  Minus,
  LogOut,
  Phone,
  CheckCircle,
  Truck,
  Store,
  ChefHat,
  Menu as MenuIcon,
  X,
  Sparkles,
} from "lucide-react";
import MenuItemDetailModal from "@/components/MenuItemDetailModal";
import AuthModal from "@/components/AuthModal";
import MenuCard from "@/components/MenuCard";
import MenuItemCard from "@/components/MenuItemCard";
import SideMenu from "@/components/SideMenu";
import AiChatModal from "@/components/AiChatModal";
import BranchClosedModal from "@/components/BranchClosedModal";

const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Завершён",
  cancelled: "Отменён",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "badge-warning",
  confirmed: "badge-info",
  preparing: "badge-warning",
  ready: "badge-success",
  delivering: "badge-info",
  completed: "badge",
  cancelled: "badge-danger",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle className="w-4 h-4" />,
  preparing: <ChefHat className="w-4 h-4" />,
  ready: <CheckCircle className="w-4 h-4" />,
  delivering: <Truck className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  cancelled: <CheckCircle className="w-4 h-4" />,
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [combos, setCombos] = useState<any[]>([]);
  const [miniCombos, setMiniCombos] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItems, setCartItems] = useState<
    Record<string, { quantity: number; cartItemId: string }>
  >({});
  // Cart indexed by `${menuItemId}__${optionId}` for size variants
  const [cartByOption, setCartByOption] = useState<
    Record<string, { quantity: number; cartItemId: string }>
  >({});
  // Комбо в корзине: comboOfferId → { quantity, cartItemId }
  const [comboCartItems, setComboCartItems] = useState<
    Record<string, { quantity: number; cartItemId: string }>
  >({});
  // Новая схема: sizeId → { quantity, cartItemId }
  const [cartBySizeId, setCartBySizeId] = useState<
    Record<string, { quantity: number; cartItemId: string }>
  >({});
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/home");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Сначала определяем филиал (по сохранённому или геолокации), затем грузим меню
      // с учётом стоп-листа этого филиала. Меню — главный контент, снимаем спиннер после него.
      resolveBranchThenLoadMenu().finally(() => setLoading(false));
      // Остальное грузим параллельно в фоне
      fetchCombos();
      fetchRecentOrders();
      fetchCart();
      fetchBranches();
    }
  }, [status]);

  // Определяет филиал (из localStorage или по геолокации) и грузит меню под него.
  const resolveBranchThenLoadMenu = async () => {
    let branchId: string | null = null;
    try {
      branchId =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedBranchId")
          : null;
    } catch {}

    // Если филиал ещё не определён — пробуем геолокацию (с таймаутом, не блокируем надолго)
    if (!branchId && typeof navigator !== "undefined" && navigator.geolocation) {
      branchId = await new Promise<string | null>((resolve) => {
        let settled = false;
        const done = (v: string | null) => {
          if (!settled) {
            settled = true;
            resolve(v);
          }
        };
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await fetch("/api/branches/nearest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                }),
              });
              const data = await res.json();
              if (res.ok && data.branch?.id) {
                try {
                  localStorage.setItem("selectedBranchId", data.branch.id);
                } catch {}
                done(data.branch.id);
              } else done(null);
            } catch {
              done(null);
            }
          },
          () => done(null),
          { timeout: 4000, maximumAge: 300000 },
        );
        // Страховочный таймаут, чтобы не ждать геолокацию дольше 4.5с
        setTimeout(() => done(null), 4500);
      });
    }

    await fetchPopularItems(branchId);
  };

  const fetchPopularItems = async (branchId?: string | null) => {
    try {
      // Меню учитывает стоп-лист переданного филиала (определён по геолокации).
      const branchQuery = branchId ? `?branchId=${branchId}` : "";
      const res = await fetch(`/api/menu${branchQuery}`);
      const data = await res.json();
      if (res.ok) {
        // Все категории с блюдами
        const cats = [
          ...(data.grouped?.regular ?? []),
          ...(data.grouped?.combo ?? []),
          ...(data.grouped?.mini_combo ?? []),
        ].filter((cat: any) => cat.items && cat.items.length > 0);
        setMenuCategories(cats);

        // Все блюда
        const all = cats.flatMap((cat: any) => cat.items ?? []);
        setAllMenuItems(all);

        // Популярные (isFeatured) — до 8
        const featured = all.filter((i: any) => i.isFeatured).slice(0, 8);
        const result =
          featured.length >= 8
            ? featured
            : [
                ...featured,
                ...all
                  .filter((i: any) => !i.isFeatured)
                  .slice(0, 8 - featured.length),
              ];
        setPopularItems(result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCombos = async () => {
    try {
      const res = await fetch("/api/combo-offers");
      const data = await res.json();
      if (res.ok) {
        const all = data.combos ?? [];
        // Разделяем по типу: обычные комбо и мини-комбо
        const regular = all.filter((c: any) => c.type !== "mini");
        const mini = all.filter((c: any) => c.type === "mini");
        setCombos(regular.slice(0, 4));
        setMiniCombos(mini);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch("/api/user/orders?limit=3");
      const data = await res.json();
      if (res.ok) setRecentOrders(data.orders ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  // Применяет данные корзины к состоянию. Используется и при первичной загрузке,
  // и при ответе на добавление/изменение — чтобы не делать повторный GET /api/cart.
  const applyCartData = useCallback((cart: any) => {
    if (!cart) return;
    const count = cart.items.reduce((s: number, i: any) => s + i.quantity, 0);
    setCartCount(count);
    const total = cart.items.reduce((s: number, i: any) => {
      if (i.comboOffer) {
        return s + Number(i.comboOffer.price) * i.quantity;
      }
      if (!i.menuItem) return s;
      let t = Number(i.menuItem.price ?? 0) * i.quantity;
      i.modifiers?.forEach((m: any) => {
        t += Number(m.modifierOption.priceDelta) * i.quantity;
      });
      return s + t;
    }, 0);
    setCartTotal(total);
    const map: Record<string, { quantity: number; cartItemId: string }> = {};
    const optMap: Record<string, { quantity: number; cartItemId: string }> = {};
    const comboMap: Record<string, { quantity: number; cartItemId: string }> = {};
    const sizeMap: Record<string, { quantity: number; cartItemId: string }> = {};
    cart.items.forEach((i: any) => {
      // Комбо-позиции
      if (i.comboOffer) {
        comboMap[i.comboOffer.id] = {
          quantity: i.quantity,
          cartItemId: i.id,
        };
        return;
      }
      // Обычные блюда
      if (!i.menuItem) return;
      const ref = { quantity: i.quantity, cartItemId: i.id };

      // По menuItemId — для карточек без размеров
      map[i.menuItem.id] = ref;

      // Для карточек С размерами: заполняем sizeMap только для выбранного размера
      if (i.sizeId) {
        sizeMap[i.sizeId] = ref;
      }

      // Старая схема: optionId для блюд с размерами через modifiers
      i.modifiers?.forEach((m: any) => {
        const key = `${i.menuItem.id}__${m.modifierOption.id}`;
        optMap[key] = { quantity: i.quantity, cartItemId: i.id };
      });
    });
    setCartItems(map);
    setCartByOption(optMap);
    setComboCartItems(comboMap);
    setCartBySizeId(sizeMap);
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (res.ok && data.cart) {
        applyCartData(data.cart);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      if (res.ok) setBranches(data.data ?? data.branches ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = async (
    menuItemId?: string,
    modifiers?: string[],
    quantity?: number,
  ) => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    if (!menuItemId) return;
    // Оптимистично увеличиваем счётчик корзины сразу
    const addQty = quantity || 1;
    setCartCount((prev) => prev + addQty);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId,
          quantity: addQty,
          modifiers: modifiers || [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        applyCartData(data.cart);
      } else {
        setCartCount((prev) => Math.max(0, prev - addQty));
      }
    } catch (e) {
      console.error(e);
      setCartCount((prev) => Math.max(0, prev - addQty));
    }
  };

  // Добавить блюдо с размером и специями
  const addToCartWithSize = async (
    menuItemId: string,
    sizeId: string | null,
    spiceIds: string[],
  ) => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    setCartCount((prev) => prev + 1);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId,
          sizeId,
          quantity: 1,
          modifiers: [],
          spices: spiceIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        applyCartData(data.cart);
      } else {
        setCartCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error(e);
      setCartCount((prev) => Math.max(0, prev - 1));
    }
  };

  const addComboToCart = async (comboOfferId: string) => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    setCartCount((prev) => prev + 1);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboOfferId, quantity: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        applyCartData(data.cart);
        setSelectedCombo(null);
      } else {
        setCartCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error(e);
      setCartCount((prev) => Math.max(0, prev - 1));
    }
  };

  const updateCartItem = async (menuItemId: string, newQuantity: number) => {
    const cartItem = cartItems[menuItemId];
    if (!cartItem) return;
    await updateCartItemById(cartItem.cartItemId, newQuantity);
  };

  /**
   * Мгновенно (оптимистично) меняет количество позиции во всех картах состояния
   * и в счётчике корзины — ещё до ответа сервера. Возвращает снимок предыдущего
   * состояния для отката в случае ошибки.
   */
  const optimisticSetQuantity = (cartItemId: string, newQuantity: number) => {
    const snapshot = {
      cartItems,
      cartByOption,
      comboCartItems,
      cartBySizeId,
      cartCount,
    };

    // Находим старое количество этой позиции (в любой из карт)
    const findQty = () => {
      for (const m of [cartItems, cartByOption, comboCartItems, cartBySizeId]) {
        for (const key of Object.keys(m)) {
          if (m[key]?.cartItemId === cartItemId) return m[key].quantity;
        }
      }
      return 0;
    };
    const oldQty = findQty();
    const delta = newQuantity - oldQty;

    const updateMap = (
      m: Record<string, { quantity: number; cartItemId: string }>,
    ) => {
      const next: typeof m = {};
      for (const key of Object.keys(m)) {
        const entry = m[key];
        if (entry.cartItemId === cartItemId) {
          if (newQuantity <= 0) continue; // удаляем позицию
          next[key] = { ...entry, quantity: newQuantity };
        } else {
          next[key] = entry;
        }
      }
      return next;
    };

    setCartItems((prev) => updateMap(prev));
    setCartByOption((prev) => updateMap(prev));
    setComboCartItems((prev) => updateMap(prev));
    setCartBySizeId((prev) => updateMap(prev));
    setCartCount((prev) => Math.max(0, prev + delta));

    return snapshot;
  };

  const rollbackCart = (snapshot: {
    cartItems: Record<string, { quantity: number; cartItemId: string }>;
    cartByOption: Record<string, { quantity: number; cartItemId: string }>;
    comboCartItems: Record<string, { quantity: number; cartItemId: string }>;
    cartBySizeId: Record<string, { quantity: number; cartItemId: string }>;
    cartCount: number;
  }) => {
    setCartItems(snapshot.cartItems);
    setCartByOption(snapshot.cartByOption);
    setComboCartItems(snapshot.comboCartItems);
    setCartBySizeId(snapshot.cartBySizeId);
    setCartCount(snapshot.cartCount);
  };

  const updateCartItemById = async (
    cartItemId: string,
    newQuantity: number,
  ) => {
    // Мгновенно меняем UI, не дожидаясь сервера
    const snapshot = optimisticSetQuantity(cartItemId, newQuantity);
    try {
      if (newQuantity <= 0) {
        const res = await fetch(`/api/cart/items?id=${cartItemId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const data = await res.json();
          applyCartData(data.cart);
        } else {
          rollbackCart(snapshot);
        }
      } else {
        const res = await fetch("/api/cart/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItemId, quantity: newQuantity }),
        });
        if (res.ok) {
          const data = await res.json();
          applyCartData(data.cart);
        } else {
          rollbackCart(snapshot);
        }
      }
    } catch (e) {
      console.error(e);
      rollbackCart(snapshot);
    }
  };

  /**
   * Возвращает первую обязательную single-группу модификаторов («Размер»).
   * Если она есть и в ней >= 2 опций — блюдо считается мультиразмерным.
   */
  const getSizeGroup = (item: any) => {
    if (!item?.modifiers) return null;
    const sizeMod = item.modifiers.find(
      (m: any) =>
        m?.group?.isRequired &&
        m?.group?.selectionType === "single" &&
        Array.isArray(m?.group?.options) &&
        m.group.options.length >= 2,
    );
    return sizeMod ?? null;
  };

  const addSize = async (menuItemId: string, optionId: string) => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    setCartCount((prev) => prev + 1);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId,
          quantity: 1,
          modifiers: [optionId],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        applyCartData(data.cart);
      } else {
        setCartCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error(e);
      setCartCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleItemClick = (item: any) => {
    setDetailItem(item);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-3" />
          <p className="text-sm text-[var(--fg-muted)] font-semibold">
            Загрузка...
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user;
  const initials = user.fullName?.charAt(0).toUpperCase() ?? "?";
  const activeOrders = recentOrders.filter((o) =>
    ["pending", "confirmed", "preparing", "ready", "delivering"].includes(
      o.status,
    ),
  );

  return (
    <div className="min-h-screen bg-[var(--bg-muted)]">
      {/* ── TOP BAR ── */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="container-page max-w-5xl flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSideMenuOpen(true)}
              className="p-2 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
              aria-label="Открыть меню"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <Link href="/home" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Miss Kurochka"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-sm font-extrabold text-[var(--brand)] hidden sm:block">
                Miss Kurochka
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => router.push("/cart")}
              className="relative p-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
              aria-label="Корзина"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--brand)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[var(--bg-muted)] transition"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-sm font-bold">
                  {initials}
                </div>
              )}
              <span className="text-xs font-bold hidden sm:block max-w-[100px] truncate">
                {user.fullName}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page max-w-5xl py-6 space-y-8">
        {/* ── GREETING ── */}
        <section className="surface p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--fg-subtle)] font-semibold mb-0.5">
              Добро пожаловать 👋
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {user.fullName}
            </h1>
            <p className="text-sm text-[var(--fg-muted)] mt-0.5">
              {user.email}
            </p>
          </div>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-3xl font-extrabold shrink-0">
              {initials}
            </div>
          )}
        </section>

        {/* ── ACTIVE ORDERS ── */}
        {activeOrders.length > 0 && (
          <section>
            <SectionHeader
              title="Активные заказы"
              icon={<Truck className="w-4 h-4" />}
              href="/orders"
            />
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="card card-hover p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                        {STATUS_ICON[order.status]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          Заказ #{order.orderNumber}
                        </p>
                        <p className="text-xs text-[var(--fg-muted)] truncate">
                          {order.branch?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`badge ${STATUS_BADGE[order.status] ?? "badge"}`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      <span className="text-sm font-extrabold text-[var(--brand)]">
                        {order.totalAmount} сом
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CART BANNER убран отсюда — теперь floating внизу экрана ── */}

        {/* ── COMBOS ── */}
        {combos.length > 0 && (
          <section>
            <SectionHeader
              title="Комбо-наборы"
              icon={<Flame className="w-4 h-4" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  className="card card-hover overflow-hidden flex relative"
                >

                  <div className="w-28 sm:w-36 shrink-0 bg-[var(--bg-muted)]">
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍗
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 pr-6">
                      <h3 className="text-sm font-extrabold leading-tight">
                        {combo.name}
                      </h3>
                      <span className="badge badge-brand shrink-0">
                        <Flame className="w-3 h-3" />
                        Выгодно
                      </span>
                    </div>
                    {combo.items && Array.isArray(combo.items) && (
                      <ul className="space-y-0.5 mb-3 flex-1">
                        {combo.items
                          .slice(0, 3)
                          .map((item: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5"
                            >
                              <span className="w-1 h-1 bg-[var(--brand)] rounded-full shrink-0" />
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        {combo.oldPrice && (
                          <p className="text-[10px] text-[var(--fg-subtle)] line-through">
                            {combo.oldPrice} сом
                          </p>
                        )}
                        <p className="text-base font-extrabold text-[var(--brand)]">
                          {combo.price} сом
                        </p>
                      </div>
                      {(() => {
                        const cartRef = comboCartItems[combo.id];
                        const qty = cartRef?.quantity ?? 0;
                        return qty > 0 ? (
                          <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartItemById(cartRef.cartItemId, qty - 1);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                              aria-label="Уменьшить"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs text-white min-w-[16px] text-center">
                              {qty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addComboToCart(combo.id);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                              aria-label="Увеличить"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addComboToCart(combo.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                            aria-label="Добавить в корзину"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── MINI COMBOS ── */}
        {miniCombos.length > 0 && (
          <section>
            <SectionHeader
              title="Мини-комбо"
              icon={<Sparkles className="w-4 h-4" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {miniCombos.map((combo) => (
                <div
                  key={combo.id}
                  className="card card-hover overflow-hidden flex relative"
                >
                  <div className="w-28 sm:w-36 shrink-0 bg-[var(--bg-muted)]">
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍗
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 pr-6">
                      <h3 className="text-sm font-extrabold leading-tight">
                        {combo.name}
                      </h3>
                      <span className="badge badge-brand shrink-0">
                        <Sparkles className="w-3 h-3" />
                        Мини
                      </span>
                    </div>
                    {combo.items && Array.isArray(combo.items) && (
                      <ul className="space-y-0.5 mb-3 flex-1">
                        {combo.items
                          .slice(0, 3)
                          .map((item: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5"
                            >
                              <span className="w-1 h-1 bg-[var(--brand)] rounded-full shrink-0" />
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        {combo.oldPrice && (
                          <p className="text-[10px] text-[var(--fg-subtle)] line-through">
                            {combo.oldPrice} сом
                          </p>
                        )}
                        <p className="text-base font-extrabold text-[var(--brand)]">
                          {combo.price} сом
                        </p>
                      </div>
                      {(() => {
                        const cartRef = comboCartItems[combo.id];
                        const qty = cartRef?.quantity ?? 0;
                        return qty > 0 ? (
                          <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartItemById(cartRef.cartItemId, qty - 1);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                              aria-label="Уменьшить"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs text-white min-w-[16px] text-center">
                              {qty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addComboToCart(combo.id);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                              aria-label="Увеличить"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addComboToCart(combo.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                            aria-label="Добавить в корзину"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── POPULAR ITEMS ── */}
        {(popularItems.length > 0 || menuCategories.length > 0) && (
          <section>
            <SectionHeader title="Меню" icon={<Star className="w-4 h-4" />} />

            {/* Категории-таблетки */}
            {menuCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-1 px-1">
                <button
                  onClick={() => setActiveCategoryId("all")}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    activeCategoryId === "all"
                      ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                      : "bg-white text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}
                >
                  Все
                </button>
                {menuCategories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                      activeCategoryId === cat.id
                        ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                        : "bg-white text-[var(--fg-muted)] border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    }`}
                  >
                    {cat.imageUrl && (
                      <img
                        src={cat.imageUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Блюда */}
            {(() => {
              const displayItems =
                activeCategoryId === "all"
                  ? popularItems
                  : (menuCategories.find((c: any) => c.id === activeCategoryId)
                      ?.items ?? []);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {displayItems.map((item: any, idx: number) => (
                    <div
                      key={item.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <MenuItemCard
                        item={item}
                        cartBySizeId={cartBySizeId}
                        cartByItemId={cartItems}
                        onAddToCart={addToCartWithSize}
                        onUpdateCart={updateCartItemById}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        )}

        {/* ── SIGN OUT ── */}
        <section style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn btn-secondary w-full"
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </button>
        </section>
      </main>

      {/* Modals */}
      <MenuItemDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        // Для обычных блюд
        cartItem={
          detailItem && !getSizeGroup(detailItem)
            ? cartItems[detailItem.id]
              ? {
                  id: cartItems[detailItem.id].cartItemId,
                  quantity: cartItems[detailItem.id].quantity,
                }
              : null
            : null
        }
        onAdd={(id) => addToCart(id)}
        onUpdate={(cartItemId, qty) => updateCartItemById(cartItemId, qty)}
        // Для блюд с размерами
        sizeGroup={detailItem ? getSizeGroup(detailItem) : null}
        cartByOption={
          detailItem
            ? (() => {
                const sg = getSizeGroup(detailItem);
                if (!sg) return {};
                const optMap: Record<
                  string,
                  { id: string; quantity: number; cartItemId: string }
                > = {};
                sg.group.options.forEach((opt: any) => {
                  const key = `${detailItem.id}__${opt.id}`;
                  const ref = cartByOption[key];
                  if (ref)
                    optMap[opt.id] = {
                      id: ref.cartItemId,
                      quantity: ref.quantity,
                      cartItemId: ref.cartItemId,
                    };
                });
                return optMap;
              })()
            : {}
        }
        onAddSize={addSize}
        onUpdateSize={updateCartItemById}
        // Избранное
        showFavorite={false}
        isFavorite={false}
        onToggleFavorite={undefined}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <SideMenu
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        onAddToCart={(id) => addToCart(id)}
      />

      {/* ── COMBO MODAL ── */}
      {selectedCombo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedCombo(null)}
        >
          <div
            className="surface shadow-lg w-full max-w-md animate-scaleIn overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            {selectedCombo.imageUrl && (
              <div className="relative h-48 bg-[var(--bg-muted)]">
                <img
                  src={selectedCombo.imageUrl}
                  alt={selectedCombo.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedCombo(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4 text-[var(--fg)]" />
                </button>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-extrabold tracking-tight">
                  {selectedCombo.name}
                </h2>
                {!selectedCombo.imageUrl && (
                  <button
                    onClick={() => setSelectedCombo(null)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)]"
                    aria-label="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Состав */}
              {selectedCombo.items && Array.isArray(selectedCombo.items) && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-2">
                    Состав
                  </p>
                  <ul className="space-y-1.5">
                    {selectedCombo.items.map((item: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-[var(--fg-muted)]"
                      >
                        <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Цена */}
              <div className="flex items-baseline gap-2 mb-5">
                {selectedCombo.oldPrice && (
                  <span className="text-sm text-[var(--fg-subtle)] line-through">
                    {Number(selectedCombo.oldPrice)} сом
                  </span>
                )}
                <span className="text-2xl font-extrabold text-[var(--brand)]">
                  {Number(selectedCombo.price)} сом
                </span>
              </div>

              {/* Кнопки */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setSelectedCombo(null)}
                  className="btn btn-secondary flex-1"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => addComboToCart(selectedCombo.id)}
                  className="btn btn-primary flex-1"
                >
                  <ShoppingCart className="w-4 h-4" />В корзину
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING BUTTONS ── */}
      {/* На мобиле поднимаем выше bottom navigation (~84px) + safe-area */}
      <div
        className="fixed right-4 z-30 flex items-center gap-2"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
        }}
      >
        {/* Кнопка ИИ поддержки */}
        <button
          onClick={() => setAiChatOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 shadow-xl"
          style={{
            background: "linear-gradient(135deg, #111 0%, #d62300 100%)",
            animation: "aiPulse 2s ease-in-out infinite",
          }}
          aria-label="ИИ поддержка"
        >
          <Image src="/logo.png" alt="Miss Kurochka" width={40} height={40} className="rounded-full object-cover" />
        </button>

        <style jsx global>{`
          @keyframes aiPulse {
            0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(214, 35, 0, 0.45); }
            50%  { transform: scale(1.12); box-shadow: 0 0 0 10px rgba(214, 35, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(214, 35, 0, 0); }
          }
        `}</style>

        {/* Корзина */}
        {cartCount > 0 && (
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-2xl px-4 py-2.5 shadow-[var(--shadow-brand)] transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
              {cartCount}
            </div>
            <span className="font-extrabold text-sm">{cartTotal} сом</span>
            <ChevronRight className="w-4 h-4 opacity-80" />
          </button>
        )}
      </div>

      {/* Модальное окно ИИ чата */}
      <AiChatModal isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      {/* Окно "филиалы закрыты" — показывается только в нерабочее время (23:00–11:00) */}
      <BranchClosedModal />
    </div>
  );
}

// ── helpers ──

function SectionHeader({
  title,
  icon,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)] flex items-center gap-0.5"
        >
          Все <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
