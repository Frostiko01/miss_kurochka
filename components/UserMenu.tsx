"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

interface UserMenuProps {
  mobile?: boolean;
}

export default function UserMenu({ mobile = false }: UserMenuProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  // Незарегистрированный пользователь - МОБИЛЬНАЯ ВЕРСИЯ
  if (!session && mobile) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href="/auth/signin"
          className="text-left font-bold text-[#d62300] hover:text-[#b01e00] transition-colors py-2"
        >
          Войти
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-3 text-center font-bold text-white bg-[#d62300] hover:bg-[#b01e00] rounded-xl transition-colors shadow-lg"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  // Незарегистрированный пользователь - ДЕСКТОП
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/signin"
          className="text-sm font-bold text-gray-700 hover:text-[#d62300] transition-colors"
        >
          Войти
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 text-sm font-bold text-white bg-[#d62300] hover:bg-[#b01e00] rounded-lg transition-colors shadow-lg"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  // Авторизованный пользователь - МОБИЛЬНАЯ ВЕРСИЯ
  if (mobile) {
    return (
      <div className="flex flex-col gap-3">
        {/* Профиль пользователя */}
        <div className="flex items-center gap-3 pb-3 border-b-2 border-red-100">
          {session.user.avatarUrl ? (
            <img
              src={session.user.avatarUrl}
              alt={session.user.fullName}
              className="h-12 w-12 rounded-full object-cover border-2 border-[#d62300]"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-[#d62300] flex items-center justify-center text-white font-black text-lg">
              {session.user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-black text-gray-900">
              {session.user.fullName}
            </p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
            <p className="text-xs text-[#d62300] mt-1 capitalize font-bold">
              {session.user.role === "customer"
                ? "Клиент"
                : session.user.role === "admin"
                ? "Администратор"
                : "Филиал"}
            </p>
          </div>
        </div>

        {/* Ссылки */}
        <Link
          href="/profile"
          className="text-left font-bold text-[#d62300] hover:text-[#b01e00] transition-colors py-2"
        >
          Мой профиль
        </Link>
        <Link
          href="/orders"
          className="text-left font-bold text-[#d62300] hover:text-[#b01e00] transition-colors py-2"
        >
          Мои заказы
        </Link>
        {session.user.role === "admin" && (
          <Link
            href="/admin"
            className="text-left font-bold text-[#d62300] hover:text-[#b01e00] transition-colors py-2"
          >
            Панель администратора
          </Link>
        )}
        
        {/* Кнопка выхода */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-left font-bold text-red-600 hover:text-red-700 transition-colors py-2"
        >
          Выйти
        </button>
      </div>
    );
  }

  // Авторизованный пользователь - ДЕСКТОП (выпадающее меню)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none"
      >
        {session.user.avatarUrl ? (
          <img
            src={session.user.avatarUrl}
            alt={session.user.fullName}
            className="h-10 w-10 rounded-full object-cover border-2 border-[#d62300]"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-[#d62300] flex items-center justify-center text-white font-black">
            {session.user.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden md:block text-left">
          <p className="text-sm font-bold text-gray-900">
            {session.user.fullName}
          </p>
          <p className="text-xs text-gray-500">{session.user.email}</p>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-100 py-2 z-20">
            <div className="px-4 py-3 border-b-2 border-gray-100">
              <p className="text-sm font-black text-gray-900">
                {session.user.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
              <p className="text-xs text-[#d62300] mt-1 capitalize font-bold">
                {session.user.role === "customer"
                  ? "Клиент"
                  : session.user.role === "admin"
                  ? "Администратор"
                  : "Филиал"}
              </p>
            </div>

            <div className="py-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-[#d62300] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Мой профиль
              </Link>
              <Link
                href="/orders"
                className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-[#d62300] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Мои заказы
              </Link>
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-[#d62300] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Панель администратора
                </Link>
              )}
            </div>

            <div className="border-t-2 border-gray-100 py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
