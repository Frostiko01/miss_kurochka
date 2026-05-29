"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface MenuItem {
  name: string;
  nameRu: string;
  icon: string;
  href: string;
  badge?: number;
  badgeKey?: "newOrders";
}

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    nameRu: "Панель управления",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    href: "/branch/dashboard",
  },
  {
    name: "Orders",
    nameRu: "Заказы",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    href: "/branch/orders",
    badgeKey: "newOrders",
  },
  {
    name: "Menu",
    nameRu: "Меню",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    href: "/branch/menu",
  },
  {
    name: "Combo Offers",
    nameRu: "Комбо-наборы",
    icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
    href: "/branch/combo-offers",
  },
  {
    name: "Mini Combos",
    nameRu: "Мини-комбо",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    href: "/branch/mini-combos",
  },
  {
    name: "Stop List",
    nameRu: "Стоп-лист",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636",
    href: "/branch/stop-list",
  },
  {
    name: "Reports",
    nameRu: "Отчеты",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    href: "/branch/reports",
  },
];

export default function BranchSidebar({ onCollapsedChange }: { onCollapsedChange?: (collapsed: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  // Polling количества новых заказов
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/branch/orders?status=pending&limit=1");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNewOrdersCount(data.newCount ?? 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/branch/signin" });
  };

  return (
    <>
      {/* Sidebar - Dark Gray Theme */}
      <aside
        className={`fixed transition-all duration-300 z-40 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
        style={{
          backgroundColor: '#141A22',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          top: '105px',
          left: '16px',
          bottom: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute p-2 transition-all"
          style={{ 
            color: '#7C8CA5',
            top: '16px',
            right: '16px',
            backgroundColor: '#2A3442',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#344255';
            e.currentTarget.style.color = '#AAB7CC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2A3442';
            e.currentTarget.style.color = '#7C8CA5';
          }}
        >
          <svg
            className={`w-5 h-5 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-track-transparent" style={{ marginTop: '56px' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const badgeValue =
              item.badgeKey === "newOrders" ? newOrdersCount : item.badge;
            const showBadge = !!badgeValue && badgeValue > 0;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all relative"
                style={{
                  backgroundColor: isActive ? '#202937' : 'transparent',
                  color: isActive ? '#AAB7CC' : '#98A2B3',
                  borderRadius: '12px',
                  fontWeight: isActive ? '600' : '500'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1A212B';
                    e.currentTarget.style.color = '#F3F5F7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#98A2B3';
                  }
                }}
              >
                {isActive && (
                  <div 
                    className="absolute left-0 w-1 h-8"
                    style={{ 
                      background: '#7C8CA5',
                      borderRadius: '0 4px 4px 0'
                    }}
                  />
                )}
                <svg
                  className="w-6 h-6 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                {!isCollapsed && (
                  <>
                    <span className="text-sm flex-1 text-left">
                      {item.nameRu}
                    </span>
                    {showBadge && (
                      <span 
                        className={`text-white text-xs font-bold px-2 py-1 ${item.badgeKey === "newOrders" ? "animate-pulse" : ""}`}
                        style={{ 
                          background: item.badgeKey === "newOrders" ? '#fbbf24' : '#7C8CA5',
                          color: item.badgeKey === "newOrders" ? '#000' : '#fff',
                          borderRadius: '6px'
                        }}
                      >
                        {badgeValue && badgeValue > 99 ? '99+' : badgeValue}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && showBadge && (
                  <span 
                    className={`absolute -top-1 -right-1 text-xs font-bold w-5 h-5 flex items-center justify-center ${item.badgeKey === "newOrders" ? "animate-pulse" : ""}`}
                    style={{ 
                      background: item.badgeKey === "newOrders" ? '#fbbf24' : '#7C8CA5',
                      color: item.badgeKey === "newOrders" ? '#000' : '#fff',
                      borderRadius: '6px'
                    }}
                  >
                    {badgeValue && badgeValue > 9 ? '9+' : badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div 
          className="p-4"
          style={{ 
            backgroundColor: '#141A22',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 transition-all font-semibold"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EF4444';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#EF4444';
            }}
          >
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {!isCollapsed && <span className="text-sm">Выйти</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
