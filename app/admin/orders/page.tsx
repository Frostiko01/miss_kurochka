"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemName?: string;
  menuItem?: { name: string } | null;
  comboOffer?: { name: string } | null;
  modifiers?: Array<{
    id: string;
    modifierOption: { name: string; priceDelta: number };
  }>;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
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
  branch: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
  } | null;
  items: OrderItem[];
  payments?: Payment[];
}

interface Branch {
  id: string;
  name: string;
}

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; icon: string }
> = {
  pending: { label: "Новый", bg: "rgba(251, 191, 36, 0.2)", text: "#fbbf24", icon: "🟡" },
  confirmed: { label: "Подтверждён", bg: "rgba(59, 130, 246, 0.2)", text: "#60a5fa", icon: "🔵" },
  preparing: { label: "Готовится", bg: "rgba(249, 115, 22, 0.2)", text: "#fb923c", icon: "🟠" },
  ready: { label: "Готов", bg: "rgba(34, 197, 94, 0.2)", text: "#4ade80", icon: "🟢" },
  delivering: { label: "У курьера", bg: "rgba(168, 85, 247, 0.2)", text: "#c084fc", icon: "🚚" },
  completed: { label: "Завершён", bg: "rgba(16, 185, 129, 0.2)", text: "#34d399", icon: "✅" },
  cancelled: { label: "Отменён", bg: "rgba(239, 68, 68, 0.2)", text: "#f87171", icon: "❌" },
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getPaymentMethodText = (method: string) => {
  const m: Record<string, string> = {
    card: "💳 Карта",
    online: "🌐 Онлайн",
    finik: "📱 Finik",
  };
  return m[method] || method;
};

// Извлекает строку адреса из customerComment (там сохраняется при доставке)
const extractDeliveryAddress = (comment: string | null): string | null => {
  if (!comment) return null;
  const m = comment.match(/📍 Адрес доставки: ([^\n]+)/);
  return m ? m[1] : null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, branchFilter]);

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/admin/branches");
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : data.branches ?? [];
        setBranches(list);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (branchFilter !== "all") params.append("branchId", branchFilter);

      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
        setNewCount(data.newCount ?? 0);
      } else {
        console.error("Failed to fetch orders:", data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (response.ok) {
        const meta = STATUS_META[newStatus];
        setToast({
          message: `Статус: ${meta?.label ?? newStatus}`,
          type: "success",
        });
        await fetchOrders();
      } else {
        setToast({
          message: "Ошибка при обновлении статуса",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({
        message: "Ошибка сети",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
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
    <div className="p-8 min-h-screen" style={{ backgroundColor: "#050c26" }}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ color: "white" }}
          >
            Заказы
          </h1>
          <p className="font-semibold mt-2" style={{ color: "#78819d" }}>
            Управление заказами всех филиалов
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
              <div className="text-xs font-bold" style={{ color: "#a8b1cf" }}>
                Требуют внимания
              </div>
              <div className="text-2xl font-black" style={{ color: "#fbbf24" }}>
                {newCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ backgroundColor: "#181f38" }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#78819d" }}
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
                  backgroundColor: "#050c26",
                  borderColor: "#242b47",
                }}
              />
            </div>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-3 rounded-xl text-white text-sm font-semibold focus:outline-none transition-all border"
              style={{
                backgroundColor: "#050c26",
                borderColor: "#242b47",
                minWidth: 220,
              }}
            >
              <option value="all">Все филиалы</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "Все" },
                { value: "pending", label: "🟡 Новые" },
                { value: "confirmed", label: "🔵 Подтверждённые" },
                { value: "preparing", label: "🟠 Готовятся" },
                { value: "ready", label: "🟢 Готовы" },
                { value: "delivering", label: "🚚 У курьера" },
                { value: "completed", label: "✅ Завершённые" },
                { value: "cancelled", label: "❌ Отменённые" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  backgroundColor:
                    statusFilter === tab.value ? "#4047ee" : "#050c26",
                  color: statusFilter === tab.value ? "#fff" : "#a8b1cf",
                  border: `1px solid ${statusFilter === tab.value ? "#4047ee" : "#242b47"}`,
                }}
              >
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
          style={{ backgroundColor: "#181f38" }}
        >
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"
          ></div>
          <p className="mt-4 font-semibold" style={{ color: "#a8b1cf" }}>
            Загрузка...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div
          className="p-12 text-center rounded-2xl"
          style={{ backgroundColor: "#181f38" }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#242b47" }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "#78819d" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#fff" }}>
            Заказы не найдены
          </h3>
          <p style={{ color: "#a8b1cf" }}>
            Когда клиенты сделают заказы, они появятся здесь
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const statusMeta =
              STATUS_META[order.status] ?? STATUS_META.pending;
            const isNew = order.status === "pending";
            const deliveryAddress = extractDeliveryAddress(order.customerComment);
            return (
              <div
                key={order.id}
                className="rounded-2xl p-6 transition-all cursor-pointer"
                style={{
                  backgroundColor: "#181f38",
                  border: `1px solid ${isNew ? "rgba(251, 191, 36, 0.4)" : "transparent"}`,
                  boxShadow: isNew
                    ? "0 0 0 3px rgba(251, 191, 36, 0.08)"
                    : undefined,
                }}
                onClick={() => openDetailsModal(order)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Order Number */}
                  <div className="flex-shrink-0 lg:w-48">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="text-xl font-black"
                        style={{ color: "#fff" }}
                      >
                        {order.orderNumber}
                      </div>
                      {isNew && (
                        <span
                          className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse"
                          style={{
                            backgroundColor: "#fbbf24",
                            color: "#000",
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: "#a8b1cf" }}
                    >
                      {fmtTime(order.createdAt)}
                    </div>
                    <div
                      className="text-xs mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-semibold"
                      style={{
                        backgroundColor: "#050c26",
                        color: "#a8b1cf",
                      }}
                    >
                      {order.orderType === "delivery"
                        ? "🚚 Доставка"
                        : "🏪 Самовывоз"}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white mb-1 truncate">
                      {order.customerName}
                    </div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "#a8b1cf" }}
                    >
                      {order.customerPhone}
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-xs mt-2 font-bold"
                      style={{ color: "#4047ee" }}
                    >
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"
                        />
                      </svg>
                      <span className="truncate">{order.branch.name}</span>
                    </div>
                    {deliveryAddress && (
                      <div
                        className="flex items-start gap-1.5 text-xs mt-1.5"
                        style={{ color: "#a8b1cf" }}
                      >
                        <svg
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="line-clamp-2">{deliveryAddress}</span>
                      </div>
                    )}
                    <div
                      className="text-xs mt-2 font-semibold"
                      style={{ color: "#78819d" }}
                    >
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "блюдо" : "блюд"} ·{" "}
                      {order.items.reduce((s, i) => s + i.quantity, 0)} шт.
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right">
                    <div
                      className="text-2xl font-black"
                      style={{ color: "#fff" }}
                    >
                      {order.totalAmount}
                      <span
                        className="text-base ml-1"
                        style={{ color: "#a8b1cf" }}
                      >
                        сом
                      </span>
                    </div>
                    <div
                      className="text-xs font-semibold mt-1"
                      style={{ color: "#a8b1cf" }}
                    >
                      {getPaymentMethodText(order.paymentMethod)}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                      style={{
                        backgroundColor: statusMeta.bg,
                        color: statusMeta.text,
                      }}
                    >
                      <span>{statusMeta.icon}</span>
                      {statusMeta.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#181f38" }}
          >
            <div
              className="sticky top-0 p-6 border-b"
              style={{ borderColor: "#242b47", backgroundColor: "#181f38" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p
                    className="text-sm mt-1 font-semibold"
                    style={{ color: "#a8b1cf" }}
                  >
                    {fmtTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 rounded-lg transition-all"
                  style={{ color: "#a8b1cf" }}
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
              {/* Status row */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor:
                      STATUS_META[selectedOrder.status]?.bg ??
                      STATUS_META.pending.bg,
                    color:
                      STATUS_META[selectedOrder.status]?.text ??
                      STATUS_META.pending.text,
                  }}
                >
                  <span>{STATUS_META[selectedOrder.status]?.icon}</span>
                  {STATUS_META[selectedOrder.status]?.label ?? selectedOrder.status}
                </span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    handleStatusChange(selectedOrder.id, e.target.value);
                  }}
                  disabled={updatingId === selectedOrder.id}
                  className="px-4 py-2 rounded-lg text-white text-sm font-bold focus:outline-none border"
                  style={{
                    backgroundColor: "#050c26",
                    borderColor: "#242b47",
                  }}
                >
                  {Object.entries(STATUS_META).map(([key, m]) => (
                    <option key={key} value={key} style={{ background: "#181f38" }}>
                      {m.icon} {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch + delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoCard
                  icon="🏪"
                  label="Филиал"
                  primary={selectedOrder.branch.name}
                  secondary={selectedOrder.branch.address}
                  tertiary={selectedOrder.branch.phone}
                />
                <InfoCard
                  icon={selectedOrder.orderType === "delivery" ? "🚚" : "📦"}
                  label={
                    selectedOrder.orderType === "delivery"
                      ? "Адрес доставки"
                      : "Самовывоз"
                  }
                  primary={
                    selectedOrder.orderType === "delivery"
                      ? extractDeliveryAddress(selectedOrder.customerComment) ??
                        "Не указан"
                      : selectedOrder.branch.name
                  }
                  secondary={
                    selectedOrder.orderType === "delivery"
                      ? null
                      : selectedOrder.branch.address
                  }
                />
              </div>

              {/* Customer */}
              <div>
                <h4
                  className="text-xs font-bold uppercase mb-3"
                  style={{ color: "#78819d" }}
                >
                  Клиент
                </h4>
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{
                    backgroundColor: "#050c26",
                    border: "1px solid #242b47",
                  }}
                >
                  <div className="flex justify-between gap-4 flex-wrap">
                    <span style={{ color: "#a8b1cf" }}>Имя:</span>
                    <span className="font-bold text-white">
                      {selectedOrder.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 flex-wrap">
                    <span style={{ color: "#a8b1cf" }}>Телефон:</span>
                    <span className="font-bold text-white">
                      {selectedOrder.customerPhone}
                    </span>
                  </div>
                  {selectedOrder.customer?.email && (
                    <div className="flex justify-between gap-4 flex-wrap">
                      <span style={{ color: "#a8b1cf" }}>Email:</span>
                      <span className="font-bold text-white">
                        {selectedOrder.customer.email}
                      </span>
                    </div>
                  )}
                  {selectedOrder.customerComment && (
                    <div
                      className="pt-3 border-t mt-3"
                      style={{ borderColor: "#242b47" }}
                    >
                      <span
                        className="text-xs font-bold uppercase block mb-1"
                        style={{ color: "#78819d" }}
                      >
                        Комментарий
                      </span>
                      <p className="text-white text-sm whitespace-pre-line">
                        {selectedOrder.customerComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4
                  className="text-xs font-bold uppercase mb-3"
                  style={{ color: "#78819d" }}
                >
                  Состав заказа
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "#050c26",
                        border: "1px solid #242b47",
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
                            style={{ color: "#a8b1cf" }}
                          >
                            {item.quantity} × {item.unitPrice} сом
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div
                              className="text-xs mt-2"
                              style={{ color: "#a8b1cf" }}
                            >
                              {item.modifiers
                                .map((m) => m.modifierOption.name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-black text-white shrink-0">
                          {item.totalPrice} сом
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total + payment */}
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: "#050c26",
                  border: "1px solid #242b47",
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">ИТОГО</span>
                  <span
                    className="text-3xl font-black"
                    style={{ color: "#4047ee" }}
                  >
                    {selectedOrder.totalAmount} сом
                  </span>
                </div>
                <div
                  className="text-sm font-semibold mt-2 text-right"
                  style={{ color: "#a8b1cf" }}
                >
                  {getPaymentMethodText(selectedOrder.paymentMethod)} ·{" "}
                  {selectedOrder.payments?.[0]?.status === "completed"
                    ? "Оплачено"
                    : "Ожидает оплаты"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

function InfoCard({
  icon,
  label,
  primary,
  secondary,
  tertiary,
}: {
  icon: string;
  label: string;
  primary: string;
  secondary?: string | null;
  tertiary?: string | null;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "#050c26",
        border: "1px solid #242b47",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span
          className="text-[10px] font-black uppercase tracking-wider"
          style={{ color: "#78819d" }}
        >
          {label}
        </span>
      </div>
      <div className="font-bold text-white text-sm">{primary}</div>
      {secondary && (
        <div className="text-xs mt-1" style={{ color: "#a8b1cf" }}>
          {secondary}
        </div>
      )}
      {tertiary && (
        <div className="text-xs mt-1 font-semibold" style={{ color: "#4047ee" }}>
          {tertiary}
        </div>
      )}
    </div>
  );
}
