"use client";

import { useEffect, useRef, useState } from "react";
import Toast from "@/components/admin/Toast";
import { Truck, Store, CreditCard, Globe, Smartphone, Clock, CheckCircle, XCircle, Package, Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemName?: string;
  menuItem?: {
    name: string;
  } | null;
  comboOffer?: {
    name: string;
  } | null;
  modifiers?: Array<{
    id: string;
    modifierOption: { name: string; priceDelta: number };
  }>;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerComment: string | null;
  orderType: "pickup" | "delivery";
  status: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  readyAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending:   { label: "Новый",        bg: "rgba(251, 191, 36, 0.2)",  text: "#fbbf24", dot: "#fbbf24" },
  confirmed: { label: "Подтверждён",  bg: "rgba(59, 130, 246, 0.2)",  text: "#60a5fa", dot: "#60a5fa" },
  preparing: { label: "Готовится",    bg: "rgba(249, 115, 22, 0.2)",  text: "#fb923c", dot: "#fb923c" },
  ready:     { label: "Готов",        bg: "rgba(34, 197, 94, 0.2)",   text: "#4ade80", dot: "#4ade80" },
  delivering:{ label: "У курьера",    bg: "rgba(168, 85, 247, 0.2)",  text: "#c084fc", dot: "#c084fc" },
  completed: { label: "Завершён",     bg: "rgba(16, 185, 129, 0.2)",  text: "#34d399", dot: "#34d399" },
  cancelled: { label: "Отменён",      bg: "rgba(239, 68, 68, 0.2)",   text: "#f87171", dot: "#f87171" },
};

// Возвращает следующее действие для заказа в зависимости от статуса и типа
interface NextAction {
  label: string;
  toStatus: string;
  color: string;
  icon: string;
}

function getNextActions(order: Order): NextAction[] {
  const actions: NextAction[] = [];
  switch (order.status) {
    case "pending":
      // Принять → автоматически перейдёт в preparing
      actions.push({
        label: "Принять",
        toStatus: "confirmed",
        color: "#3b82f6",
        icon: "M5 13l4 4L19 7",
      });
      break;
    case "confirmed":
    case "preparing":
      if (order.orderType === "delivery") {
        // Доставка: передать курьеру
        actions.push({
          label: "Передан курьеру",
          toStatus: "delivering",
          color: "#a855f7",
          icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2",
        });
      } else {
        // Самовывоз: готово — ждём клиента
        actions.push({
          label: "Готово",
          toStatus: "ready",
          color: "#22c55e",
          icon: "M5 13l4 4L19 7",
        });
      }
      break;
    case "delivering":
      // Доставка: курьер доставил — завершить
      actions.push({
        label: "Завершить",
        toStatus: "completed",
        color: "#10b981",
        icon: "M5 13l4 4L19 7",
      });
      break;
    case "ready":
      // Самовывоз: клиент забрал — завершить
      if (order.orderType === "pickup") {
        actions.push({
          label: "Завершить",
          toStatus: "completed",
          color: "#10b981",
          icon: "M5 13l4 4L19 7",
        });
      }
      break;
  }
  return actions;
}

function canCancel(order: Order): boolean {
  // Филиал может отменить только новый заказ (до принятия)
  return order.status === "pending";
}

const fmtTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtRelative = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return fmtTime(iso);
};

const getPaymentMethodText = (method: string) => {
  const m: Record<string, string> = {
    card: "Карта",
    online: "Онлайн",
    finik: "Finik",
  };
  return m[method] || method;
};

const POLL_INTERVAL = 15_000;

export default function BranchOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Звуковой сигнал при появлении нового заказа
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNewOrderIdRef = useRef<string | null>(null);

  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/branch/orders?${params}`);
      const data = await response.json();

      if (response.ok) {
        const list: Order[] = data.orders || [];
        setOrders(list);
        setNewCount(data.newCount ?? 0);

        // Проверяем появление нового pending заказа
        const newest = list.find((o) => o.status === "pending");
        if (
          newest &&
          lastNewOrderIdRef.current !== null &&
          lastNewOrderIdRef.current !== newest.id
        ) {
          // Появился новый заказ — играем звук + показываем тост
          try {
            audioRef.current?.play().catch(() => {});
          } catch {}
          setToast({
            message: `Поступил новый заказ ${newest.orderNumber}!`,
            type: "info",
          });
        }
        if (newest) {
          lastNewOrderIdRef.current = newest.id;
        } else if (lastNewOrderIdRef.current === null) {
          // первый запуск — фиксируем чтобы не звенело
          lastNewOrderIdRef.current = list[0]?.id ?? "";
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const response = await fetch("/api/branch/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        const meta = STATUS_META[newStatus];
        setToast({
          message: `Статус: ${meta?.label ?? newStatus}`,
          type: "success",
        });
        await fetchOrders(false);

        // Автоматические переходы:
        // confirmed → preparing (сразу начинаем готовить)
        if (newStatus === "confirmed") {
          setTimeout(() => handleStatusChange(orderId, "preparing"), 300);
        }
      } else {
        setToast({
          message: data.error || "Ошибка при обновлении статуса",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Отменить заказ?")) return;
    await handleStatusChange(orderId, "cancelled");
  };

  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: "#0B0F14" }}>
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
      />

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "#F3F5F7" }}
          >
            Заказы
          </h1>
          <p className="font-medium mt-2" style={{ color: "#98A2B3" }}>
            Управление заказами филиала
          </p>
        </div>
        {newCount > 0 && (
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{
              backgroundColor: "rgba(251, 191, 36, 0.15)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
            }}
          >
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: "#fbbf24" }}
            />
            <div>
              <div className="text-xs font-bold" style={{ color: "#98A2B3" }}>
                Новых заказов
              </div>
              <div className="text-2xl font-black" style={{ color: "#fbbf24" }}>
                {newCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Status Tabs */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          backgroundColor: "#1A212B",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "#98A2B3" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Поиск по номеру, имени или телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border"
              style={{
                backgroundColor: "#0B0F14",
                borderColor: "rgba(255,255,255,0.05)",
              }}
            />
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all",        label: "Все",             dot: null },
                { value: "pending",    label: "Новые",           dot: "#fbbf24" },
                { value: "confirmed",  label: "Подтверждённые",  dot: "#60a5fa" },
                { value: "preparing",  label: "Готовятся",       dot: "#fb923c" },
                { value: "ready",      label: "Готовы",          dot: "#4ade80" },
                { value: "delivering", label: "У курьера",       dot: "#c084fc" },
                { value: "completed",  label: "Завершённые",     dot: "#34d399" },
                { value: "cancelled",  label: "Отменённые",      dot: "#f87171" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: statusFilter === tab.value ? "#7C8CA5" : "#0B0F14",
                  color: statusFilter === tab.value ? "#fff" : "#98A2B3",
                  border: `1px solid ${statusFilter === tab.value ? "#7C8CA5" : "#2A3442"}`,
                }}
              >
                {tab.dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tab.dot }} />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div
          className="p-12 text-center rounded-2xl"
          style={{ backgroundColor: "#1A212B", border: "1px solid #202937" }}
        >
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 mx-auto"
            style={{ borderColor: "#202937", borderTopColor: "#7C8CA5" }}
          ></div>
          <p className="mt-4 font-semibold" style={{ color: "#98A2B3" }}>
            Загрузка...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div
          className="p-12 text-center rounded-2xl"
          style={{ backgroundColor: "#1A212B", border: "1px solid #202937" }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#202937" }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "#98A2B3" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: "#F3F5F7" }}
          >
            Заказы не найдены
          </h3>
          <p style={{ color: "#98A2B3" }}>
            Попробуйте изменить параметры поиска
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const statusMeta = STATUS_META[order.status] ?? STATUS_META.pending;
            const actions = getNextActions(order);
            const isUpdating = updatingId === order.id;
            const isNew = order.status === "pending";
            return (
              <div
                key={order.id}
                className="rounded-2xl p-6 transition-all"
                style={{
                  backgroundColor: "#1A212B",
                  border: `1px solid ${isNew ? "rgba(251, 191, 36, 0.4)" : "#202937"}`,
                  boxShadow: isNew
                    ? "0 0 0 3px rgba(251, 191, 36, 0.08)"
                    : undefined,
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Order Number / Time */}
                  <div className="flex-shrink-0 lg:w-44">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="text-xl font-black"
                        style={{ color: "#7C8CA5" }}
                      >
                        {order.orderNumber}
                      </div>
                    </div>
                    <div
                      className="text-xs font-bold"
                      style={{ color: "#98A2B3" }}
                    >
                      {fmtRelative(order.createdAt)}
                    </div>
                    <div
                      className="text-xs mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                      style={{
                        backgroundColor: "#0B0F14",
                        color: "#98A2B3",
                      }}
                    >
                      {order.orderType === "delivery"
                        ? <><Truck className="w-3 h-3" /> Доставка</>
                        : <><Store className="w-3 h-3" /> Самовывоз</>
                      }
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white mb-1 truncate">
                      {order.customerName}
                    </div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: "#98A2B3" }}
                    >
                      {order.customerPhone}
                    </div>
                    <div className="text-sm mt-2" style={{ color: "#98A2B3" }}>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "блюдо" : "блюд"} · {" "}
                      {order.items.reduce((s, i) => s + i.quantity, 0)} шт.
                    </div>
                    {order.customerComment && (
                      <div
                        className="text-xs mt-2 italic line-clamp-2"
                        style={{ color: "#98A2B3" }}
                      >
                        💬 {order.customerComment.split("\n")[0]}
                      </div>
                    )}
                  </div>

                  {/* Amount + payment */}
                  <div className="flex-shrink-0 text-right">
                    <div
                      className="text-2xl font-black"
                      style={{ color: "#F3F5F7" }}
                    >
                      {order.totalAmount}
                      <span
                        className="text-base ml-1"
                        style={{ color: "#98A2B3" }}
                      >
                        сом
                      </span>
                    </div>
                    <div
                      className="text-xs font-bold mt-1"
                      style={{ color: "#98A2B3" }}
                    >
                      {getPaymentMethodText(order.paymentMethod)}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                      style={{
                        backgroundColor: statusMeta.bg,
                        color: statusMeta.text,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: statusMeta.dot }}
                      />
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div
                  className="flex flex-wrap items-center gap-2 mt-4 pt-4"
                  style={{ borderTop: "1px solid #202937" }}
                >
                  {actions.map((action) => (
                    <button
                      key={action.toStatus}
                      onClick={() => handleStatusChange(order.id, action.toStatus)}
                      disabled={isUpdating}
                      className="flex-1 lg:flex-initial px-5 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 text-white"
                      style={{
                        backgroundColor: action.color,
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
                          strokeWidth={2.5}
                          d={action.icon}
                        />
                      </svg>
                      {action.label}
                    </button>
                  ))}

                  {/* Индикатор автоматической готовки */}
                  {(order.status === "confirmed" || order.status === "preparing") && order.orderType !== "delivery" && (
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold"
                      style={{ backgroundColor: "rgba(249,115,22,0.15)", color: "#fb923c" }}
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Готовится...
                    </div>
                  )}

                  {canCancel(order) && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={isUpdating}
                      className="px-4 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      Отменить
                    </button>
                  )}

                  <button
                    onClick={() => openDetailsModal(order)}
                    className="px-4 py-2.5 rounded-lg font-bold text-sm transition-all"
                    style={{
                      backgroundColor: "#0B0F14",
                      color: "#98A2B3",
                      border: "1px solid #2A3442",
                      marginLeft: "auto",
                    }}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(11,15,20,0.82)', backdropFilter: 'blur(4px)' }}>
          <div
            className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#1A212B" }}
          >
            <div className="p-6 border-b" style={{ borderColor: "#202937" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-2xl font-bold"
                    style={{ color: "#7C8CA5" }}
                  >
                    Заказ {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "#98A2B3" }}>
                    {fmtTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 rounded-lg transition-all"
                  style={{ color: "#98A2B3" }}
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h4
                  className="text-sm font-bold uppercase mb-3"
                  style={{ color: "#98A2B3" }}
                >
                  Информация о клиенте
                </h4>
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{
                    backgroundColor: "#0B0F14",
                    border: "1px solid #202937",
                  }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: "#98A2B3" }}>Имя:</span>
                    <span className="font-bold text-white">
                      {selectedOrder.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#98A2B3" }}>Телефон:</span>
                    <span className="font-bold text-white">
                      {selectedOrder.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#98A2B3" }}>Тип:</span>
                    <span className="font-bold text-white inline-flex items-center gap-1">
                      {selectedOrder.orderType === "delivery"
                        ? <><Truck className="w-3.5 h-3.5" /> Доставка</>
                        : <><Store className="w-3.5 h-3.5" /> Самовывоз</>}
                    </span>
                  </div>
                  {selectedOrder.customerComment && (
                    <div
                      className="pt-2 border-t"
                      style={{ borderColor: "#202937" }}
                    >
                      <span style={{ color: "#98A2B3" }}>Комментарий:</span>
                      <p className="font-bold text-white mt-1 whitespace-pre-line">
                        {selectedOrder.customerComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4
                  className="text-sm font-bold uppercase mb-3"
                  style={{ color: "#98A2B3" }}
                >
                  Состав заказа
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "#0B0F14",
                        border: "1px solid #202937",
                      }}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white">
                            {item.itemName ??
                              item.menuItem?.name ??
                              item.comboOffer?.name ??
                              ""}
                          </div>
                          <div
                            className="text-sm mt-0.5"
                            style={{ color: "#98A2B3" }}
                          >
                            {item.quantity} × {item.unitPrice} сом
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div
                              className="text-xs mt-2"
                              style={{ color: "#98A2B3" }}
                            >
                              {item.modifiers
                                .map((m) => m.modifierOption.name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                        <div
                          className="text-lg font-black shrink-0"
                          style={{ color: "#7C8CA5" }}
                        >
                          {item.totalPrice} сом
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div
                className="rounded-xl p-4 flex justify-between items-center"
                style={{
                  backgroundColor: "#0B0F14",
                  border: "1px solid #202937",
                }}
              >
                <span className="text-lg font-bold text-white">ИТОГО:</span>
                <span
                  className="text-2xl font-black"
                  style={{ color: "#7C8CA5" }}
                >
                  {selectedOrder.totalAmount} сом
                </span>
              </div>

              {/* Quick actions in modal */}
              <div className="flex flex-wrap gap-2">
                {getNextActions(selectedOrder).map((action) => (
                  <button
                    key={action.toStatus}
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, action.toStatus);
                      closeDetailsModal();
                    }}
                    className="flex-1 px-5 py-3 rounded-xl font-bold text-sm transition-all text-white"
                    style={{ backgroundColor: action.color }}
                  >
                    {action.label}
                  </button>
                ))}
                {canCancel(selectedOrder) && (
                  <button
                    onClick={() => {
                      handleCancel(selectedOrder.id);
                      closeDetailsModal();
                    }}
                    className="px-4 py-3 rounded-xl font-bold text-sm"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    Отменить
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
