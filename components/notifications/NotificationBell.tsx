"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  branchId?: string | null;
  branchName?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  apiUrl: string; // /api/branch/notifications или /api/admin/notifications
  ordersUrl: string; // куда редиректить при клике на заказ /branch/orders или /admin/orders
  theme: "branch" | "admin";
}

const themes = {
  branch: {
    bg: "#1A212B",
    border: "rgba(255,255,255,0.05)",
    text: "#F3F5F7",
    textMuted: "#98A2B3",
    accent: "#7C8CA5",
    accentBg: "#202937",
    iconColor: "#AAB7CC",
    badgeBg: "#EF4444",
  },
  admin: {
    bg: "#181f38",
    border: "#242b47",
    text: "#FFFFFF",
    textMuted: "#a8b1cf",
    accent: "#4047ee",
    accentBg: "#242b47",
    iconColor: "#a8b1cf",
    badgeBg: "#EF4444",
  },
};

const POLL_INTERVAL = 15_000; // 15 сек

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getIconForType = (type: string) => {
  switch (type) {
    case "new_order":
      return "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z";
    case "order_cancelled":
      return "M6 18L18 6M6 6l12 12";
    case "payment":
      return "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
    default:
      return "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";
  }
};

export default function NotificationBell({
  apiUrl,
  ordersUrl,
  theme,
}: Props) {
  const t = themes[theme];
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasNewArrived, setHasNewArrived] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(apiUrl);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Тихо игнорируем — иначе при 500 UI ломается каждые 15 сек
        console.warn("Notifications:", data?.error ?? `HTTP ${res.status}`);
        return;
      }
      const list: Notification[] = data.notifications || [];
      setNotifications(list);
      setUnreadCount(data.unreadCount || 0);

      // Проверка появления новых уведомлений (звуковой сигнал)
      if (list.length > 0) {
        const newest = list[0];
        if (
          lastSeenIdRef.current &&
          newest.id !== lastSeenIdRef.current &&
          !newest.isRead
        ) {
          // Появилось новое — играем звук и анимируем
          setHasNewArrived(true);
          try {
            audioRef.current?.play().catch(() => {});
          } catch {}
          setTimeout(() => setHasNewArrived(false), 2000);
        }
        lastSeenIdRef.current = newest.id;
      }
    } catch (e) {
      console.error("Notifications fetch error:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  // Закрытие при клике вне дропдауна
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.isRead) handleMarkAsRead(n.id);
    if (n.orderId) {
      router.push(ordersUrl);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Звук уведомления (короткий beep base64) */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
      />

      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg transition-all ${
          hasNewArrived ? "animate-bounce" : ""
        }`}
        style={{
          color: t.iconColor,
          backgroundColor: open ? t.accentBg : "transparent",
        }}
        aria-label="Уведомления"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-black text-white"
            style={{ backgroundColor: t.badgeBg }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-[380px] max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{
            backgroundColor: t.bg,
            border: `1px solid ${t.border}`,
            maxHeight: "70vh",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${t.border}` }}
          >
            <div>
              <h3 className="font-bold" style={{ color: t.text }}>
                Уведомления
              </h3>
              <p className="text-xs" style={{ color: t.textMuted }}>
                {unreadCount > 0
                  ? `Непрочитанных: ${unreadCount}`
                  : "Все прочитано"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: t.accentBg,
                  color: t.text,
                }}
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <svg
                  className="w-12 h-12 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: t.textMuted }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  Уведомлений пока нет
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full flex items-start gap-3 px-4 py-3 transition-colors text-left"
                    style={{
                      borderBottom: `1px solid ${t.border}`,
                      backgroundColor: n.isRead
                        ? "transparent"
                        : "rgba(64, 71, 238, 0.05)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = t.accentBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = n.isRead
                        ? "transparent"
                        : "rgba(64, 71, 238, 0.05)";
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor:
                          n.type === "new_order"
                            ? "rgba(16, 185, 129, 0.15)"
                            : n.type === "order_cancelled"
                              ? "rgba(239, 68, 68, 0.15)"
                              : t.accentBg,
                        color:
                          n.type === "new_order"
                            ? "#10B981"
                            : n.type === "order_cancelled"
                              ? "#EF4444"
                              : t.accent,
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={getIconForType(n.type)}
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-sm font-semibold leading-snug"
                          style={{ color: t.text }}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span
                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: t.badgeBg }}
                          />
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5 leading-snug"
                        style={{ color: t.textMuted }}
                      >
                        {n.message}
                      </p>
                      {n.branchName && (
                        <p
                          className="text-[11px] mt-1 font-semibold"
                          style={{ color: t.accent }}
                        >
                          📍 {n.branchName}
                        </p>
                      )}
                      <p
                        className="text-[10px] mt-1"
                        style={{ color: t.textMuted, opacity: 0.7 }}
                      >
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
