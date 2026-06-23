"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { signOutWithCartCleanup } from "@/lib/cart-utils";
import {
  Home,
  ShoppingCart,
  Package,
  User,
  MapPin,
  HelpCircle,
  Settings,
  LogOut,
  X,
  ChevronRight,
  UtensilsCrossed,
  Store,
  Phone,
  Clock,
  ArrowLeft,
} from "lucide-react";

// Динамический импорт карты (SSR отключён — Leaflet требует window)
const BranchesMap = dynamic(() => import("@/components/map/BranchesMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-[var(--bg-muted)] flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[var(--fg-muted)] font-semibold">
        Загрузка карты...
      </span>
    </div>
  ),
});

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (menuItemId: string) => void;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

type Panel = "main" | "branches";

export default function SideMenu({
  isOpen,
  onClose,
  onAddToCart,
}: SideMenuProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [panel, setPanel] = useState<Panel>("main");
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (panel !== "main") setPanel("main");
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, panel]);

  // Закрываем боковую панель при открытии модалки избранного убрано

  // Блокируем скролл
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Сброс панели при закрытии
  useEffect(() => {
    if (!isOpen) setPanel("main");
  }, [isOpen]);

  // Загрузка филиалов
  const handleOpenBranches = async () => {
    setPanel("branches");
    if (branches.length === 0) {
      setLoadingBranches(true);
      try {
        const res = await fetch("/api/branches");
        const data = await res.json();
        if (res.ok) setBranches(data.data ?? data.branches ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBranches(false);
      }
    }
  };

  const user = session?.user;
  const initials = user?.fullName?.charAt(0).toUpperCase() ?? "?";

  const mainItems: NavItem[] = [
    { href: "/home", icon: <Home className="w-5 h-5" />, label: "Главная" },
    {
      href: "/menu",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      label: "Меню",
    },
    {
      href: "/cart",
      icon: <ShoppingCart className="w-5 h-5" />,
      label: "Корзина",
    },
    {
      href: "/orders",
      icon: <Package className="w-5 h-5" />,
      label: "Мои заказы",
    },
  ];

  const accountItems: NavItem[] = [
    { href: "/profile", icon: <User className="w-5 h-5" />, label: "Профиль" },
    {
      href: "/settings",
      icon: <Settings className="w-5 h-5" />,
      label: "Настройки",
    },
    {
      href: "/support",
      icon: <HelpCircle className="w-5 h-5" />,
      label: "Поддержка",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-250 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {/* ─── BRANCHES PANEL ─── */}
        {panel === "branches" && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col animate-slide-down">
            <PanelHeader
              title="Наши филиалы"
              icon={<MapPin className="w-4 h-4 text-[var(--brand)]" />}
              onBack={() => setPanel("main")}
            />

            {loadingBranches ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner />
              </div>
            ) : branches.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyPanel
                  icon={<Store className="w-10 h-10" />}
                  text="Филиалы не найдены"
                />
              </div>
            ) : (
              <>
                {/* Список филиалов */}
                <div
                  className="overflow-y-auto scrollbar-thin p-4 space-y-3"
                  style={{ maxHeight: "55%" }}
                >
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="rounded-2xl border border-[var(--border)] p-4 bg-[var(--bg-muted)]/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-extrabold">
                            {branch.name}
                          </h3>
                          <p className="text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">
                            {branch.address}
                          </p>
                          {branch.phone && (
                            <a
                              href={`tel:${branch.phone}`}
                              className="inline-flex items-center gap-1.5 text-xs text-[var(--brand)] font-semibold mt-2 hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {branch.phone}
                            </a>
                          )}
                          {branch.email && (
                            <p className="text-xs text-[var(--fg-muted)] mt-1">
                              {branch.email}
                            </p>
                          )}
                          {branch.schedules?.[0]?.openTime && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {branch.schedules[0].openTime} —{" "}
                                {branch.schedules[0].closeTime}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Мини-карта */}
                <div className="border-t border-[var(--border)] p-3 flex-1 min-h-0">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold mb-2 px-1">
                    На карте
                  </p>
                  <BranchesMap branches={branches} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── MAIN MENU ─── */}
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-3">
          {user ? (
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-extrabold truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-[var(--fg-muted)] truncate">
                  {user.email}
                </p>
              </div>
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              onClick={onClose}
              className="text-sm font-bold text-[var(--brand)]"
            >
              Войти
            </Link>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] shrink-0"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          <MenuGroup title="Меню">
            {mainItems.map((item) => (
              <MenuNavLink
                key={item.href}
                item={item}
                active={pathname === item.href}
                onClick={onClose}
              />
            ))}

            {/* Филиалы */}
            <button
              onClick={handleOpenBranches}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group text-[var(--fg)] hover:bg-[var(--bg-muted)]"
            >
              <span className="text-[var(--fg-muted)] group-hover:text-[var(--fg)]">
                <Store className="w-5 h-5" />
              </span>
              <span className="flex-1 text-left">Филиалы</span>
              <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)] opacity-0 group-hover:opacity-100 transition" />
            </button>
          </MenuGroup>

          <div className="my-2 mx-5 border-t border-[var(--border)]" />

          <MenuGroup title="Аккаунт">
            {accountItems.map((item) => (
              <MenuNavLink
                key={item.href}
                item={item}
                active={pathname === item.href}
                onClick={onClose}
              />
            ))}
          </MenuGroup>
        </nav>

        {/* Footer */}
        {user && (
          <div className="p-3 border-t border-[var(--border)]">
            <button
              onClick={() => {
                onClose();
                signOutWithCartCleanup(signOut, "/");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] transition"
            >
              <LogOut className="w-5 h-5" />
              Выйти из аккаунта
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── helpers ───

function PanelHeader({
  title,
  icon,
  onBack,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  badge?: string;
}) {
  return (
    <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--fg-muted)]"
        aria-label="Назад"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 flex-1">
        {icon}
        <h2 className="text-base font-extrabold">{title}</h2>
        {badge && <span className="badge badge-brand">{badge}</span>}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyPanel({
  icon,
  text,
  sub,
}: {
  icon: React.ReactNode;
  text: string;
  sub?: string;
}) {
  return (
    <div className="text-center py-10">
      <div className="text-[var(--fg-subtle)] flex justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[var(--fg-muted)]">{text}</p>
      {sub && (
        <p className="text-xs text-[var(--fg-subtle)] mt-1 px-4">{sub}</p>
      )}
    </div>
  );
}

function MenuGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 pb-1">
      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] font-bold px-3 py-2">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MenuNavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
        active
          ? "bg-[var(--brand-soft)] text-[var(--brand)]"
          : "text-[var(--fg)] hover:bg-[var(--bg-muted)]"
      }`}
    >
      <span
        className={
          active
            ? "text-[var(--brand)]"
            : "text-[var(--fg-muted)] group-hover:text-[var(--fg)]"
        }
      >
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge && <span className="badge badge-brand">{item.badge}</span>}
      <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)] opacity-0 group-hover:opacity-100 transition" />
    </Link>
  );
}
