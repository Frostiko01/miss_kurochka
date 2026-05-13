"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";
import ImageUpload from "@/components/admin/ImageUpload";

interface AdditionalOffer {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAdditionalOffersPage() {
  const [offers, setOffers] = useState<AdditionalOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<AdditionalOffer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "sauce",
    imageUrl: "",
    isActive: true,
  });

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchOffers();
  }, [search, categoryFilter, statusFilter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/additional-offers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      setToast({
        message: "Заполните обязательные поля",
        type: "error",
      });
      return;
    }

    try {
      const url = editingOffer
        ? "/api/admin/additional-offers"
        : "/api/admin/additional-offers";
      const method = editingOffer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingOffer
            ? { id: editingOffer.id, ...formData }
            : formData
        ),
      });

      if (response.ok) {
        setToast({
          message: editingOffer
            ? "Предложение обновлено!"
            : "Предложение создано!",
          type: "success",
        });
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingOffer(null);
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "sauce",
          imageUrl: "",
          isActive: true,
        });
        fetchOffers();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при сохранении",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving offer:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      const response = await fetch("/api/admin/additional-offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModal.id }),
      });

      if (response.ok) {
        setToast({
          message: "Предложение удалено!",
          type: "success",
        });
        setDeleteModal(null);
        fetchOffers();
      } else {
        setToast({
          message: "Ошибка при удалении",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      sauce: "Соус",
      drink: "Напиток",
      side: "Гарнир",
    };
    return categories[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      sauce: "🥫",
      drink: "🥤",
      side: "🍟",
    };
    return icons[category] || "📦";
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: "#050c26" }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-black uppercase tracking-tight"
          style={{ color: "white" }}
        >
          Дополнительные предложения
        </h1>
        <p className="font-semibold mt-2" style={{ color: "#78819d" }}>
          Управление соусами, напитками и гарнирами
        </p>
      </div>

      {/* Filters and Search */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ backgroundColor: "#181f38" }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
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
                  placeholder="Поиск предложений..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-300 focus:outline-none transition-all border"
                  style={{
                    backgroundColor: "#050c26",
                    borderColor: "#242b47",
                  }}
                />
              </div>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{
                backgroundColor:
                  categoryFilter !== "all" || statusFilter !== "all"
                    ? "#4047ee"
                    : "#242b47",
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Фильтры
            </button>

            {/* Add Button */}
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormData({
                  name: "",
                  description: "",
                  price: "",
                  category: "sauce",
                  imageUrl: "",
                  isActive: true,
                });
              }}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center"
              style={{ backgroundColor: "#4047ee" }}
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
              Добавить предложение
            </button>
          </div>

          {/* Expandable Filters */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: showFiltersMenu ? "1000px" : "0",
              opacity: showFiltersMenu ? 1 : 0,
            }}
          >
            <div className="pt-4 border-t" style={{ borderColor: "#242b47" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: "#050c26",
                    borderColor: "#242b47",
                  }}
                >
                  <label
                    className="block text-xs font-bold uppercase mb-3"
                    style={{ color: "#78819d" }}
                  >
                    Категория
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{
                      backgroundColor: "#181f38",
                      borderColor: "#242b47",
                    }}
                  >
                    <option value="all" style={{ backgroundColor: "#181f38" }}>
                      Все категории
                    </option>
                    <option
                      value="sauce"
                      style={{ backgroundColor: "#181f38" }}
                    >
                      🥫 Соусы
                    </option>
                    <option
                      value="drink"
                      style={{ backgroundColor: "#181f38" }}
                    >
                      🥤 Напитки
                    </option>
                    <option value="side" style={{ backgroundColor: "#181f38" }}>
                      🍟 Гарниры
                    </option>
                  </select>
                </div>

                {/* Status Filter */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: "#050c26",
                    borderColor: "#242b47",
                  }}
                >
                  <label
                    className="block text-xs font-bold uppercase mb-3"
                    style={{ color: "#78819d" }}
                  >
                    Статус
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{
                      backgroundColor: "#181f38",
                      borderColor: "#242b47",
                    }}
                  >
                    <option value="all" style={{ backgroundColor: "#181f38" }}>
                      Все статусы
                    </option>
                    <option
                      value="active"
                      style={{ backgroundColor: "#181f38" }}
                    >
                      Активные
                    </option>
                    <option
                      value="inactive"
                      style={{ backgroundColor: "#181f38" }}
                    >
                      Неактивные
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "#181f38" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: "#4047ee" }}
            ></div>
          </div>
        ) : !offers || offers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold" style={{ color: "#78819d" }}>
              Предложения не найдены
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl p-4 border transition-all hover:border-opacity-100"
                style={{
                  backgroundColor: "#050c26",
                  borderColor: "#242b47",
                }}
              >
                {/* Image */}
                {offer.imageUrl ? (
                  <div className="w-full h-40 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={offer.imageUrl}
                      alt={offer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-40 rounded-lg mb-3 flex items-center justify-center text-6xl"
                    style={{ backgroundColor: "#181f38" }}
                  >
                    {getCategoryIcon(offer.category)}
                  </div>
                )}

                {/* Info */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {offer.name}
                  </h3>
                  {offer.description && (
                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: "#78819d" }}
                    >
                      {offer.description}
                    </p>
                  )}
                </div>

                {/* Price and Category */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-[#4047ee]">
                    {offer.price} сом
                  </span>
                  <span
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      backgroundColor: "rgba(64, 71, 238, 0.1)",
                      color: "#4047ee",
                    }}
                  >
                    {getCategoryText(offer.category)}
                  </span>
                </div>

                {/* Status */}
                <div className="mb-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      backgroundColor: offer.isActive
                        ? "rgba(34, 197, 94, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                      color: offer.isActive ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {offer.isActive ? "Активно" : "Неактивно"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingOffer(offer);
                      setFormData({
                        name: offer.name,
                        description: offer.description || "",
                        price: offer.price.toString(),
                        category: offer.category,
                        imageUrl: offer.imageUrl || "",
                        isActive: offer.isActive,
                      });
                      setShowEditModal(true);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white transition-all"
                    style={{ backgroundColor: "#4047ee" }}
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() =>
                      setDeleteModal({
                        show: true,
                        id: offer.id,
                        name: offer.name,
                      })
                    }
                    className="px-3 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{ backgroundColor: "#ef4444", color: "white" }}
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#181f38" }}
          >
            <h2 className="text-2xl font-black text-white mb-6">
              {editingOffer ? "Редактировать предложение" : "Добавить предложение"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{
                    backgroundColor: "#050c26",
                    borderColor: "#242b47",
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{
                    backgroundColor: "#050c26",
                    borderColor: "#242b47",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Цена (сом) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{
                      backgroundColor: "#050c26",
                      borderColor: "#242b47",
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Категория *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{
                      backgroundColor: "#050c26",
                      borderColor: "#242b47",
                    }}
                    required
                  >
                    <option value="sauce">🥫 Соус</option>
                    <option value="drink">🥤 Напиток</option>
                    <option value="side">🍟 Гарнир</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Изображение
                </label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) =>
                    setFormData({ ...formData, imageUrl: url })
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="isActive" className="text-white font-semibold">
                  Активно
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: "#4047ee" }}
                >
                  {editingOffer ? "Сохранить" : "Создать"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingOffer(null);
                  }}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: "#242b47", color: "white" }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full"
            style={{ backgroundColor: "#181f38" }}
          >
            <h2 className="text-2xl font-black text-white mb-4">
              Удалить предложение?
            </h2>
            <p className="text-white mb-6">
              Вы уверены, что хотите удалить "{deleteModal.name}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: "#ef4444" }}
              >
                Удалить
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold transition-all"
                style={{ backgroundColor: "#242b47", color: "white" }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
