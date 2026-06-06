"use client";

import { useState, useEffect } from "react";
import { Moon, Clock, Check, X } from "lucide-react";

// Рабочие часы филиалов по времени Кыргызстана (UTC+6)
const OPEN_HOUR = 11; // 11:00 — открытие
const CLOSE_HOUR = 23; // 23:00 — закрытие
const KG_OFFSET_HOURS = 6; // Кыргызстан = UTC+6 (без переходов на летнее время)

const STORAGE_KEY = "branchClosedAck";

/**
 * Возвращает текущий час (0–23) по времени Кыргызстана,
 * независимо от часового пояса устройства клиента.
 */
function getKyrgyzstanHour(): number {
  const now = new Date();
  // UTC-время в миллисекундах + смещение Кыргызстана
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const kgMs = utcMs + KG_OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(kgMs).getHours();
}

/**
 * Филиалы закрыты, если время вне диапазона [11:00, 23:00).
 * То есть с 23:00 вечера до 11:00 утра.
 */
function areBranchesClosed(): boolean {
  const hour = getKyrgyzstanHour();
  return hour < OPEN_HOUR || hour >= CLOSE_HOUR;
}

interface BranchClosedModalProps {
  /** Колбэк при согласии подождать (необязательный) */
  onAccept?: () => void;
}

export default function BranchClosedModal({ onAccept }: BranchClosedModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Показываем окно только в нерабочее время филиалов
    if (!areBranchesClosed()) return;

    // Если в этой сессии клиент уже ответил — не показываем снова
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // sessionStorage может быть недоступен — игнорируем
    }

    setIsOpen(true);
  }, []);

  // Блокируем прокрутку фона, пока окно открыто
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const remember = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // игнорируем недоступность storage
    }
  };

  const handleAccept = () => {
    remember();
    setIsOpen(false);
    onAccept?.();
  };

  const handleDecline = () => {
    remember();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      {/* Подложка */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDecline}
      />

      {/* Карточка */}
      <div className="relative z-10 w-full max-w-md animate-scaleIn">
        <div className="surface shadow-lg overflow-hidden rounded-2xl">
          {/* Шапка с акцентным фоном бренда */}
          <div className="relative px-6 pt-7 pb-6 bg-gradient-to-br from-[var(--brand)] to-[#FF5A1F] text-white overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/10" />

            <button
              onClick={handleDecline}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 text-white/90 transition"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight leading-tight">
                  Филиалы сейчас закрыты
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
                  <Clock className="w-4 h-4" />
                  <span>Работаем с {OPEN_HOUR}:00 до {CLOSE_HOUR}:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Тело */}
          <div className="p-6">
            <p className="text-[15px] leading-relaxed text-[var(--fg)]">
              Вы можете оформить заказ прямо сейчас, но{" "}
              <span className="font-bold text-[var(--brand)]">
                доставка и приготовление начнутся после открытия филиала
              </span>{" "}
              в {OPEN_HOUR}:00 утра.
            </p>

            <div className="mt-4 px-4 py-3 rounded-xl bg-[var(--brand-soft)] border border-[var(--border)]">
              <p className="text-sm text-[var(--fg-muted)]">
                Хотите оформить заказ заранее и получить его сразу после открытия?
              </p>
            </div>

            {/* Кнопки */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Согласен подождать
              </button>
              <button
                onClick={handleDecline}
                className="btn btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Не сейчас
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
