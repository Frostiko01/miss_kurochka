"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ShoppingCart,
  DollarSign,
  UtensilsCrossed,
  Ban,
  ClipboardList,
  FileText,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { branchTheme as c, fmtMoney, haptic } from "./branchTheme";
import { usePullToRefresh } from "./usePullToRefresh";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  todayAvgCheck: number;
  activeItems: number | null;
  stopListItems: number | null;
  pendingOrders: number;
  totalOrdersAllTime: number;
  totalRevenueAllTime: number;
  salesByDay: Array<{ day: string; date: string; amount: number; ordersCount: number }>;
  byStatus: Array<{ status: string; count: number }>;
  branchName?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Новые", color: "#fbbf24" },
  confirmed: { label: "Подтверждённые", color: "#60a5fa" },
  preparing: { label: "Готовятся", color: "#fb923c" },
  ready: { label: "Готовы", color: "#4ade80" },
  delivering: { label: "У курьера", color: "#c084fc" },
  completed: { label: "Завершённые", color: "#34d399" },
  cancelled: { label: "Отменённые", color: "#f87171" },
};

interface Props {
  greetingName?: string | null;
  ordersHref: string;
  reportsHref: string;
  menuHref: string;
}

export default function BranchMobileDashboard({
  greetingName,
  ordersHref,
  reportsHref,
  menuHref,
}: Props) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/branch/stats");
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) setStats(data);
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStats]);

  const { containerRef, indicatorRef, refreshing } = usePullToRefresh(fetchStats);

  const maxAmount = stats ? Math.max(...stats.salesByDay.map((d) => d.amount), 1) : 1;
  const maxOrders = stats ? Math.max(...stats.salesByDay.map((d) => d.ordersCount), 1) : 1;
  const useOrdersAsBar = stats ? stats.salesByDay.every((d) => d.amount === 0) : false;
  const statusTotal = stats ? stats.byStatus.reduce((s, x) => s + x.count, 0) : 0;

  const go = (href: string) => {
    haptic(8);
    router.push(href);
  };

  return (
    <div className="relative px-4 pt-4">
      {/* Pull-to-refresh индикатор (управляется через ref, без ре-рендеров) */}
      <div
        ref={indicatorRef}
        className="absolute left-0 right-0 flex items-center justify-center overflow-hidden"
        style={{
          top: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <RefreshCw
          className={refreshing ? "animate-spin" : ""}
          style={{ width: 22, height: 22, color: c.accent }}
        />
      </div>

      <div ref={containerRef}>
        {/* Приветствие */}
        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: c.text }}>
            {greetingName ? `Привет, ${greetingName.split(" ")[0]}` : "Панель управления"}
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: c.textMuted }}>
            {stats?.branchName ? stats.branchName : "Аналитика и текущая работа"}
          </p>
        </div>

        {/* Баннер новых заказов */}
        {!loading && !!stats?.pendingOrders && stats.pendingOrders > 0 && (
          <button
            onClick={() => go(ordersHref)}
            className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-2xl active:scale-[0.98] transition-transform animate-fade-in"
            style={{
              backgroundColor: "rgba(251, 191, 36, 0.12)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: "#fbbf24" }} />
            <span className="flex-1 text-left text-sm font-bold" style={{ color: "#fbbf24" }}>
              {stats.pendingOrders} {pluralOrders(stats.pendingOrders)} ждут обработки
            </span>
            <ChevronRight className="w-4 h-4" style={{ color: "#fbbf24" }} />
          </button>
        )}

        {/* Карточки статистики 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="Заказы сегодня"
            value={stats ? stats.todayOrders.toString() : "..."} accent="#60a5fa" loading={loading}
            subtitle={stats && stats.pendingOrders > 0 ? `${stats.pendingOrders} в работе` : "Без новых задач"} />
          <StatCard icon={<DollarSign className="w-5 h-5" />} label="Выручка сегодня"
            value={stats ? fmtMoney(stats.todayRevenue) : "..."} accent="#4ade80" loading={loading}
            subtitle={stats && stats.todayAvgCheck > 0 ? `Чек: ${fmtMoney(stats.todayAvgCheck)}` : "Нет завершённых"} />
          <StatCard icon={<UtensilsCrossed className="w-5 h-5" />} label="Активные блюда"
            value={stats ? (stats.activeItems ?? 0).toString() : "..."} accent="#c084fc" loading={loading}
            subtitle="Доступны клиентам" />
          <StatCard icon={<Ban className="w-5 h-5" />} label="В стоп-листе"
            value={stats ? (stats.stopListItems ?? 0).toString() : "..."} accent="#f87171" loading={loading}
            subtitle="Недоступны" />
        </div>

        {/* Быстрые действия — горизонтальный скролл */}
        <div className="mb-5">
          <h2 className="text-base font-bold mb-3" style={{ color: c.text }}>Быстрые действия</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            <QuickCard icon={<ClipboardList className="w-6 h-6" />} title="Заказы"
              subtitle="Управление" accent="#60a5fa" badge={stats?.pendingOrders} onClick={() => go(ordersHref)} />
            <QuickCard icon={<FileText className="w-6 h-6" />} title="Отчёты"
              subtitle="Скачать" accent="#34d399" onClick={() => go(reportsHref)} />
            <QuickCard icon={<UtensilsCrossed className="w-6 h-6" />} title="Меню"
              subtitle="Блюда филиала" accent="#c084fc" onClick={() => go(menuHref)} />
          </div>
        </div>

        {/* График продаж — на всю ширину */}
        <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: c.card, border: `1px solid ${c.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: c.text }}>Продажи за 7 дней</h2>
              <p className="text-[11px] mt-0.5" style={{ color: c.textMuted }}>
                {stats && (() => {
                  const rev = stats.salesByDay.reduce((s, d) => s + d.amount, 0);
                  const ord = stats.salesByDay.reduce((s, d) => s + d.ordersCount, 0);
                  if (rev > 0) return `Выручка: ${fmtMoney(rev)}`;
                  if (ord > 0) return `Заказов: ${ord}`;
                  return "Нет данных за период";
                })()}
              </p>
            </div>
            <button onClick={() => go(reportsHref)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: c.cardAlt, color: c.text }}>
              Отчёт →
            </button>
          </div>
          {loading ? (
            <SkeletonRows />
          ) : !stats || stats.salesByDay.every((d) => d.amount === 0 && d.ordersCount === 0) ? (
            <EmptyState message="Нет заказов за период" />
          ) : (
            <div className="space-y-2.5">
              {stats.salesByDay.map((d, i) => {
                const pct = useOrdersAsBar
                  ? Math.max((d.ordersCount / maxOrders) * 100, d.ordersCount > 0 ? 10 : 0)
                  : Math.max((d.amount / maxAmount) * 100, d.amount > 0 ? 10 : 0);
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-9 text-[10px] font-bold flex flex-col leading-tight" style={{ color: c.textMuted }}>
                      <span>{d.day}</span>
                      <span className="opacity-60">{d.date.slice(8, 10)}.{d.date.slice(5, 7)}</span>
                    </div>
                    <div className="flex-1 h-8 relative overflow-hidden rounded-lg" style={{ backgroundColor: c.cardAlt }}>
                      <div
                        className="h-full transition-all duration-500 flex items-center justify-end pr-2 rounded-lg"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)",
                          opacity: useOrdersAsBar ? 0.65 : 1,
                        }}
                      >
                        {!useOrdersAsBar && d.amount > 0 && (
                          <span className="text-[10px] font-bold text-white whitespace-nowrap">{fmtMoney(d.amount)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] font-semibold w-10 text-right" style={{ color: c.textMuted }}>
                      {d.ordersCount} зак.
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Статусы заказов */}
        <div className="rounded-2xl p-4 mb-5" style={{ backgroundColor: c.card, border: `1px solid ${c.border}` }}>
          <h2 className="text-base font-bold mb-4" style={{ color: c.text }}>Статусы заказов</h2>
          {loading ? (
            <SkeletonRows />
          ) : !stats || stats.byStatus.length === 0 ? (
            <EmptyState message="Нет данных" />
          ) : (
            <div className="space-y-2.5">
              {stats.byStatus
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const meta = STATUS_LABELS[s.status] ?? { label: s.status, color: "#64748b" };
                  const pct = statusTotal > 0 ? (s.count / statusTotal) * 100 : 0;
                  return (
                    <div key={s.status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span className="text-sm font-semibold" style={{ color: c.text }}>{meta.label}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: c.text }}>{s.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* За всё время */}
        <div className="rounded-2xl p-4 mb-2" style={{ backgroundColor: c.card, border: `1px solid ${c.border}` }}>
          <h2 className="text-base font-bold mb-4" style={{ color: c.text }}>За всё время</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: c.cardAlt }}>
              <div className="text-[10px] font-bold uppercase mb-1" style={{ color: c.textMuted }}>Заказов</div>
              <div className="text-2xl font-black" style={{ color: c.text }}>
                {loading ? "..." : (stats?.totalOrdersAllTime.toLocaleString() ?? 0)}
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: c.cardAlt }}>
              <div className="text-[10px] font-bold uppercase mb-1" style={{ color: c.textMuted }}>Выручка</div>
              <div className="text-2xl font-black truncate" style={{ color: c.accentLight }}>
                {loading ? "..." : stats ? fmtMoney(stats.totalRevenueAllTime) : "—"}
              </div>
            </div>
          </div>
          <button onClick={() => go(reportsHref)} className="w-full px-4 py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
            style={{ backgroundColor: c.accent, color: "#fff" }}>
            Скачать полный отчёт
          </button>
        </div>
      </div>
    </div>
  );
}

function pluralOrders(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "заказ";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "заказа";
  return "заказов";
}

function StatCard({
  icon, label, value, accent, loading, subtitle,
}: {
  icon: ReactNode; label: string; value: string; accent: string; loading: boolean; subtitle?: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col" style={{ backgroundColor: c.card, border: `1px solid ${c.border}`, minHeight: 124 }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}20`, color: accent }}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase mb-1" style={{ color: c.textMuted }}>{label}</p>
      {loading ? (
        <span className="inline-block w-16 h-6 rounded animate-pulse" style={{ backgroundColor: c.cardAlt }} />
      ) : (
        <p className="text-2xl font-black truncate" style={{ color: c.text }}>{value}</p>
      )}
      {subtitle && !loading && (
        <p className="text-[10px] font-medium mt-auto pt-1 truncate" style={{ color: c.textMuted }}>{subtitle}</p>
      )}
    </div>
  );
}

function QuickCard({
  icon, title, subtitle, accent, badge, onClick,
}: {
  icon: ReactNode; title: string; subtitle: string; accent: string; badge?: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="relative shrink-0 w-36 text-left p-4 rounded-2xl active:scale-[0.97] transition-transform"
      style={{ backgroundColor: c.card, border: `1px solid ${c.border}` }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}20`, color: accent }}>
        {icon}
      </div>
      <div className="text-sm font-bold" style={{ color: c.text }}>{title}</div>
      <div className="text-[11px] font-medium mt-0.5" style={{ color: c.textMuted }}>{subtitle}</div>
      {!!badge && badge > 0 && (
        <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black animate-pulse"
          style={{ backgroundColor: "#fbbf24", color: "#000" }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: c.cardAlt }} />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm" style={{ color: c.textMuted }}>{message}</p>
    </div>
  );
}
