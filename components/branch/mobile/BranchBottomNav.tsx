"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, ClipboardList, UtensilsCrossed, Grid3x3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { branchTheme as c, haptic } from "./branchTheme";

interface NavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  matchPaths?: string[];
  isMore?: boolean;
  showBadge?: boolean;
}

const items: NavItem[] = [
  { href: "/branch/dashboard", label: "Главная", icon: Home, matchPaths: ["/branch/dashboard"] },
  { href: "/branch/orders", label: "Заказы", icon: ClipboardList, matchPaths: ["/branch/orders"], showBadge: true },
  { href: "/branch/menu", label: "Меню", icon: UtensilsCrossed, matchPaths: ["/branch/menu"] },
  { label: "Ещё", icon: Grid3x3, isMore: true },
];

interface Props {
  onMoreClick: () => void;
  moreActive?: boolean;
}

export default function BranchBottomNav({ onMoreClick, moreActive }: Props) {
  const pathname = usePathname() || "/";
  const [newOrders, setNewOrders] = useState(0);

  // Polling количества новых заказов для badge
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/branch/orders?status=pending&limit=1");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNewOrders(data.newCount ?? 0);
      } catch {
        /* no-op */
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isActive = (item: NavItem) => {
    if (item.isMore) return !!moreActive;
    if (item.matchPaths?.includes(pathname)) return true;
    if (item.href && item.href !== "/" && pathname.startsWith(`${item.href}/`)) return true;
    return false;
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden"
      style={{
        background: "rgba(20, 26, 34, 0.82)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderTop: `1px solid ${c.borderStrong}`,
        paddingBottom: "env(safe-area-inset-bottom, 0)",
        boxShadow: "0 -6px 24px rgba(0,0,0,0.4)",
      }}
      aria-label="Навигация филиала"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1.5 pb-1.5" style={{ minHeight: 64 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const badge = item.showBadge && newOrders > 0;

          const inner = (
            <>
              <span
                className="relative inline-flex items-center justify-center w-11 h-8 rounded-xl transition-all duration-200 group-active:scale-90"
                style={{
                  backgroundColor: active ? c.accentBg : "transparent",
                  boxShadow: active ? "0 2px 12px rgba(124,140,165,0.25)" : "none",
                }}
              >
                <Icon
                  className="transition-all duration-200"
                  style={{ width: 22, height: 22, color: active ? c.accentLight : c.textMuted }}
                  strokeWidth={active ? 2.4 : 2}
                />
                {badge && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[10px] font-black animate-pulse"
                    style={{ backgroundColor: "#fbbf24", color: "#000" }}
                  >
                    {newOrders > 9 ? "9+" : newOrders}
                  </span>
                )}
              </span>
              <span
                className="text-[10px] font-bold leading-none transition-colors duration-200"
                style={{ color: active ? c.accentLight : c.textMuted }}
              >
                {item.label}
              </span>
            </>
          );

          return (
            <li key={item.label} className="flex-1">
              {item.isMore ? (
                <button
                  type="button"
                  onClick={() => {
                    haptic(12);
                    onMoreClick();
                  }}
                  className="group w-full h-full flex flex-col items-center justify-center gap-1 py-1 select-none"
                  aria-label={item.label}
                >
                  {inner}
                </button>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => haptic(8)}
                  className="group flex flex-col items-center justify-center gap-1 py-1 select-none"
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
