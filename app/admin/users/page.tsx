"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "admin" | "branch" | "customer";
  status: "active" | "blocked";
  createdAt: string;
  _count: {
    orders: number;
    branchUsers: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "customer" as "admin" | "branch" | "customer",
    status: "active" as "active" | "blocked",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    userId: string;
    userName: string;
    currentStatus: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    userId: string;
    userName: string;
  } | null>(null);

  // Загрузка пользователей
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Сортировка на клиенте
        let sortedUsers = [...data.users];
        
        sortedUsers.sort((a, b) => {
          let aValue, bValue;
          
          switch (sortBy) {
            case "fullName":
              aValue = a.fullName.toLowerCase();
              bValue = b.fullName.toLowerCase();
              break;
            case "email":
              aValue = a.email.toLowerCase();
              bValue = b.email.toLowerCase();
              break;
            case "createdAt":
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case "orders":
              aValue = a._count.orders;
              bValue = b._count.orders;
              break;
            case "role":
              aValue = a.role;
              bValue = b.role;
              break;
            default:
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
          }
          
          if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
          if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
        
        setUsers(sortedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, sortBy, sortOrder]);

  // Валидация формы
  const validateForm = (isEdit = false) => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Имя обязательно";
    }

    if (!formData.email.trim()) {
      errors.email = "Email обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Неверный формат email";
    }

    if (!isEdit && !formData.password.trim()) {
      errors.password = "Пароль обязателен";
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = "Пароль должен быть не менее 6 символов";
    } else if (isEdit && formData.password && formData.password.length < 6) {
      errors.password = "Пароль должен быть не менее 6 символов";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Добавление пользователя
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          email: "",
          fullName: "",
          password: "",
          role: "customer",
          status: "active",
        });
        setFormErrors({});
        setToast({
          message: "Пользователь успешно добавлен!",
          type: "success",
        });
        fetchUsers();
      } else {
        const data = await response.json();
        setFormErrors({ submit: data.error || "Ошибка при добавлении пользователя" });
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setFormErrors({ submit: "Ошибка сети. Попробуйте позже." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      email: "",
      fullName: "",
      password: "",
      role: "customer",
      status: "active",
    });
    setFormErrors({});
  };

  // Редактирование пользователя
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      fullName: user.fullName,
      password: "",
      role: user.role,
      status: user.status,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Сохранение изменений пользователя
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    if (!validateForm(true)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingUser.id,
          ...formData,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingUser(null);
        setFormData({
          email: "",
          fullName: "",
          password: "",
          role: "customer",
          status: "active",
        });
        setFormErrors({});
        setToast({
          message: "Пользователь успешно обновлен!",
          type: "success",
        });
        fetchUsers();
      } else {
        const data = await response.json();
        setFormErrors({ submit: data.error || "Ошибка при обновлении пользователя" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setFormErrors({ submit: "Ошибка сети. Попробуйте позже." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Закрытие модального окна редактирования
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setFormData({
      email: "",
      fullName: "",
      password: "",
      role: "customer",
      status: "active",
    });
    setFormErrors({});
  };

  // Открытие модального окна подтверждения
  const openConfirmModal = (userId: string, userName: string, currentStatus: string) => {
    setConfirmModal({
      show: true,
      userId,
      userName,
      currentStatus,
    });
  };

  // Закрытие модального окна подтверждения
  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  // Переключение статуса пользователя
  const handleToggleStatus = async () => {
    if (!confirmModal) return;

    const { userId, userName, currentStatus } = confirmModal;
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    const action = newStatus === "active" ? "разблокирован" : "заблокирован";
    
    try {
      const response = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setToast({
          message: `Пользователь "${userName}" ${action}!`,
          type: "success",
        });
        fetchUsers();
        closeConfirmModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при изменении статуса",
          type: "error",
        });
        closeConfirmModal();
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
      closeConfirmModal();
    }
  };

  // Открытие модального окна удаления
  const openDeleteModal = (userId: string, userName: string) => {
    setDeleteModal({
      show: true,
      userId,
      userName,
    });
  };

  // Закрытие модального окна удаления
  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  // Удаление пользователя
  const handleDeleteUser = async () => {
    if (!deleteModal) return;

    const { userId, userName } = deleteModal;
    
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setToast({
          message: `Пользователь "${userName}" удален!`,
          type: "success",
        });
        fetchUsers();
        closeDeleteModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при удалении",
          type: "error",
        });
        closeDeleteModal();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
      closeDeleteModal();
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "branch":
        return "Филиал";
      case "customer":
        return "Клиент";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return { bg: "rgba(239, 68, 68, 0.2)", text: "#ef4444" };
      case "branch":
        return { bg: "rgba(168, 85, 247, 0.2)", text: "#a855f7" };
      case "customer":
        return { bg: "rgba(59, 130, 246, 0.2)", text: "#3b82f6" };
      default:
        return { bg: "rgba(107, 114, 128, 0.2)", text: "#6b7280" };
    }
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight drop-shadow-lg" style={{ color: 'white' }}>
          Пользователи
        </h1>
        <p className="text-slate-300 font-semibold mt-2 text-lg">
          Управление пользователями системы
        </p>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#181f38' }}>
        <div className="flex flex-col gap-4">
          {/* Search and Buttons Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#78819d' }}
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
                  placeholder="Поиск по имени или email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-300 focus:outline-none transition-all border"
                  style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                />
              </div>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{ 
                backgroundColor: (roleFilter !== "all" || statusFilter !== "all") ? '#4047ee' : '#242b47' 
              }}
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
                style={{ transform: showSortMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center"
              style={{ backgroundColor: '#4047ee' }}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Добавить пользователя
            </button>
          </div>

          {/* Expandable Filters Container */}
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ 
              maxHeight: showSortMenu ? '1000px' : '0',
              opacity: showSortMenu ? 1 : 0
            }}
          >
            <div className="pt-4 border-t" style={{ borderColor: '#242b47' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase" style={{ color: '#78819d' }}>
                  Фильтры и сортировка
                </h3>
                {(roleFilter !== "all" || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setStatusFilter("all");
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    Сбросить все
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sorting Card */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Сортировка
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                  >
                    <option value="fullName" style={{ backgroundColor: '#181f38' }}>По имени</option>
                    <option value="email" style={{ backgroundColor: '#181f38' }}>По email</option>
                    <option value="createdAt" style={{ backgroundColor: '#181f38' }}>По дате создания</option>
                    <option value="orders" style={{ backgroundColor: '#181f38' }}>По заказам</option>
                    <option value="role" style={{ backgroundColor: '#181f38' }}>По роли</option>
                  </select>
                </div>

                {/* Role Filter Card */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Роль
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                  >
                    <option value="all" style={{ backgroundColor: '#181f38' }}>Все роли</option>
                    <option value="admin" style={{ backgroundColor: '#181f38' }}>Администраторы</option>
                    <option value="branch" style={{ backgroundColor: '#181f38' }}>Филиалы</option>
                    <option value="customer" style={{ backgroundColor: '#181f38' }}>Клиенты</option>
                  </select>
                </div>

                {/* Status Filter Card */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Статус
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                  >
                    <option value="all" style={{ backgroundColor: '#181f38' }}>Все статусы</option>
                    <option value="active" style={{ backgroundColor: '#181f38' }}>Активные</option>
                    <option value="blocked" style={{ backgroundColor: '#181f38' }}>Заблокированные</option>
                  </select>
                </div>

                {/* Sort Order Toggle */}
                <div className="rounded-xl p-4 border flex items-end" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setSortOrder("asc")}
                      className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: sortOrder === "asc" ? '#4047ee' : '#181f38',
                        color: sortOrder === "asc" ? 'white' : '#78819d',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: sortOrder === "asc" ? '#4047ee' : '#242b47'
                      }}
                    >
                      <span className="text-lg">🔼</span>
                      <span className="text-sm">А-Я</span>
                    </button>
                    <button
                      onClick={() => setSortOrder("desc")}
                      className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: sortOrder === "desc" ? '#4047ee' : '#181f38',
                        color: sortOrder === "desc" ? 'white' : '#78819d',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: sortOrder === "desc" ? '#4047ee' : '#242b47'
                      }}
                    >
                      <span className="text-lg">🔽</span>
                      <span className="text-sm">Я-А</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
                Всего пользователей
              </p>
              <p className="text-3xl font-black text-white">{users.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
                Администраторы
              </p>
              <p className="text-3xl font-black text-white">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
              <svg
                className="w-6 h-6"
                style={{ color: '#ef4444' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
                Филиалы
              </p>
              <p className="text-3xl font-black text-white">
                {users.filter((u) => u.role === "branch").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}>
              <svg
                className="w-6 h-6"
                style={{ color: '#a855f7' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
                Клиенты
              </p>
              <p className="text-3xl font-black text-white">
                {users.filter((u) => u.role === "customer").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
              <svg
                className="w-6 h-6"
                style={{ color: '#3b82f6' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#181f38' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto"></div>
            <p className="mt-4 font-semibold" style={{ color: '#78819d' }}>Загрузка...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(24, 31, 56, 0.5)' }}>
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#78819d' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-black mb-2" style={{ color: 'white' }}>
              Пользователи не найдены
            </h3>
            <p className="text-slate-300 mb-6">
              {search
                ? "Попробуйте изменить параметры поиска"
                : "Добавьте первого пользователя"}
            </p>
            {!search && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                style={{ backgroundColor: '#4047ee' }}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Добавить пользователя
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Заказы
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-200 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => {
                  const roleColor = getRoleColor(user.role);
                  return (
                    <tr
                      key={user.id}
                      className="transition-colors"
                      style={{ backgroundColor: '#181f38' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181f38'}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#555e7d' }}>
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white">{user.fullName}</p>
                            <p className="text-sm" style={{ color: '#78819d' }}>
                              ID: {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="px-3 py-1 rounded-full text-sm font-bold"
                          style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                          {user._count.orders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.status === "active" ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold flex items-center gap-1 w-fit">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            Активен
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold flex items-center gap-1 w-fit">
                            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                            Заблокирован
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm">
                          {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-end">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-2 rounded-lg transition-colors" 
                            style={{ color: '#78819d' }} 
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#242b47';
                              e.currentTarget.style.color = 'white';
                            }} 
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#78819d';
                            }}
                            title="Редактировать"
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
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openConfirmModal(user.id, user.fullName, user.status)}
                            className="p-2 rounded-lg transition-colors" 
                            style={{ color: '#78819d' }} 
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.backgroundColor = '#242b47'; 
                              e.currentTarget.style.color = user.status === 'active' ? '#ef4444' : '#10b981'; 
                            }} 
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.backgroundColor = 'transparent'; 
                              e.currentTarget.style.color = '#78819d'; 
                            }}
                            title={user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                          >
                            {user.status === 'active' ? (
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
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              </svg>
                            ) : (
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
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </button>
                          <button 
                            onClick={() => openDeleteModal(user.id, user.fullName)}
                            className="p-2 rounded-lg transition-colors" 
                            style={{ color: '#78819d' }} 
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.backgroundColor = '#242b47'; 
                              e.currentTarget.style.color = '#ef4444'; 
                            }} 
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.backgroundColor = 'transparent'; 
                              e.currentTarget.style.color = '#78819d'; 
                            }}
                            title="Удалить"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно добавления пользователя */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-6">Добавить пользователя</h2>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: formErrors.email ? '#ef4444' : '#242b47' }}
                    placeholder="user@example.com"
                  />
                  {formErrors.email && <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Полное имя *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: formErrors.fullName ? '#ef4444' : '#242b47' }}
                    placeholder="Иван Иванов"
                  />
                  {formErrors.fullName && <p className="text-red-400 text-sm mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Пароль *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: formErrors.password ? '#ef4444' : '#242b47' }}
                    placeholder="Минимум 6 символов"
                  />
                  {formErrors.password && <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Роль *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="customer" style={{ backgroundColor: '#050c26' }}>Клиент</option>
                    <option value="branch" style={{ backgroundColor: '#050c26' }}>Филиал</option>
                    <option value="admin" style={{ backgroundColor: '#050c26' }}>Администратор</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Статус *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="active" style={{ backgroundColor: '#050c26' }}>Активен</option>
                    <option value="blocked" style={{ backgroundColor: '#050c26' }}>Заблокирован</option>
                  </select>
                </div>

                {formErrors.submit && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                    <p className="text-red-400 text-sm">{formErrors.submit}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47', color: 'white' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#4047ee' }}
                >
                  {isSubmitting ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования пользователя */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-6">Редактировать пользователя</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: formErrors.email ? '#ef4444' : '#242b47' }}
                  />
                  {formErrors.email && <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Полное имя *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: formErrors.fullName ? '#ef4444' : '#242b47' }}
                  />
                  {formErrors.fullName && <p className="text-red-400 text-sm mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Новый пароль (оставьте пустым, чтобы не менять)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: formErrors.password ? '#ef4444' : '#242b47' }}
                    placeholder="Минимум 6 символов"
                  />
                  {formErrors.password && <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Роль *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="customer" style={{ backgroundColor: '#050c26' }}>Клиент</option>
                    <option value="branch" style={{ backgroundColor: '#050c26' }}>Филиал</option>
                    <option value="admin" style={{ backgroundColor: '#050c26' }}>Администратор</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Статус *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="active" style={{ backgroundColor: '#050c26' }}>Активен</option>
                    <option value="blocked" style={{ backgroundColor: '#050c26' }}>Заблокирован</option>
                  </select>
                </div>

                {formErrors.submit && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                    <p className="text-red-400 text-sm">{formErrors.submit}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47', color: 'white' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#4047ee' }}
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения изменения статуса */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-4">
              {confirmModal.currentStatus === 'active' ? 'Заблокировать пользователя?' : 'Разблокировать пользователя?'}
            </h2>
            <p className="mb-6" style={{ color: '#78819d' }}>
              Вы уверены, что хотите {confirmModal.currentStatus === 'active' ? 'заблокировать' : 'разблокировать'} пользователя{' '}
              <span className="font-bold text-white">"{confirmModal.userName}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                style={{ backgroundColor: '#242b47', color: 'white' }}
              >
                Отмена
              </button>
              <button
                onClick={handleToggleStatus}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: confirmModal.currentStatus === 'active' ? '#ef4444' : '#10b981' }}
              >
                {confirmModal.currentStatus === 'active' ? 'Заблокировать' : 'Разблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-4">Удалить пользователя?</h2>
            <p className="mb-6" style={{ color: '#78819d' }}>
              Вы уверены, что хотите удалить пользователя{' '}
              <span className="font-bold text-white">"{deleteModal.userName}"</span>?
              <br />
              <span className="text-red-400 font-bold">Это действие нельзя отменить!</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                style={{ backgroundColor: '#242b47', color: 'white' }}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#ef4444' }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
