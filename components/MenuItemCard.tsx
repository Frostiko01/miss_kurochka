"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Minus, X, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

interface Size {
  id: string;
  name: string;
  price: number;
  weightGrams: number | null;
  sortOrder: number;
}

interface Spice {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
}

interface CartRef {
  quantity: number;
  cartItemId: string;
}

interface MenuItemCardProps {
  item: any;
  cartBySizeId: Record<string, CartRef>;
  cartByItemId: Record<string, CartRef>;
  onAddToCart: (
    menuItemId: string,
    sizeId: string | null,
    spiceIds: string[],
  ) => void;
  onUpdateCart: (cartItemId: string, qty: number) => void;
}

// ─── Bottom Sheet через Portal ────────────────────────────────────────────────
interface SpiceModalProps {
  item: any;
  initialSizeId: string | null;
  onAddToCart: (
    menuItemId: string,
    sizeId: string | null,
    spiceIds: string[],
  ) => void;
  onClose: () => void;
}

function SpiceModal({
  item,
  initialSizeId,
  onAddToCart,
  onClose,
}: SpiceModalProps) {
  const sizes: Size[] = item.sizes ?? [];
  const spices: Spice[] = item.spices ?? [];

  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    initialSizeId ?? sizes[0]?.id ?? null,
  );
  // Специи — радио (один вкус за раз), null = без специи
  const [selectedSpiceId, setSelectedSpiceId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Небольшая задержка чтобы CSS transition успел сработать
    const t = setTimeout(() => setVisible(true), 10);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  const selectedSize =
    sizes.find((s) => s.id === selectedSizeId) ?? sizes[0] ?? null;
  const basePrice = selectedSize
    ? Number(selectedSize.price)
    : Number(item.price ?? 0);
  const spiceExtra = selectedSpiceId
    ? Number(spices.find((s) => s.id === selectedSpiceId)?.price ?? 0)
    : 0;
  const totalPrice = basePrice + spiceExtra;

  const handleAdd = () => {
    onAddToCart(item.id, selectedSizeId, selectedSpiceId ? [selectedSpiceId] : []);
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!mounted) return null;

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      {/* Оверлей */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          transition: "opacity 0.3s ease",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Панель — на мобильном 100% ширины снизу, на десктопе центрированная */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "24px 24px 0 0",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Ручка */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 4px",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 99,
              backgroundColor: "#e0e0e0",
            }}
          />
        </div>

        {/* Фото */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {item.images?.[0]?.imageUrl ? (
            <img
              src={item.images[0].imageUrl}
              alt={item.name}
              style={{
                width: "100%",
                height: 220,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                backgroundColor: "#f5f5f7",
              }}
            >
              🍗
            </div>
          )}
          <button
            onClick={handleClose}
            aria-label="Закрыть"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.95)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <X size={18} color="#333" />
          </button>
        </div>

        {/* Скроллируемый контент */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 20px 8px" }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: "0 0 4px",
              lineHeight: 1.2,
            }}
          >
            {item.name}
          </h2>
          {item.description && (
            <p
              style={{
                fontSize: 14,
                color: "#888",
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </p>
          )}

          {/* Размеры */}
          {sizes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: 10,
                }}
              >
                Размер
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sizes.map((size) => {
                  const active = selectedSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSizeId(size.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        borderRadius: 16,
                        border: `2px solid ${active ? "var(--brand, #d62300)" : "#e8e8e8"}`,
                        backgroundColor: active
                          ? "var(--brand, #d62300)"
                          : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 15,
                          fontWeight: 700,
                          color: active ? "#fff" : "#222",
                        }}
                      >
                        {size.name}
                        {size.weightGrams && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: active ? "rgba(255,255,255,0.7)" : "#999",
                            }}
                          >
                            {size.weightGrams}г
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: active ? "#fff" : "var(--brand, #d62300)",
                        }}
                      >
                        {Number(size.price)} сом
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Специи — радио (один вкус за раз) */}
          {spices.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: 10,
                }}
              >
                Специи / соусы
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {spices.map((spice) => {
                  const selected = selectedSpiceId === spice.id;
                  return (
                    <button
                      key={spice.id}
                      onClick={() =>
                        setSelectedSpiceId(selected ? null : spice.id)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 16,
                        border: `2px solid ${selected ? "var(--brand, #d62300)" : "#e8e8e8"}`,
                        backgroundColor: selected
                          ? "rgba(214,35,0,0.06)"
                          : "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Радио-кружок */}
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: `2px solid ${selected ? "var(--brand, #d62300)" : "#ccc"}`,
                          backgroundColor: selected
                            ? "var(--brand, #d62300)"
                            : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {selected && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#fff",
                            }}
                          />
                        )}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 15,
                          fontWeight: 600,
                          color: selected ? "var(--brand, #d62300)" : "#222",
                        }}
                      >
                        {spice.name}
                      </span>
                      {Number(spice.price) > 0 && (
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: selected ? "var(--brand, #d62300)" : "#888",
                            flexShrink: 0,
                          }}
                        >
                          +{Number(spice.price)} сом
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка Выбрать */}
        <div style={{ padding: "12px 20px 32px", flexShrink: 0 }}>
          <button
            onClick={handleAdd}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 18,
              border: "none",
              backgroundColor: "var(--brand, #d62300)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Выбрать · {totalPrice} сом
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
// ─────────────────────────────────────────────────────────────────────────────

export default function MenuItemCard({
  item,
  cartBySizeId,
  cartByItemId,
  onAddToCart,
  onUpdateCart,
}: MenuItemCardProps) {
  const sizes: Size[] = item.sizes ?? [];
  const spices: Spice[] = item.spices ?? [];

  const hasSizes = sizes.length > 0;
  const hasSpices = spices.length > 0;
  const hasMultipleSizes = sizes.length > 1;

  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    sizes[0]?.id ?? null,
  );
  const [showModal, setShowModal] = useState(false);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  const selectedSize =
    sizes.find((s) => s.id === selectedSizeId) ?? sizes[0] ?? null;
  const displayPrice = selectedSize
    ? Number(selectedSize.price)
    : Number(item.price ?? 0);

  // Ищем в корзине: если есть размеры, ищем по selectedSizeId, иначе по menuItemId
  const currentCartRef = hasSizes && selectedSizeId
    ? cartBySizeId[selectedSizeId]
    : cartByItemId[item.id];
  const qty = currentCartRef?.quantity ?? 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSpices) {
      setShowModal(true);
    } else {
      onAddToCart(item.id, selectedSizeId, []);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCartRef) return;
    onUpdateCart(currentCartRef.cartItemId, qty - 1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSpices) {
      setShowModal(true);
    } else {
      onAddToCart(item.id, selectedSizeId, []);
    }
  };

  return (
    <>
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--border)] flex flex-col h-full">
        {/* Фото */}
        <div
          className="relative overflow-hidden bg-[var(--bg-muted)] cursor-pointer"
          style={{ aspectRatio: "4/3" }}
          onClick={() => setShowModal(true)}
        >
          {item.images?.[0]?.imageUrl ? (
            <img
              src={item.images[0].imageUrl}
              alt={item.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--fg-subtle)]">
              🍗
            </div>
          )}
          {item.isNew && !item.isFeatured && (
            <span className="absolute top-2 left-2 badge badge-success text-[10px]">
              Новинка
            </span>
          )}
          {item.isFeatured && (
            <span className="absolute top-2 left-2 badge badge-brand text-[10px]">
              Хит
            </span>
          )}
          {/* Кнопка избранного */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            aria-label={
              isFavorite(item.id)
                ? "Убрать из избранного"
                : "Добавить в избранное"
            }
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite(item.id)
                  ? "fill-[var(--brand)] text-[var(--brand)]"
                  : "text-gray-400"
              }`}
            />
          </button>
        </div>

        {/* Контент */}
        <div className="p-3 flex flex-col flex-1">
          <h3
            className="text-sm font-extrabold leading-tight mb-1 line-clamp-2 cursor-pointer hover:text-[var(--brand)] transition-colors"
            onClick={() => setShowModal(true)}
          >
            {item.name}
          </h3>

          {item.description && (
            <p className="text-[11px] text-[var(--fg-subtle)] line-clamp-2 mb-2">
              {item.description}
            </p>
          )}

          {/* Размеры — таблетки */}
          {hasMultipleSizes && (
            <div className="flex flex-wrap gap-1 mb-2">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSizeId(size.id);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition ${
                    selectedSizeId === size.id
                      ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                      : "bg-[var(--bg-muted)] text-[var(--fg-muted)] border-transparent hover:border-[var(--brand)]"
                  }`}
                >
                  {size.weightGrams ? `${size.weightGrams}г` : size.name}
                </button>
              ))}
            </div>
          )}

          {/* Один размер — просто вес */}
          {hasSizes && !hasMultipleSizes && selectedSize?.weightGrams && (
            <div className="mb-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--fg-subtle)] font-semibold">
                {selectedSize.weightGrams}г
              </span>
            </div>
          )}

          {/* Цена + кнопка */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-[var(--fg)]">
              {displayPrice}{" "}
              <span className="text-[10px] font-bold text-[var(--fg-muted)]">
                сом
              </span>
            </div>

            {hasSpices ? (
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
              >
                Выбрать
              </button>
            ) : qty > 0 ? (
              <div className="flex items-center gap-0.5 bg-[var(--brand)] rounded-full p-0.5">
                <button
                  onClick={handleDecrease}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                  aria-label="Уменьшить"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-xs text-white min-w-[16px] text-center">
                  {qty}
                </span>
                <button
                  onClick={handleIncrease}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
                  aria-label="Увеличить"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
                aria-label="Добавить"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </article>

      {showModal && (
        <SpiceModal
          item={item}
          initialSizeId={selectedSizeId}
          onAddToCart={onAddToCart}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
