"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { LogOut, User, Package, Settings, ChevronDown } from "lucide-react";

interface UserMenuProps {
  mobile?: boolean;
  onAuthClick?: () => void;
  premium?: boolean;
}

export default function UserMenu({ mobile = false, onAuthClick, premium = false }: UserMenuProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (status === "loading") {
    return <div className="h-9 w-9 rounded-full bg-[var(--bg-muted)] animate-pulse" />;
  }

  // Не авторизован
  if (!session) {
    if (mobile) {
      return (
        <button
          onClick={onAuthClick}
          className="btn btn-primary w-full"
        >
          Войти
        </button>
      );
    }
    
    if (premium) {
      return (
        <button 
          onClick={onAuthClick} 
          className="flex items-center gap-2.5 px-6 h-[56px] rounded-[18px] text-sm font-bold bg-gradient-to-r from-[#FF3B1F] to-[#FF5A1F] text-white hover:shadow-[0_8px_24px_rgba(255,59,31,0.4)] transition-all duration-300 shadow-[0_4px_16px_rgba(255,59,31,0.3)]"
        >
          <User className="w-5 h-5" />
          <span>Войти</span>
        </button>
      );
    }
    
    return (
      <button onClick={onAuthClick} className="btn btn-secondary btn-sm">
        Войти
      </button>
    );
  }

  const initials = session.user.fullName.charAt(0).toUpperCase();
  const roleLabel =
    session.user.role === "customer"
      ? "Клиент"
      : session.user.role === "admin"
      ? "Администратор"
      : "Филиал";

  // Авторизован, мобильный
  if (mobile) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-muted)]">
          {session.user.avatarUrl ? (
            <img
              src={session.user.avatarUrl}
              alt={session.user.fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[var(--brand)] flex items-center justify-center text-white font-bold text-base">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{session.user.fullName}</p>
            <p className="text-xs text-[var(--fg-subtle)] truncate">{session.user.email}</p>
          </div>
        </div>

        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
        >
          <User className="w-4 h-4 text-[var(--fg-muted)]" />
          Профиль
        </Link>
        <Link
          href="/orders"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
        >
          <Package className="w-4 h-4 text-[var(--fg-muted)]" />
          Мои заказы
        </Link>
        {session.user.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
          >
            <Settings className="w-4 h-4 text-[var(--fg-muted)]" />
            Админ-панель
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] text-left"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    );
  }

  // Авторизован, десктоп (премиум)
  if (premium) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-6 h-[56px] rounded-[18px] text-sm font-bold bg-gradient-to-r from-[#FF3B1F] to-[#FF5A1F] text-white hover:shadow-[0_8px_24px_rgba(255,59,31,0.4)] transition-all duration-300 shadow-[0_4px_16px_rgba(255,59,31,0.3)]"
        >
          {session.user.avatarUrl ? (
            <img
              src={session.user.avatarUrl}
              alt={session.user.fullName}
              className="h-7 w-7 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
              {initials}
            </div>
          )}
          <span className="max-w-[100px] truncate">{session.user.fullName.split(' ')[0]}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[var(--border)] shadow-2xl py-1.5 z-50 animate-fadeIn">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-bold truncate">{session.user.fullName}</p>
              <p className="text-xs text-[var(--fg-subtle)] truncate mt-0.5">{session.user.email}</p>
              <span className="badge badge-brand mt-2">{roleLabel}</span>
            </div>

            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
              >
                <User className="w-4 h-4 text-[var(--fg-muted)]" />
                Профиль
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
              >
                <Package className="w-4 h-4 text-[var(--fg-muted)]" />
                Мои заказы
              </Link>
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
                >
                  <Settings className="w-4 h-4 text-[var(--fg-muted)]" />
                  Админ-панель
                </Link>
              )}
            </div>

            <div className="border-t border-[var(--border)] py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] text-left"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Авторизован, десктоп (обычный)
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[var(--bg-muted)] transition focus:outline-none"
      >
        {session.user.avatarUrl ? (
          <img
            src={session.user.avatarUrl}
            alt={session.user.fullName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-[var(--brand)] flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
        <div className="text-left max-w-[120px]">
          <p className="text-xs font-bold truncate leading-tight">{session.user.fullName}</p>
          <p className="text-[10px] text-[var(--fg-subtle)] truncate leading-tight">{roleLabel}</p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--fg-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[var(--border)] shadow-lg py-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-2.5 border-b border-[var(--border)]">
            <p className="text-sm font-bold truncate">{session.user.fullName}</p>
            <p className="text-xs text-[var(--fg-subtle)] truncate">{session.user.email}</p>
            <span className="badge badge-brand mt-2">{roleLabel}</span>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
            >
              <User className="w-4 h-4 text-[var(--fg-muted)]" />
              Профиль
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
            >
              <Package className="w-4 h-4 text-[var(--fg-muted)]" />
              Мои заказы
            </Link>
            {session.user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-muted)]"
              >
                <Settings className="w-4 h-4 text-[var(--fg-muted)]" />
                Админ-панель
              </Link>
            )}
          </div>

          <div className="border-t border-[var(--border)] py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] text-left"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
