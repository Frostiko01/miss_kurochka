"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ShoppingCart, Building2, UtensilsCrossed, Ban, Users, DollarSign, Truck, Store } from "lucide-react";

export type DashboardTheme = "branch" | "admin";

interface BranchOption {
  id: string;
  name: string;
}

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  todayAvgCheck: number;
  activeItems: number | null;
  stopListItems: number | null;
  pendingOrders: number;
  totalOrdersAllTime: number;
  totalRevenueAllTime: number;
  activeUsers: number;
  activeBranches: number;
  salesByDay: Array<{
    day: string;
    date: string;
    amount: number;
    ordersCount: number;
  }>;
  byStatus: Array<{ status: string; count: number }>;
  topItems: Array<{
    menuItemId: string | null;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  byOrderType: { pickup: number; delivery: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    orderType: string;
    totalAmount: number;
    createdAt: string;
    branchName?: string;
  }>;
  branchName?: string;
}

interface Props {
  theme: DashboardTheme;
  statsUrl: string; // /api/branch/stats или /api/admin/stats
  ordersHref: string; // /branch/orders или /admin/orders
  reportsHref: string; // /branch/reports или /admin/reports
  menuHref: string; // /branch/menu или /admin/menu
  // Только для админа: фильтр по филиалам
  branches?: BranchOption[];
  greetingName?: string | null;
}

const themes = {
  branch: {
    bg: "#0B0F14",
    card: "#1A212B",
    cardAlt: "#202937",
    border: "rgba(255,255,255,0.05)",
    text: "#F3F5F7",
    textMuted: "#98A2B3",
    accent: "#7C8CA5",
    accentBg: "rgba(124, 140, 165, 0.15)",
    inputBg: "#0B0F14",
    inputBorder: "#2A3442",
  },
  admin: {
    bg: "#050c26",
    card: "#181f38",
    cardAlt: "#242b47",
    border: "#242b47",
    text: "#FFFFFF",
    textMuted: "#a8b1cf",
    accent: "#4047ee",
    accentBg: "rgba(64, 71, 238, 0.15)",
    inputBg: "#050c26",
    inputBorder: "#242b47",
  },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Новые", color: "#fbbf24" },
  confirmed: { label: "Подтверждённые", color: "#60a5fa" },
  preparing: { label: "Готовятся", color: "#fb923c" },
  ready: { label: "Готовы", color: "#4ade80" },
  delivering: { label: "У курьера", color: "#c084fc" },
  completed: { label: "Завершённые", color: "#34d399" },
  cancelled: { label: "Отменённые", color: "#f87171" },
};

const STATUS_LABEL_SHORT: Record<string, string> = {
  pending: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "У курьера",
  completed: "Завершён",
  cancelled: "Отменён",
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtMoney = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} с`;

export default function DashboardView({
  theme,
  statsUrl,
  ordersHref,
  reportsHref,
  menuHref,
  branches,
  greetingName,
}: Props) {
  const t = themes[theme];
  const router = useRouter();
  const isAdmin = theme === "admin";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState<string>("all");

  const fetchStats = async () => {
    try {
      const url =
        isAdmin && branchFilter !== "all"
          ? `${statsUrl}?branchId=${encodeURIComponent(branchFilter)}`
          : statsUrl;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Stats fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter]);

  const maxAmount = stats
    ? Math.max(...stats.salesByDay.map((d) => d.amount), 1)
    : 1
  // Если выручки нет — используем ordersCount для визуализации
  const maxOrders = stats
    ? Math.max(...stats.salesByDay.map((d) => d.ordersCount), 1)
    : 1
  const useOrdersAsBar = stats
    ? stats.salesByDay.every((d) => d.amount === 0)
    : false
  const totalByType = stats
    ? stats.byOrderType.pickup + stats.byOrderType.delivery
    : 0;

  return (
    <div style={{ backgroundColor: t.bg, minHeight: "100vh" }} className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className={`text-4xl font-bold tracking-tight ${
              isAdmin ? "uppercase" : ""
            }`}
            style={{ color: t.text }}
          >
            Панель управления
          </h1>
          <p className="font-medium mt-2" style={{ color: t.textMuted }}>
            {greetingName
              ? `Добро пожаловать, ${greetingName}`
              : "Аналитика и текущая работа"}
            {stats?.branchName ? ` · ${stats.branchName}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && branches && branches.length > 0 && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm font-semibold focus:outline-none border"
              style={{
                backgroundColor: t.inputBg,
                color: t.text,
                borderColor: t.inputBorder,
              }}
            >
              <option value="all">Все филиалы</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {!!stats?.pendingOrders && stats.pendingOrders > 0 && (
            <button
              onClick={() => router.push(ordersHref)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
              style={{
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                color: "#fbbf24",
                border: "1px solid rgba(251, 191, 36, 0.3)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#fbbf24" }}
              />
              {stats.pendingOrders} ждут обработки
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          theme={t}
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Заказы сегодня"
          value={stats ? stats.todayOrders.toString() : "..."}
          accentColor="#60a5fa"
          loading={loading}
          subtitle={
            stats && stats.pendingOrders > 0
              ? `${stats.pendingOrders} в работе`
              : "Без новых задач"
          }
        />
        <StatCard
          theme={t}
          icon={<DollarSign className="w-5 h-5" />}
          label="Выручка сегодня"
          value={stats ? fmtMoney(stats.todayRevenue) : "..."}
          accentColor="#4ade80"
          loading={loading}
          subtitle={
            stats && stats.todayAvgCheck > 0
              ? `Средний чек: ${fmtMoney(stats.todayAvgCheck)}`
              : "Нет завершённых"
          }
        />
        {isAdmin ? (
          <>
            <StatCard
              theme={t}
              icon={<Users className="w-5 h-5" />}
              label="Клиенты"
              value={stats ? stats.activeUsers.toLocaleString() : "..."}
              accentColor="#c084fc"
              loading={loading}
              subtitle="Активных пользователей"
            />
            <StatCard
              theme={t}
              icon={<Building2 className="w-5 h-5" />}
              label="Филиалы"
              value={stats ? stats.activeBranches.toString() : "..."}
              accentColor="#fb923c"
              loading={loading}
              subtitle="Активных"
            />
          </>
        ) : (
          <>
            <StatCard
              theme={t}
              icon={<UtensilsCrossed className="w-5 h-5" />}
              label="Активные блюда"
              value={stats ? (stats.activeItems ?? 0).toString() : "..."}
              accentColor="#c084fc"
              loading={loading}
              subtitle="Доступны клиентам"
            />
            <StatCard
              theme={t}
              icon={<Ban className="w-5 h-5" />}
              label="В стоп-листе"
              value={stats ? (stats.stopListItems ?? 0).toString() : "..."}
              accentColor="#f87171"
              loading={loading}
              subtitle="Временно недоступны"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{
          backgroundColor: t.card,
          border: `1px solid ${t.border}`,
        }}
      >
        <h2
          className={`text-xl font-bold mb-5 ${isAdmin ? "uppercase" : ""}`}
          style={{ color: t.text }}
        >
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            theme={t}
            icon="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            title={isAdmin ? "Все заказы" : "Просмотр заказов"}
            description={
              isAdmin
                ? "Управление заказами всех филиалов"
                : "Управление текущими заказами"
            }
            badge={stats?.pendingOrders}
            onClick={() => router.push(ordersHref)}
          />
          <QuickAction
            theme={t}
            icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            title="Отчёты"
            description="Сформировать и скачать отчёт"
            onClick={() => router.push(reportsHref)}
          />
          <QuickAction
            theme={t}
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            title={isAdmin ? "Меню (категории)" : "Меню филиала"}
            description={
              isAdmin
                ? "Управление меню и категориями"
                : "Просмотр доступных блюд"
            }
            onClick={() => router.push(menuHref)}
          />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold" style={{ color: t.text }}>
                Продажи за 7 дней
              </h2>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>
                {stats && (() => {
                  const totalRevenue = stats.salesByDay.reduce((s, d) => s + d.amount, 0)
                  const totalOrders = stats.salesByDay.reduce((s, d) => s + d.ordersCount, 0)
                  if (totalRevenue > 0) return `Выручка: ${fmtMoney(totalRevenue)}`
                  if (totalOrders > 0) return `Заказов: ${totalOrders} (ещё не завершены)`
                  return 'Нет данных за период'
                })()}
              </p>
            </div>
            <button
              onClick={() => router.push(reportsHref)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: t.cardAlt,
                color: t.text,
              }}
            >
              Подробный отчёт →
            </button>
          </div>
          {loading ? (
            <SkeletonRows theme={t} />
          ) : !stats || stats.salesByDay.every((d) => d.amount === 0 && d.ordersCount === 0) ? (
            <EmptyChart theme={t} message="Нет заказов за период" />
          ) : (
            <div className="space-y-3">
              {stats.salesByDay.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-12 text-xs font-bold flex flex-col"
                    style={{ color: t.textMuted }}
                  >
                    <span>{d.day}</span>
                    <span className="text-[10px] opacity-70">
                      {d.date.slice(8, 10)}.{d.date.slice(5, 7)}
                    </span>
                  </div>
                  <div
                    className="flex-1 h-9 relative overflow-hidden rounded-lg"
                    style={{ backgroundColor: t.cardAlt }}
                  >
                    <div
                      className="h-full transition-all duration-500 flex items-center justify-end pr-3 rounded-lg"
                      style={{
                        width: useOrdersAsBar
                          ? `${Math.max((d.ordersCount / maxOrders) * 100, d.ordersCount > 0 ? 8 : 0)}%`
                          : `${Math.max((d.amount / maxAmount) * 100, d.amount > 0 ? 8 : 0)}%`,
                        background:
                          theme === "branch"
                            ? "linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)"
                            : "linear-gradient(135deg, #4047ee 0%, #5a61f0 100%)",
                        opacity: useOrdersAsBar ? 0.6 : 1,
                      }}
                    >
                      {useOrdersAsBar ? (
                        d.ordersCount > 0 && (
                          <span className="text-xs font-bold text-white whitespace-nowrap">
                            {d.ordersCount} зак.
                          </span>
                        )
                      ) : (
                        d.amount > 0 && (
                          <span className="text-xs font-bold text-white whitespace-nowrap">
                            {fmtMoney(d.amount)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div
                    className="text-xs font-semibold w-16 text-right"
                    style={{ color: t.textMuted }}
                  >
                    {d.ordersCount} зак.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status distribution */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <h2 className="text-xl font-bold mb-5" style={{ color: t.text }}>
            Статусы заказов
          </h2>
          {loading ? (
            <SkeletonRows theme={t} />
          ) : !stats || stats.byStatus.length === 0 ? (
            <EmptyChart theme={t} message="Нет данных" />
          ) : (
            <div className="space-y-2">
              {stats.byStatus
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const meta = STATUS_LABELS[s.status] ?? {
                    label: s.status,
                    color: "#64748b",
                  };
                  const total = stats.byStatus.reduce(
                    (sum, x) => sum + x.count,
                    0,
                  );
                  const pct = total > 0 ? (s.count / total) * 100 : 0;
                  return (
                    <div
                      key={s.status}
                      className="rounded-lg p-3"
                      style={{ backgroundColor: t.cardAlt }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                          <span
                            className="text-sm font-semibold"
                            style={{ color: t.text }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: t.text }}
                        >
                          {s.count}
                        </span>
                      </div>
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top items */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold" style={{ color: t.text }}>
                Топ блюд
              </h2>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>
                За последние 30 дней
              </p>
            </div>
          </div>
          {loading ? (
            <SkeletonRows theme={t} />
          ) : !stats || stats.topItems.length === 0 ? (
            <EmptyChart theme={t} message="Пока нет данных о продажах" />
          ) : (
            <div className="space-y-2">
              {stats.topItems.map((item, idx) => {
                const maxQty = Math.max(
                  ...stats.topItems.map((x) => x.quantity),
                  1,
                );
                return (
                  <div
                    key={item.menuItemId ?? idx}
                    className="rounded-lg p-3 flex items-center gap-3"
                    style={{ backgroundColor: t.cardAlt }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
                      style={{
                        backgroundColor: t.accentBg,
                        color: t.accent,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-sm truncate"
                        style={{ color: t.text }}
                      >
                        {item.name}
                      </div>
                      <div
                        className="h-1 mt-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${(item.quantity / maxQty) * 100}%`,
                            backgroundColor: t.accent,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-sm font-bold"
                        style={{ color: t.text }}
                      >
                        {item.quantity} шт.
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: t.textMuted }}
                      >
                        {fmtMoney(item.revenue)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order types pie */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <h2 className="text-xl font-bold mb-5" style={{ color: t.text }}>
            Тип заказа
          </h2>
          {loading ? (
            <SkeletonRows theme={t} />
          ) : !stats || totalByType === 0 ? (
            <EmptyChart theme={t} message="Нет заказов" />
          ) : (
            <div className="space-y-4">
              <OrderTypeRow
                theme={t}
                icon={<Truck className="w-4 h-4" />}
                label="Доставка"
                count={stats.byOrderType.delivery}
                total={totalByType}
                color="#c084fc"
              />
              <OrderTypeRow
                theme={t}
                icon={<Store className="w-4 h-4" />}
                label="Самовывоз"
                count={stats.byOrderType.pickup}
                total={totalByType}
                color="#4ade80"
              />
              <div
                className="pt-3 mt-2 text-center"
                style={{
                  borderTop: `1px solid ${t.border}`,
                }}
              >
                <div
                  className="text-xs font-semibold"
                  style={{ color: t.textMuted }}
                >
                  Всего за 30 дней
                </div>
                <div
                  className="text-2xl font-black mt-1"
                  style={{ color: t.text }}
                >
                  {totalByType}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All-time stats + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All-time */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <h2 className="text-xl font-bold mb-5" style={{ color: t.text }}>
            За всё время
          </h2>
          {loading ? (
            <SkeletonRows theme={t} />
          ) : (
            <div className="space-y-4">
              <div>
                <div
                  className="text-xs font-bold uppercase mb-1"
                  style={{ color: t.textMuted }}
                >
                  Заказов всего
                </div>
                <div
                  className="text-3xl font-black"
                  style={{ color: t.text }}
                >
                  {stats?.totalOrdersAllTime.toLocaleString() ?? 0}
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-bold uppercase mb-1"
                  style={{ color: t.textMuted }}
                >
                  Выручка всего
                </div>
                <div
                  className="text-3xl font-black"
                  style={{ color: t.accent }}
                >
                  {stats ? fmtMoney(stats.totalRevenueAllTime) : "—"}
                </div>
              </div>
              <button
                onClick={() => router.push(reportsHref)}
                className="w-full mt-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors"
                style={{
                  backgroundColor: t.accent,
                  color: "#fff",
                }}
              >
                Скачать полный отчёт
              </button>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold" style={{ color: t.text }}>
              Последние заказы
            </h2>
            <button
              onClick={() => router.push(ordersHref)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: t.cardAlt,
                color: t.text,
              }}
            >
              Все заказы →
            </button>
          </div>
          {loading ? (
            <SkeletonRows theme={t} />
          ) : !stats || stats.recentOrders.length === 0 ? (
            <EmptyChart theme={t} message="Заказов ещё нет" />
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((order) => {
                const meta = STATUS_LABELS[order.status] ?? {
                  label: STATUS_LABEL_SHORT[order.status] ?? order.status,
                  color: "#64748b",
                };
                return (
                  <button
                    key={order.id}
                    onClick={() => router.push(ordersHref)}
                    className="w-full rounded-lg p-3 flex items-center gap-3 transition-colors text-left"
                    style={{ backgroundColor: t.cardAlt }}
                  >
                    <div
                      className="shrink-0"
                      style={{ color: order.orderType === "delivery" ? "#c084fc" : "#fb923c" }}
                      title={order.orderType === "delivery" ? "Доставка" : "Самовывоз"}
                    >
                      {order.orderType === "delivery"
                        ? <Truck className="w-5 h-5" />
                        : <Store className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-bold text-sm"
                          style={{ color: t.text }}
                        >
                          {order.orderNumber}
                        </span>
                        <span
                          className="text-xs font-semibold truncate"
                          style={{ color: t.textMuted }}
                        >
                          {order.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${meta.color}25`,
                            color: meta.color,
                          }}
                        >
                          {STATUS_LABEL_SHORT[order.status] ?? order.status}
                        </span>
                        {isAdmin && order.branchName && (
                          <span
                            className="text-[10px] font-semibold truncate"
                            style={{ color: t.textMuted }}
                          >
                            · {order.branchName}
                          </span>
                        )}
                        <span
                          className="text-[10px] ml-auto"
                          style={{ color: t.textMuted }}
                        >
                          {fmtTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="text-sm font-black shrink-0"
                      style={{ color: t.text }}
                    >
                      {order.totalAmount} с
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ ВНУТРЕННИЕ КОМПОНЕНТЫ ============

function StatCard({
  theme,
  icon,
  label,
  value,
  accentColor,
  loading,
  subtitle,
}: {
  theme: typeof themes.branch;
  icon: ReactNode;
  label: string;
  value: string;
  accentColor: string;
  loading: boolean;
  subtitle?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: theme.card,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex justify-center mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-xs font-bold uppercase mb-1.5 text-center"
        style={{ color: theme.textMuted }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-black truncate text-center"
        style={{ color: theme.text }}
      >
        {loading ? (
          <span className="inline-block w-20 h-7 rounded animate-pulse" style={{ backgroundColor: theme.cardAlt }} />
        ) : (
          value
        )}
      </p>
      {subtitle && (
        <p
          className="text-xs font-medium mt-1.5 text-center"
          style={{ color: theme.textMuted }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function QuickAction({
  theme,
  icon,
  title,
  description,
  badge,
  onClick,
}: {
  theme: typeof themes.branch;
  icon: string;
  title: string;
  description: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl transition-all hover:opacity-90"
      style={{
        backgroundColor: theme.cardAlt,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: theme.accentBg,
            color: theme.accent,
          }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={icon}
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="font-bold text-sm truncate"
              style={{ color: theme.text }}
            >
              {title}
            </h3>
            {!!badge && badge > 0 && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse"
                style={{
                  backgroundColor: "#fbbf24",
                  color: "#000",
                }}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </div>
          <p
            className="text-xs mt-0.5 font-medium"
            style={{ color: theme.textMuted }}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

function OrderTypeRow({
  theme,
  icon,
  label,
  count,
  total,
  color,
}: {
  theme: typeof themes.branch;
  icon: ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span
            className="text-sm font-semibold"
            style={{ color: theme.text }}
          >
            {label}
          </span>
        </div>
        <div className="text-right">
          <span
            className="text-sm font-black"
            style={{ color: theme.text }}
          >
            {count}
          </span>
          <span
            className="text-xs ml-1"
            style={{ color: theme.textMuted }}
          >
            ({pct.toFixed(0)}%)
          </span>
        </div>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: theme.cardAlt }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function SkeletonRows({ theme }: { theme: typeof themes.branch }) {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-10 rounded-lg animate-pulse"
          style={{ backgroundColor: theme.cardAlt }}
        />
      ))}
    </div>
  );
}

function EmptyChart({
  theme,
  message,
}: {
  theme: typeof themes.branch;
  message: string;
}) {
  return (
    <div className="text-center py-10">
      <svg
        className="w-12 h-12 mx-auto mb-3 opacity-40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ color: theme.textMuted }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p className="text-sm" style={{ color: theme.textMuted }}>
        {message}
      </p>
    </div>
  );
}
