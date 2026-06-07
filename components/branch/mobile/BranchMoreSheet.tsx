"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Sandwich,
  Zap,
  Ban,
  FileText,
  CirclePlus,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { branchTheme as c, haptic } from "./branchTheme";

interface SheetLink {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const links: SheetLink[] = [
  { href: "/branch/combo-offers", label: "Комбо-наборы", icon: Sandwich, color: "#60a5fa" },
  { href: "/branch/mini-combos", label: "Мини-комбо", icon: Zap, color: "#fbbf24" },
  { href: "/branch/stop-list", label: "Стоп-лист", icon: Ban, color: "#f87171" },
  { href: "/branch/reports", label: "Отчёты", icon: FileText, color: "#34d399" },
  { href: "/branch/additional-offers", label: "Доп. предложения", icon: CirclePlus, color: "#c084fc" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BranchMoreSheet({ open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  // Управляем монтированием для плавной анимации закрытия
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Блок скролла body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const handleNav = (href: string) => {
    haptic(8);
    onClose();
    router.push(href);
  };

  const handleLogout = async () => {
    haptic([10, 30, 10]);
    onClose();
    await signOut({ callbackUrl: "/branch/signin" });
  };

  // Swipe-to-close вниз
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragY(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > 110) {
      onClose();
    }
    startY.current = null;
    setDragY(0);
  };

  return (
    <div
      className="fixed inset-0 z-[70] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Дополнительные разделы"
      onAnimationEnd={() => {
        if (!open) setMounted(false);
      }}
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className={open ? "absolute inset-0 animate-fadeIn" : "absolute inset-0"}
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Sheet */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`absolute inset-x-0 bottom-0 flex flex-col ${open ? "animate-slide-up" : ""}`}
        style={{
          maxHeight: "88vh",
          background: "rgba(20, 26, 34, 0.92)",
          backdropFilter: "saturate(180%) blur(24px)",
          WebkitBackdropFilter: "saturate(180%) blur(24px)",
          borderTop: `1px solid ${c.borderStrong}`,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -12px 48px rgba(0,0,0,0.5)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 16px)",
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragY > 0 ? "none" : "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Grabber */}
        <div className="flex flex-col items-center pt-3 pb-2 shrink-0">
          <span
            className="w-10 h-1.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold" style={{ color: c.text }}>
            Все разделы
          </h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ backgroundColor: c.cardAlt, color: c.textMuted }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links grid */}
        <div className="overflow-y-auto px-4 scrollbar-hide">
          <div className="grid grid-cols-2 gap-3 pb-2">
            {links.map((l) => {
              const Icon = l.icon;
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <button
                  key={l.href}
                  onClick={() => handleNav(l.href)}
                  className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left active:scale-[0.97] transition-transform"
                  style={{
                    backgroundColor: active ? c.cardAlt : c.card,
                    border: `1px solid ${active ? "rgba(124,140,165,0.4)" : c.border}`,
                  }}
                >
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${l.color}20`, color: l.color }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <span className="text-sm font-bold" style={{ color: c.text }}>
                    {l.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 mt-3 mb-2 rounded-2xl font-bold active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: c.danger,
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left">Выйти из аккаунта</span>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
}
