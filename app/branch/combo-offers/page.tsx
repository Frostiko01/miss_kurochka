"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";
import ImageUpload from "@/components/admin/ImageUpload";

interface ComboOffer {
  id: string;
  name: string;
  description: string | null;
  items: string[];
  price: number;
  oldPrice: number | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  branchId: string | null;
  createdAt: string;
}

export default function BranchComboOffersPage() {
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: string;
    name: string;
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboOffer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    items: [""],
    price: "",
    oldPrice: "",
    imageUrl: "",
    isActive: true,
    sortOrder: "0",
  });

  useEffect(() => {
    fetchCombos();
  }, [statusFilter]);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/branch/combo-offers?${params}`);
      const data = await response.json();

      if (response.ok) {
        let sorted = [...data.combos];
        
        sorted.sort((a, b) => {
          let aValue, bValue;
          
          switch (sortBy) {
            case "name":
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case "price":
              aValue = a.price;
              bValue = b.price;
              break;
            case "sortOrder":
              aValue = a.sortOrder;
              bValue = b.sortOrder;
              break;
            case "createdAt":
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            default:
              aValue = a.sortOrder;
              bValue = b.sortOrder;
          }
          
          if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
          if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
        
        setCombos(sorted);
      }
    } catch (error) {
      console.error("Error fetching combos:", error);
      setToast({ message: "Ошибка загрузки комбо-наборов", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCombo = async () => {
    try {
      // Валидация
      if (!formData.name.trim()) {
        setToast({ message: "Введите название комбо", type: "error" });
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setToast({ message: "Введите корректную цену", type: "error" });
        return;
      }
      if (!formData.imageUrl.trim()) {
        setToast({ message: "Добавьте изображение", type: "error" });
        return;
      }
      
      // Фильтруем пустые элементы
      const filteredItems = formData.items.filter(item => item.trim() !== "");
      if (filteredItems.length === 0) {
        setToast({ message: "Добавьте хотя бы один элемент в комбо", type: "error" });
        return;
      }

      const response = await fetch("/api/branch/combo-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          items: filteredItems,
          price: parseFloat(formData.price),
          oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
          imageUrl: formData.imageUrl.trim(),
          isActive: formData.isActive,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: "Комбо успешно добавлено", type: "success" });
        setShowAddModal(false);
        setFormData({
          name: "",
          description: "",
          items: [""],
          price: "",
          oldPrice: "",
          imageUrl: "",
          isActive: true,
          sortOrder: "0",
        });
        fetchCombos();
      } else {
        setToast({ message: data.error || "Ошибка при добавлении", type: "error" });
      }
    } catch (error) {
      console.error("Error adding combo:", error);
      setToast({ message: "Ошибка при добавлении комбо", type: "error" });
    }
  };

  const handleEditCombo = async () => {
    if (!editingCombo) return;

    try {
      // Валидация
      if (!formData.name.trim()) {
        setToast({ message: "Введите название комбо", type: "error" });
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setToast({ message: "Введите корректную цену", type: "error" });
        return;
      }
      if (!formData.imageUrl.trim()) {
        setToast({ message: "Добавьте изображение", type: "error" });
        return;
      }
      
      // Фильтруем пустые элементы
      const filteredItems = formData.items.filter(item => item.trim() !== "");
      if (filteredItems.length === 0) {
        setToast({ message: "Добавьте хотя бы один элемент в комбо", type: "error" });
        return;
      }

      const response = await fetch("/api/branch/combo-offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCombo.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          items: filteredItems,
          price: parseFloat(formData.price),
          oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
          imageUrl: formData.imageUrl.trim(),
          isActive: formData.isActive,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: "Комбо успешно обновлено", type: "success" });
        setShowEditModal(false);
        setEditingCombo(null);
        fetchCombos();
      } else {
        setToast({ message: data.error || "Ошибка при обновлении", type: "error" });
      }
    } catch (error) {
      console.error("Error updating combo:", error);
      setToast({ message: "Ошибка при обновлении комбо", type: "error" });
    }
  };

  const handleDeleteCombo = async () => {
    if (!deleteModal) return;

    try {
      const response = await fetch("/api/branch/combo-offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModal.id }),
      });

      if (response.ok) {
        setToast({ message: "Комбо успешно удалено", type: "success" });
        setDeleteModal(null);
        fetchCombos();
      } else {
        const data = await response.json();
        setToast({ message: data.error || "Ошибка при удалении", type: "error" });
      }
    } catch (error) {
      console.error("Error deleting combo:", error);
      setToast({ message: "Ошибка при удалении комбо", type: "error" });
    }
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, ""] });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length > 0 ? newItems : [""] });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">
          Комбо-наборы
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#78819d' }}>
          Управление специальными предложениями вашего филиала
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#181f38' }}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white focus:outline-none transition-all border"
              style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white focus:outline-none transition-all border"
              style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
            >
              <option value="sortOrder">По порядку</option>
              <option value="name">По названию</option>
              <option value="price">По цене</option>
              <option value="createdAt">По дате</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder("asc")}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                sortOrder === "asc" ? "bg-[#d62300] text-white" : "bg-[#242b47] text-[#78819d]"
              }`}
            >
              ↑
            </button>
            <button
              onClick={() => setSortOrder("desc")}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                sortOrder === "desc" ? "bg-[#d62300] text-white" : "bg-[#242b47] text-[#78819d]"
              }`}
            >
              ↓
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              setShowAddModal(true);
              setFormData({
                name: "",
                description: "",
                items: [""],
                price: "",
                oldPrice: "",
                imageUrl: "",
                isActive: true,
                sortOrder: "0",
              });
            }}
            className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2"
            style={{ backgroundColor: '#d62300' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить комбо
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#d62300' }}></div>
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold" style={{ color: '#78819d' }}>
              Комбо-наборы не найдены
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="rounded-2xl overflow-hidden border-2 transition-all hover:border-[#d62300]"
                style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800">
                  <img
                    src={combo.imageUrl}
                    alt={combo.name}
                    className="w-full h-full object-cover"
                  />
                  {combo.branchId === null && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#d62300] text-white">
                        Глобальное
                      </span>
                    </div>
                  )}
                  {combo.oldPrice && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                        СКИДКА
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-black text-white mb-2">{combo.name}</h3>
                  {combo.description && (
                    <p className="text-sm mb-4" style={{ color: '#78819d' }}>
                      {combo.description}
                    </p>
                  )}

                  {/* Items */}
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase mb-2" style={{ color: '#78819d' }}>
                      Состав:
                    </p>
                    <ul className="space-y-1">
                      {combo.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-white flex items-start">
                          <span className="text-[#d62300] mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    {combo.oldPrice && (
                      <span className="text-lg line-through" style={{ color: '#78819d' }}>
                        {combo.oldPrice} сом
                      </span>
                    )}
                    <span className="text-3xl font-black text-[#d62300]">
                      {combo.price} сом
                    </span>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: combo.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: combo.isActive ? '#22c55e' : '#ef4444'
                      }}
                    >
                      {combo.isActive ? 'Активно' : 'Неактивно'}
                    </span>
                  </div>

                  {/* Actions - только для своих комбо */}
                  {combo.branchId !== null && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCombo(combo);
                          setFormData({
                            name: combo.name,
                            description: combo.description || "",
                            items: combo.items,
                            price: combo.price.toString(),
                            oldPrice: combo.oldPrice?.toString() || "",
                            imageUrl: combo.imageUrl,
                            isActive: combo.isActive,
                            sortOrder: combo.sortOrder.toString(),
                          });
                          setShowEditModal(true);
                        }}
                        className="flex-1 px-4 py-2 rounded-xl font-bold text-white transition-all"
                        style={{ backgroundColor: '#d62300' }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => setDeleteModal({ show: true, id: combo.id, name: combo.name })}
                        className="px-4 py-2 rounded-xl font-bold text-white transition-all"
                        style={{ backgroundColor: '#ef4444' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {combo.branchId === null && (
                    <div className="text-center py-2">
                      <p className="text-xs font-semibold" style={{ color: '#78819d' }}>
                        Глобальное комбо (только просмотр)
                      </p>
                    </div>
                  )}
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
            style={{ backgroundColor: '#181f38' }}
          >
            <h2 className="text-2xl font-black text-white mb-6">
              {editingCombo ? "Редактировать комбо" : "Добавить комбо"}
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  placeholder="Например: Семейный комбо"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  placeholder="Краткое описание комбо"
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Состав комбо *
                </label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl text-white focus:outline-none border"
                      style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                      placeholder={`Элемент ${index + 1}`}
                    />
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="px-4 py-3 rounded-xl font-bold text-white"
                        style={{ backgroundColor: '#ef4444' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="w-full px-4 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#242b47' }}
                >
                  + Добавить элемент
                </button>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Цена (сом) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="299"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Старая цена (сом)
                  </label>
                  <input
                    type="number"
                    value={formData.oldPrice}
                    onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="399"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Порядок сортировки
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  placeholder="0"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Изображение *
                </label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                />
              </div>

              {/* Active */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="isActive" className="text-white font-semibold">
                  Активно
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingCombo ? handleEditCombo : handleAddCombo}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#d62300' }}
                >
                  {editingCombo ? "Сохранить" : "Создать"}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingCombo(null);
                  }}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47', color: 'white' }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full"
            style={{ backgroundColor: '#181f38' }}
          >
            <h2 className="text-2xl font-black text-white mb-4">
              Удалить комбо?
            </h2>
            <p className="text-white mb-6">
              Вы уверены, что хотите удалить "{deleteModal.name}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCombo}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#ef4444' }}
              >
                Удалить
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold transition-all"
                style={{ backgroundColor: '#242b47', color: 'white' }}
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
