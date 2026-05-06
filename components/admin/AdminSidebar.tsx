"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface MenuItem {
  name: string;
  nameRu: string;
  nameKg: string;
  icon: string;
  href: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    nameRu: "Панель управления",
    nameKg: "Башкаруу панели",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    href: "/admin/dashboard",
  },
  {
    name: "Orders",
    nameRu: "Заказы",
    nameKg: "Заказдар",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    href: "/admin/orders",
    badge: 5,
  },
  {
    name: "Menu",
    nameRu: "Меню",
    nameKg: "Меню",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    href: "/admin/menu",
  },
  {
    name: "Categories",
    nameRu: "Категории",
    nameKg: "Категориялар",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    href: "/admin/categories",
  },
  {
    name: "Users",
    nameRu: "Пользователи",
    nameKg: "Колдонуучулар",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    href: "/admin/users",
  },
  {
    name: "Branches",
    nameRu: "Филиалы",
    nameKg: "Филиалдар",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    href: "/admin/branches",
  },
  {
    name: "Delivery Zones",
    nameRu: "Зоны доставки",
    nameKg: "Жеткирүү зоналары",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    href: "/admin/delivery-zones",
  },
  {
    name: "Banners",
    nameRu: "Баннеры",
    nameKg: "Баннерлер",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    href: "/admin/banners",
  },
  {
    name: "Stop List",
    nameRu: "Стоп-лист",
    nameKg: "Стоп-тизме",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    href: "/admin/stop-list",
  },
  {
    name: "Settings",
    nameRu: "Настройки",
    nameKg: "Жөндөөлөр",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    href: "/admin/settings",
  },
];

export default function AdminSidebar({ onCollapsedChange }: { onCollapsedChange?: (collapsed: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/signin" });
  };

  return (
    <>
      {/* Sidebar - Dark Modern Theme */}
      <aside
        className={`fixed backdrop-blur-xl transition-all duration-300 z-40 rounded-2xl ${
          isCollapsed ? "w-20" : "w-72"
        }`}
        style={{
          backgroundColor: '#181f38',
          borderColor: '#242b47',
          top: '105px',
          left: '16px',
          bottom: '16px',
        }}
      >
        {/* Toggle Button - positioned at top edge */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute p-2 rounded-lg transition-colors"
          style={{ 
            color: '#78819d',
            top: '-12px',
            right: '16px',
            backgroundColor: '#181f38',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181f38'}
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
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-track-transparent" style={{ marginTop: '24px' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative"
                style={{
                  backgroundColor: isActive ? '#4047ee' : 'transparent',
                  color: isActive ? 'white' : '#78819d',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#242b47';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#78819d';
                  }
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
                    d={item.icon}
                  />
                </svg>
                {!isCollapsed && (
                  <>
                    <span className="font-bold text-sm flex-1 text-left">
                      {item.nameRu}
                    </span>
                    {item.badge && (
                      <span className="text-white text-xs font-black px-2 py-1 rounded-full" style={{ backgroundColor: '#4047ee' }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <span className="absolute -top-1 -right-1 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4047ee' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 rounded-br-2xl" style={{ backgroundColor: '#181f38' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold"
            style={{
              backgroundColor: 'rgba(64, 71, 238, 0.1)',
              color: '#4047ee',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#242b47';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(64, 71, 238, 0.1)';
              e.currentTarget.style.color = '#4047ee';
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
            {!isCollapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
