"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  menuItem: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerComment: string | null;
  orderType: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  branch: {
    name: string;
  };
  items: OrderItem[];
}

export default function BranchOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/branch/orders?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/branch/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      if (response.ok) {
        setToast({
          message: "Статус заказа обновлён!",
          type: "success",
        });
        fetchOrders();
      } else {
        setToast({
          message: "Ошибка при обновлении статуса",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24', icon: '🟡' },
      confirmed: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', icon: '🔵' },
      preparing: { bg: 'rgba(249, 115, 22, 0.2)', text: '#f97316', icon: '🟠' },
      ready: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', icon: '🟢' },
      delivering: { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7', icon: '🚚' },
      completed: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', icon: '✅' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', icon: '❌' },
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Новый',
      confirmed: 'Подтверждён',
      preparing: 'Готовится',
      ready: 'Готов',
      delivering: 'Доставляется',
      completed: 'Завершён',
      cancelled: 'Отменён',
    };
    return texts[status] || status;
  };

  const getPaymentMethodText = (method: string) => {
    const methods: Record<string, string> = {
      card: '💳 Карта',
      online: '🌐 Онлайн',
      finik: '📱 Finik',
    };
    return methods[method] || method;
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
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#F3F5F7' }}>
          Заказы
        </h1>
        <p className="font-medium mt-2" style={{ color: '#98A2B3' }}>
          Управление заказами филиала
        </p>
      </div>

      {/* Search and Filters - NEW STRUCTURE */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#1A212B', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex flex-col gap-4">
          {/* Row 1: Search + Filters Button */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#98A2B3' }}
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
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{ 
                backgroundColor: statusFilter !== "all" ? '#7C8CA5' : '#2A3442' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Фильтры
              <svg 
                className="w-4 h-4 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: showFiltersMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Row 2: Expandable Filters Container */}
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ 
              maxHeight: showFiltersMenu ? '1000px' : '0',
              opacity: showFiltersMenu ? 1 : 0
            }}
          >
            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase" style={{ color: '#98A2B3' }}>
                  Фильтры
                </h3>
                {statusFilter !== "all" && (
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    Сбросить все
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter Card */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>
                    Статус заказа
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{ backgroundColor: '#1A212B', borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <option value="all" style={{ backgroundColor: '#1A212B' }}>Все статусы</option>
                    <option value="pending" style={{ backgroundColor: '#1A212B' }}>🟡 Новые</option>
                    <option value="confirmed" style={{ backgroundColor: '#1A212B' }}>🔵 Подтверждённые</option>
                    <option value="preparing" style={{ backgroundColor: '#1A212B' }}>🟠 Готовятся</option>
                    <option value="ready" style={{ backgroundColor: '#1A212B' }}>🟢 Готовы</option>
                    <option value="delivering" style={{ backgroundColor: '#1A212B' }}>🚚 Доставляются</option>
                    <option value="completed" style={{ backgroundColor: '#1A212B' }}>✅ Завершённые</option>
                    <option value="cancelled" style={{ backgroundColor: '#1A212B' }}>❌ Отменённые</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1A212B', border: '1px solid #202937' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto" style={{ borderColor: '#202937', borderTopColor: '#7C8CA5' }}></div>
            <p className="mt-4 font-semibold" style={{ color: '#98A2B3' }}>Загрузка...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#202937' }}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#F3F5F7' }}>Заказы не найдены</h3>
            <p style={{ color: '#98A2B3' }}>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4">
              {orders.map((order) => {
                const statusColor = getStatusColor(order.status);
                return (
                  <div
                    key={order.id}
                    className="rounded-xl p-6 transition-all cursor-pointer border"
                    style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#7C8CA5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#202937';
                    }}
                    onClick={() => openDetailsModal(order)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Order Number */}
                      <div className="flex-shrink-0">
                        <div className="text-2xl font-black" style={{ color: '#7C8CA5' }}>
                          {order.orderNumber}
                        </div>
                        <div className="text-xs font-bold mt-1" style={{ color: '#98A2B3' }}>
                          {new Date(order.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1">
                        <div className="font-bold text-white mb-1">{order.customerName}</div>
                        <div className="text-sm font-bold" style={{ color: '#98A2B3' }}>{order.customerPhone}</div>
                        <div className="text-sm mt-2" style={{ color: '#98A2B3' }}>
                          {order.items.length} {order.items.length === 1 ? 'блюдо' : 'блюд'}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0">
                        <div className="text-2xl font-black" style={{ color: '#F3F5F7' }}>
                          {order.totalAmount} <span className="text-lg" style={{ color: '#98A2B3' }}>сом</span>
                        </div>
                        <div className="text-xs font-bold mt-1" style={{ color: '#98A2B3' }}>
                          {getPaymentMethodText(order.paymentMethod)}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        <span 
                          className="px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          <span>{statusColor.icon}</span>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1A212B' }}>
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: '#7C8CA5' }}>
                    Заказ {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#98A2B3' }}>
                    {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
                <button onClick={closeDetailsModal} className="p-2 rounded-lg transition-all" style={{ color: '#98A2B3' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#202937';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#98A2B3';
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>Информация о клиенте</h4>
                <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#0B0F14', border: '1px solid #202937' }}>
                  <div className="flex justify-between">
                    <span style={{ color: '#98A2B3' }}>Имя:</span>
                    <span className="font-bold text-white">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#98A2B3' }}>Телефон:</span>
                    <span className="font-bold text-white">{selectedOrder.customerPhone}</span>
                  </div>
                  {selectedOrder.customerComment && (
                    <div className="pt-2 border-t" style={{ borderColor: '#202937' }}>
                      <span style={{ color: '#98A2B3' }}>Комментарий:</span>
                      <p className="font-bold text-white mt-1">{selectedOrder.customerComment}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>Состав заказа</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="rounded-xl p-4 flex justify-between items-center" style={{ backgroundColor: '#0B0F14', border: '1px solid #202937' }}>
                      <div>
                        <div className="font-bold text-white">{item.menuItem.name}</div>
                        <div className="text-sm" style={{ color: '#98A2B3' }}>
                          {item.quantity} x {item.unitPrice} сом
                        </div>
                      </div>
                      <div className="text-lg font-black" style={{ color: '#7C8CA5' }}>
                        {item.totalPrice} сом
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl p-4 flex justify-between items-center" style={{ backgroundColor: '#0B0F14', border: '1px solid #202937' }}>
                <span className="text-lg font-bold text-white">ИТОГО:</span>
                <span className="text-2xl font-black" style={{ color: '#7C8CA5' }}>
                  {selectedOrder.totalAmount} сом
                </span>
              </div>

              {/* Status Change */}
              <div>
                <h4 className="text-sm font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>Изменить статус</h4>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    handleStatusChange(selectedOrder.id, e.target.value);
                    closeDetailsModal();
                  }}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none transition-all border"
                  style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}
                >
                  <option value="pending" style={{ backgroundColor: '#1A212B' }}>🟡 Новый</option>
                  <option value="confirmed" style={{ backgroundColor: '#1A212B' }}>🔵 Подтверждён</option>
                  <option value="preparing" style={{ backgroundColor: '#1A212B' }}>🟠 Готовится</option>
                  <option value="ready" style={{ backgroundColor: '#1A212B' }}>🟢 Готов</option>
                  <option value="delivering" style={{ backgroundColor: '#1A212B' }}>🚚 Доставляется</option>
                  <option value="completed" style={{ backgroundColor: '#1A212B' }}>✅ Завершён</option>
                  <option value="cancelled" style={{ backgroundColor: '#1A212B' }}>❌ Отменён</option>
                </select>
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
