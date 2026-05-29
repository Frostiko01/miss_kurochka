"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/admin/Toast";
import MapPicker from "@/components/admin/MapPicker";
import PhoneInput from "@/components/PhoneInput";
import { validatePhoneNumber, displayPhoneNumber } from "@/lib/phone-formatter";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive";
  createdAt: string;
  _count: {
    orders: number;
    branchUsers: number;
  };
}

export default function AdminBranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    latitude: "",
    longitude: "",
    isActive: true,
    branchEmail: "",
    branchPassword: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    branchId: string;
    branchName: string;
    currentStatus: string;
  } | null>(null);

  // Загрузка филиалов
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/admin/branches?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBranches(data.branches);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [search, statusFilter, sortBy, sortOrder]);

  // Валидация формы
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Название обязательно";
    }

    if (!formData.address.trim()) {
      errors.address = "Адрес обязателен";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Телефон обязателен";
    } else if (!validatePhoneNumber(formData.phone)) {
      errors.phone = "Неверный формат телефона. Используйте +996 XXX XXX XXX";
    }

    if (!formData.branchEmail.trim()) {
      errors.branchEmail = "Email филиала обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.branchEmail)) {
      errors.branchEmail = "Неверный формат email";
    }

    if (!formData.branchPassword.trim()) {
      errors.branchPassword = "Пароль обязателен";
    } else if (formData.branchPassword.length < 6) {
      errors.branchPassword = "Пароль должен быть не менее 6 символов";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Добавление филиала
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          isActive: formData.isActive,
          branchEmail: formData.branchEmail.trim(),
          branchPassword: formData.branchPassword.trim(),
        }),
      });

      if (response.ok) {
        // Успешно добавлено
        setShowAddModal(false);
        setFormData({
          name: "",
          address: "",
          phone: "",
          latitude: "",
          longitude: "",
          isActive: true,
          branchEmail: "",
          branchPassword: "",
        });
        setFormErrors({});
        setToast({
          message: "Филиал успешно добавлен!",
          type: "success",
        });
        fetchBranches(); // Обновляем список
      } else {
        const data = await response.json();
        setFormErrors({ submit: data.error || "Ошибка при добавлении филиала" });
      }
    } catch (error) {
      console.error("Error adding branch:", error);
      setFormErrors({ submit: "Ошибка сети. Попробуйте позже." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      name: "",
      address: "",
      phone: "",
      latitude: "",
      longitude: "",
      isActive: true,
      branchEmail: "",
      branchPassword: "",
    });
    setFormErrors({});
  };

  // Редактирование филиала
  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      latitude: branch.latitude?.toString() || "",
      longitude: branch.longitude?.toString() || "",
      isActive: branch.status === "active",
      branchEmail: "",
      branchPassword: "",
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Сохранение изменений филиала
  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBranch) return;

    // Валидация (без email и пароля для редактирования)
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Название обязательно";
    }

    if (!formData.address.trim()) {
      errors.address = "Адрес обязателен";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Телефон обязателен";
    } else if (!validatePhoneNumber(formData.phone)) {
      errors.phone = "Неверный формат телефона. Используйте +996 XXX XXX XXX";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/branches", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingBranch.id,
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          status: formData.isActive ? "active" : "inactive",
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingBranch(null);
        setFormData({
          name: "",
          address: "",
          phone: "",
          latitude: "",
          longitude: "",
          isActive: true,
          branchEmail: "",
          branchPassword: "",
        });
        setFormErrors({});
        setToast({
          message: "Филиал успешно обновлен!",
          type: "success",
        });
        fetchBranches();
      } else {
        const data = await response.json();
        setFormErrors({ submit: data.error || "Ошибка при обновлении филиала" });
      }
    } catch (error) {
      console.error("Error updating branch:", error);
      setFormErrors({ submit: "Ошибка сети. Попробуйте позже." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Закрытие модального окна редактирования
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBranch(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      latitude: "",
      longitude: "",
      isActive: true,
      branchEmail: "",
      branchPassword: "",
    });
    setFormErrors({});
  };

  // Открытие модального окна подтверждения
  const openConfirmModal = (branchId: string, branchName: string, currentStatus: string) => {
    setConfirmModal({
      show: true,
      branchId,
      branchName,
      currentStatus,
    });
  };

  // Закрытие модального окна подтверждения
  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  // Переключение статуса филиала
  const handleToggleStatus = async () => {
    if (!confirmModal) return;

    const { branchId, branchName, currentStatus } = confirmModal;
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "активирован" : "деактивирован";
    
    try {
      const response = await fetch(`/api/admin/branches`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: branchId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setToast({
          message: `Филиал "${branchName}" ${action}!`,
          type: "success",
        });
        fetchBranches();
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
      console.error("Error toggling branch status:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
      closeConfirmModal();
    }
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight drop-shadow-lg" style={{ color: 'white' }}>
          Филиалы
        </h1>
        <p className="text-slate-300 font-semibold mt-2 text-lg">
          Управление филиалами ресторана
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
                  placeholder="Поиск по названию, адресу или телефону..."
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
                backgroundColor: statusFilter !== "all" ? '#4047ee' : '#242b47' 
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
              Добавить филиал
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

              <div className="flex flex-wrap gap-4">
                {/* Sorting Card */}
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Сортировка
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                  >
                    <option value="name" style={{ backgroundColor: '#181f38' }}>По названию</option>
                    <option value="createdAt" style={{ backgroundColor: '#181f38' }}>По дате создания</option>
                    <option value="orders" style={{ backgroundColor: '#181f38' }}>По заказам</option>
                    <option value="status" style={{ backgroundColor: '#181f38' }}>По статусу</option>
                  </select>
                </div>

                {/* Status Filter Card */}
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
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
                    <option value="inactive" style={{ backgroundColor: '#181f38' }}>Неактивные</option>
                  </select>
                </div>

                {/* Sort Order Toggle */}
                <div className="rounded-xl p-4 border flex-1 flex flex-col justify-end" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Порядок
                  </label>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
                Всего филиалов
              </p>
              <p className="text-3xl font-black text-white">{branches.length}</p>
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
                Активные
              </p>
              <p className="text-3xl font-black text-white">
                {branches.filter((b) => b.status === "active").length}
              </p>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase mb-1" style={{ color: '#78819d' }}>
                Неактивные
              </p>
              <p className="text-3xl font-black text-white">
                {branches.filter((b) => b.status === "inactive").length}
              </p>
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
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Branches List */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#181f38' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto"></div>
            <p className="mt-4 font-semibold" style={{ color: '#78819d' }}>Загрузка...</p>
          </div>
        ) : branches.length === 0 ? (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-black mb-2" style={{ color: 'white' }}>
              Филиалы не найдены
            </h3>
            <p className="text-slate-300 mb-6">
              {search
                ? "Попробуйте изменить параметры поиска"
                : "Добавьте первый филиал"}
            </p>
            {!search && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                style={{ backgroundColor: '#4047ee' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a5ff5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4047ee'}
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
                Добавить филиал
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Адрес
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Телефон
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Заказы
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Сотрудники
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-200 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-200 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {branches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="transition-colors"
                    style={{ backgroundColor: '#181f38' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181f38'}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
                          <svg
                            className="w-5 h-5 text-white"
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
                        <div>
                          <p className="font-bold text-white">{branch.name}</p>
                          <p className="text-sm" style={{ color: '#78819d' }}>
                            ID: {branch.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{branch.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-mono">{displayPhoneNumber(branch.phone)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                        {branch._count.orders}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-bold">
                        {branch._count.branchUsers}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {branch.status === "active" ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold flex items-center gap-1 w-fit">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          Активен
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold flex items-center gap-1 w-fit">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          Неактивен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <button 
                          onClick={() => handleEditBranch(branch)}
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
                          onClick={() => openConfirmModal(branch.id, branch.name, branch.status)}
                          className="p-2 rounded-lg transition-colors" 
                          style={{ color: '#78819d' }} 
                          onMouseEnter={(e) => { 
                            e.currentTarget.style.backgroundColor = '#242b47'; 
                            e.currentTarget.style.color = branch.status === 'active' ? '#4047ee' : '#10b981'; 
                          }} 
                          onMouseLeave={(e) => { 
                            e.currentTarget.style.backgroundColor = 'transparent'; 
                            e.currentTarget.style.color = '#78819d'; 
                          }}
                          title={branch.status === 'active' ? 'Деактивировать' : 'Активировать'}
                        >
                          {branch.status === 'active' ? (
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
                                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#181f38' }}>
            {/* Header */}
            <div className="sticky top-0 p-6 rounded-t-2xl border-b" style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(64, 71, 238, 0.2)' }}>
                    <svg
                      className="w-6 h-6"
                      style={{ color: '#4047ee' }}
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
                  <div>
                    <h2 className="text-2xl font-black" style={{ color: '#4047ee' }}>
                      Добавить филиал
                    </h2>
                    <p className="text-sm" style={{ color: '#78819d' }}>
                      Заполните информацию о новом филиале
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
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

            {/* Form */}
            <form onSubmit={handleAddBranch} className="p-6 space-y-6">
              {/* Error Message */}
              {formErrors.submit && (
                <div className="bg-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-red-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-red-400 font-semibold">{formErrors.submit}</p>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Название филиала <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border ${
                    formErrors.name ? "border-red-500" : ""
                  }`}
                  placeholder="Например: Филиал Центр"
                  style={{ backgroundColor: '#050c26', borderColor: formErrors.name ? '#ef4444' : '#242b47' }}
                />
                {formErrors.name && (
                  <p className="mt-2 text-sm text-red-400">{formErrors.name}</p>
                )}
              </div>

              {/* Address with Map */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Адрес <span className="text-red-400">*</span>
                </label>
                
                {/* Map Picker */}
                <MapPicker
                  onLocationSelect={(address, coordinates) => {
                    setFormData({
                      ...formData,
                      address: address,
                      latitude: coordinates.lat.toString(),
                      longitude: coordinates.lng.toString(),
                    });
                  }}
                  initialCoordinates={
                    formData.latitude && formData.longitude
                      ? {
                          lat: parseFloat(formData.latitude),
                          lng: parseFloat(formData.longitude),
                        }
                      : undefined
                  }
                  initialAddress={formData.address}
                />
                
                {formErrors.address && (
                  <p className="mt-2 text-sm text-red-400">{formErrors.address}</p>
                )}
              </div>

              {/* Phone */}
              <PhoneInput
                label="Телефон"
                required
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                error={formErrors.phone}
                placeholder="+996 555 123 456"
              />

              {/* Branch Credentials Section */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(24, 31, 56, 0.3)' }}>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#3b82f6' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Учетные данные филиала
                </h3>
                
                <div className="space-y-4">
                  {/* Branch Email */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Email филиала <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.branchEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, branchEmail: e.target.value })
                      }
                      className={`w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border ${
                        formErrors.branchEmail ? "border-red-500" : ""
                      }`}
                      placeholder="branch@example.com"
                      style={{ backgroundColor: '#050c26', borderColor: formErrors.branchEmail ? '#ef4444' : '#242b47' }}
                    />
                    {formErrors.branchEmail && (
                      <p className="mt-2 text-sm text-red-400">{formErrors.branchEmail}</p>
                    )}
                  </div>

                  {/* Branch Password */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Пароль филиала <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.branchPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, branchPassword: e.target.value })
                      }
                      className={`w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border ${
                        formErrors.branchPassword ? "border-red-500" : ""
                      }`}
                      placeholder="Минимум 6 символов"
                      style={{ backgroundColor: '#050c26', borderColor: formErrors.branchPassword ? '#ef4444' : '#242b47' }}
                    />
                    {formErrors.branchPassword && (
                      <p className="mt-2 text-sm text-red-400">{formErrors.branchPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    style={{ backgroundColor: 'rgba(24, 31, 56, 0.5)', accentColor: '#3b82f6' }}
                  />
                  <div>
                    <span className="text-white font-bold">Активный филиал</span>
                    <p className="text-sm" style={{ color: '#78819d' }}>
                      Филиал будет доступен для заказов
                    </p>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3654'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#4047ee' }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#5a5ff5')}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#4047ee')}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Добавление...
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Добавить филиал
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && editingBranch && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#181f38' }}>
            {/* Header */}
            <div className="sticky top-0 p-6 rounded-t-2xl border-b" style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(64, 71, 238, 0.2)' }}>
                    <svg
                      className="w-6 h-6"
                      style={{ color: '#4047ee' }}
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
                  </div>
                  <div>
                    <h2 className="text-2xl font-black" style={{ color: '#4047ee' }}>
                      Редактировать филиал
                    </h2>
                    <p className="text-sm" style={{ color: '#78819d' }}>
                      Обновите информацию о филиале
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseEditModal}
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

            {/* Form */}
            <form onSubmit={handleUpdateBranch} className="p-6 space-y-6">
              {/* Error Message */}
              {formErrors.submit && (
                <div className="bg-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-red-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-red-400 font-semibold">{formErrors.submit}</p>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Название филиала <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border ${
                    formErrors.name ? "border-red-500" : ""
                  }`}
                  placeholder="Например: Филиал Центр"
                  style={{ backgroundColor: '#050c26', borderColor: formErrors.name ? '#ef4444' : '#242b47' }}
                />
                {formErrors.name && (
                  <p className="mt-2 text-sm text-red-400">{formErrors.name}</p>
                )}
              </div>

              {/* Address with Map */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Адрес <span className="text-red-400">*</span>
                </label>
                
                {/* Map Picker */}
                <MapPicker
                  onLocationSelect={(address, coordinates) => {
                    setFormData({
                      ...formData,
                      address: address,
                      latitude: coordinates.lat.toString(),
                      longitude: coordinates.lng.toString(),
                    });
                  }}
                  initialCoordinates={
                    formData.latitude && formData.longitude
                      ? {
                          lat: parseFloat(formData.latitude),
                          lng: parseFloat(formData.longitude),
                        }
                      : undefined
                  }
                  initialAddress={formData.address}
                />
                
                {formErrors.address && (
                  <p className="mt-2 text-sm text-red-400">{formErrors.address}</p>
                )}
              </div>

              {/* Phone */}
              <PhoneInput
                label="Телефон"
                required
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                error={formErrors.phone}
                placeholder="+996 555 123 456"
              />

              {/* Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    style={{ backgroundColor: 'rgba(24, 31, 56, 0.5)', accentColor: '#3b82f6' }}
                  />
                  <div>
                    <span className="text-white font-bold">Активный филиал</span>
                    <p className="text-sm" style={{ color: '#78819d' }}>
                      Филиал будет доступен для заказов
                    </p>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3654'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#4047ee' }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#5a5ff5')}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#4047ee')}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Сохранить изменения
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl max-w-md w-full shadow-2xl"
            style={{ backgroundColor: '#181f38' }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: '#242b47' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: confirmModal.currentStatus === 'active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: confirmModal.currentStatus === 'active' ? '#ef4444' : '#22c55e' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {confirmModal.currentStatus === 'active' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#4047ee' }}>
                    {confirmModal.currentStatus === 'active' ? 'Деактивировать филиал?' : 'Активировать филиал?'}
                  </h3>
                  <p className="text-sm" style={{ color: '#78819d' }}>
                    Подтвердите действие
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-white mb-2">
                Вы уверены, что хотите{' '}
                <span className="font-bold" style={{ color: confirmModal.currentStatus === 'active' ? '#ef4444' : '#22c55e' }}>
                  {confirmModal.currentStatus === 'active' ? 'деактивировать' : 'активировать'}
                </span>
                {' '}филиал?
              </p>
              <p className="font-bold text-white mb-4">
                "{confirmModal.branchName}"
              </p>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(120, 129, 157, 0.1)' }}>
                <p className="text-sm" style={{ color: '#78819d' }}>
                  {confirmModal.currentStatus === 'active' 
                    ? '⚠️ Филиал станет недоступен для заказов'
                    : '✓ Филиал станет доступен для заказов'
                  }
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#242b47' }}>
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#242b47' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3654'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
              >
                Отмена
              </button>
              <button
                onClick={handleToggleStatus}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ 
                  backgroundColor: confirmModal.currentStatus === 'active' ? '#ef4444' : '#22c55e'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = confirmModal.currentStatus === 'active' ? '#dc2626' : '#16a34a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = confirmModal.currentStatus === 'active' ? '#ef4444' : '#22c55e';
                }}
              >
                {confirmModal.currentStatus === 'active' ? 'Деактивировать' : 'Активировать'}
              </button>
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
