"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Heart,
  Plus,
  ShoppingCart,
  Search,
  UtensilsCrossed,
  Leaf,
  Flame,
  Star,
} from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export interface FavoriteItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: { imageUrl: string; isPrimary: boolean }[];
  sizes: {
    id: string;
    name: string;
    price: number;
    weightGrams?: number | null;
    sortOrder?: number;
  }[];
  spices?: { id: string; name: string; price: number }[];
  isFeatured: boolean;
  isNew: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  spicyLevel?: number;
  cookingTimeMinutes?: number;
  ingredients?: string;
}

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (menuItemId: string) => Promise<void>;
  preloadedItems?: FavoriteItem[];
}

const STORAGE_KEY = "favorites";

function getFavoriteIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function FavoritesModal({
  isOpen,
  onClose,
  onAddToCart,
}: FavoritesModalProps) {
  const router = useRouter();
  const { ids: favoriteIds, toggle } = useFavorites();

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  // При каждом открытии — загружаем актуальные блюда по ID из localStorage
  useEffect(() => {
    if (!isOpen) return;

    const ids = getFavoriteIds();
    if (ids.length === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/menu/by-ids?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Когда пользователь убирает сердечко — убираем из списка сразу
  useEffect(() => {
    setItems((prev) => prev.filter((item) => favoriteIds.includes(item.id)));
  }, [favoriteIds]);

  // Блокируем скролл
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const handleAddToCart = async (item: FavoriteItem) => {
    if (!onAddToCart) return;
    setAddingId(item.id);
    try {
      await onAddToCart(item.id);
      setAddedIds((p) => [...p, item.id]);
      setTimeout(() => setAddedIds((p) => p.filter((x) => x !== item.id)), 1500);
    } finally {
      setAddingId(null);
    }
  };

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const pluralCount = (n: number) =>
    n === 1 ? "блюдо" : n < 5 ? "блюда" : "блюд";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxWidth: 740, maxHeight: "94vh", borderRadius: "24px 24px 0 0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ШАПКА */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border)] shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-[var(--brand)] fill-[var(--brand)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight">Избранное</h2>
            <p className="text-xs text-[var(--fg-muted)] font-semibold mt-0.5">
              {favoriteIds.length > 0
                ? `${favoriteIds.length} ${pluralCount(favoriteIds.length)}`
                : "Список пуст"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] transition shrink-0"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ПОИСК */}
        {items.length > 3 && (
          <div className="px-6 pt-4 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-subtle)]" />
              <input
                type="text"
                placeholder="Поиск среди избранных..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] text-sm font-semibold placeholder:text-[var(--fg-subtle)] focus:outline-none focus:border-[var(--brand)] focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* СПИСОК */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Загрузка */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--fg-muted)] font-semibold">Загружаем избранное...</p>
            </div>
          )}

          {/* Пусто */}
          {!loading && favoriteIds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-3xl bg-[var(--brand-soft)] flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-[var(--brand)]" />
              </div>
              <p className="text-xl font-extrabold mb-2">Список избранного пуст</p>
              <p className="text-sm text-[var(--fg-muted)] max-w-xs leading-relaxed">
                Нажмите <span className="text-[var(--brand)] font-bold">♡</span> на карточке
                любого блюда, чтобы добавить его сюда
              </p>
            </div>
          )}

          {/* Нет результатов поиска */}
          {!loading && favoriteIds.length > 0 && filtered.length === 0 && search && (
            <div className="text-center py-20">
              <UtensilsCrossed className="w-12 h-12 text-[var(--fg-subtle)] mx-auto mb-3" />
              <p className="text-sm font-bold text-[var(--fg-muted)]">Ничего не найдено</p>
              <p className="text-xs text-[var(--fg-subtle)] mt-1 mb-4">По запросу «{search}»</p>
              <button
                onClick={() => setSearch("")}
                className="text-sm text-[var(--brand)] font-bold hover:underline"
              >
                Сбросить поиск
              </button>
            </div>
          )}

          {/* КАРТОЧКИ */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((item) => {
                const img =
                  item.images?.find((i) => i.isPrimary)?.imageUrl ??
                  item.images?.[0]?.imageUrl;
                const sizes = [...(item.sizes ?? [])].sort(
                  (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
                );
                const firstSize = sizes[0];
                const price = firstSize?.price ?? item.price;
                const weight = firstSize?.weightGrams;
                const isAdding = addingId === item.id;
                const isAdded = addedIds.includes(item.id);
                const isFav = favoriteIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-2xl border border-[var(--border)] bg-white overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Фото */}
                    <div
                      className="relative w-full bg-[var(--bg-muted)] overflow-hidden"
                      style={{ aspectRatio: "16/9" }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🍗</div>
                      )}

                      {/* Бейджи */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {item.isFeatured && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand)] text-white font-bold uppercase tracking-wide">
                            <Flame className="w-2.5 h-2.5" /> Хит
                          </span>
                        )}
                        {item.isNew && !item.isFeatured && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold uppercase tracking-wide">
                            <Star className="w-2.5 h-2.5" /> Новинка
                          </span>
                        )}
                      </div>

                      {/* Кнопка избранного */}
                      <button
                        onClick={() => toggle(item.id)}
                        title={isFav ? "Убрать из избранного" : "В избранное"}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
                      >
                        <Heart
                          className={`w-4 h-4 transition-all duration-200 ${
                            isFav
                              ? "fill-[var(--brand)] text-[var(--brand)]"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Контент */}
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <h3 className="text-sm font-extrabold leading-snug line-clamp-2">
                        {item.name}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-[var(--fg-subtle)] line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Теги */}
                      <div className="flex flex-wrap gap-1.5">
                        {item.isVegan && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                            🌱 Веган
                          </span>
                        )}
                        {item.isVegetarian && !item.isVegan && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                            <Leaf className="w-2.5 h-2.5" /> Вегетарианское
                          </span>
                        )}
                        {(item.spicyLevel ?? 0) > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold">
                            {"🌶️".repeat(Math.min(item.spicyLevel ?? 0, 3))} Острое
                          </span>
                        )}
                        {item.cookingTimeMinutes && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--fg-subtle)] font-semibold">
                            ⏱ {item.cookingTimeMinutes} мин
                          </span>
                        )}
                      </div>

                      {/* Размеры */}
                      {sizes.length > 1 && (
                        <div className="flex flex-wrap gap-1">
                          {sizes.map((s) => (
                            <span
                              key={s.id}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--fg-muted)] font-semibold"
                            >
                              {s.weightGrams ? `${s.weightGrams} г` : s.name} — {Number(s.price)} сом
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Цена + кнопка */}
                      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                        <div className="flex items-end gap-2 min-w-0 flex-wrap">
                          <p className="text-lg font-extrabold text-[var(--brand)] shrink-0">
                            {Number(price)}{" "}
                            <span className="text-xs font-bold text-[var(--fg-muted)]">сом</span>
                          </p>
                          {weight && (
                            <span className="text-xs text-[var(--fg-subtle)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full font-semibold shrink-0">
                              {weight} г
                            </span>
                          )}
                        </div>

                        {onAddToCart && (
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={isAdding}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition shrink-0 ${
                              isAdded
                                ? "bg-emerald-500 text-white"
                                : "bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
                            } disabled:opacity-60`}
                          >
                            {isAdding ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isAdded ? (
                              <>✓ Добавлено</>
                            ) : (
                              <><Plus className="w-4 h-4" /> В корзину</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ФУТЕР */}
        {!loading && items.length > 0 && (
          <div className="px-6 py-4 border-t border-[var(--border)] shrink-0 flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--fg-muted)] font-semibold">
              {items.length} {pluralCount(items.length)} в избранном
            </p>
            {onAddToCart && (
              <button
                onClick={() => { onClose(); router.push("/cart"); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white font-bold text-sm hover:bg-[var(--brand-dark)] transition"
              >
                <ShoppingCart className="w-4 h-4" />
                Перейти в корзину
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
