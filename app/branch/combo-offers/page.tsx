"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";
import ImageUpload from "@/components/admin/ImageUpload";
import Select from "@/components/ui/Select";
import { ArrowUp, ArrowDown, Plus } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
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

  const filteredCombos = search.trim()
    ? combos.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        c.items.some((it) => it.toLowerCase().includes(search.toLowerCase()))
      )
    : combos;

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
          let aValue: any, bValue: any;

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

      const filteredItems = formData.items.filter((item) => item.trim() !== "");
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
        setFormData({ name: "", description: "", items: [""], price: "", oldPrice: "", imageUrl: "", isActive: true, sortOrder: "0" });
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

      const filteredItems = formData.items.filter((item) => item.trim() !== "");
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

  const addItem = () => setFormData({ ...formData, items: [...formData.items, ""] });

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
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">
          Комбо-наборы
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#98A2B3' }}>
          Управление специальными предложениями вашего филиала
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#1A212B', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Поиск комбо-наборов..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border"
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
            <button onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{ backgroundColor: statusFilter !== "all" ? '#7C8CA5' : '#2A3442' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Фильтры
              <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ transform: showFiltersMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormData({ name: "", description: "", items: [""], price: "", oldPrice: "", imageUrl: "", isActive: true, sortOrder: "0" });
              }}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center"
              style={{ backgroundColor: '#7C8CA5' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#93A4BF')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7C8CA5')}>
              <Plus className="w-5 h-5" />
              Добавить комбо
            </button>
          </div>

          <div className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: showFiltersMenu ? '500px' : '0', opacity: showFiltersMenu ? 1 : 0 }}>
            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase" style={{ color: '#98A2B3' }}>Фильтры и сортировка</h3>
                {statusFilter !== "all" && (
                  <button onClick={() => setStatusFilter("all")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                    Сбросить все
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>Сортировка</label>
                  <Select dark="branch" value={sortBy} onChange={setSortBy}
                    options={[{ value: 'sortOrder', label: 'По порядку' }, { value: 'name', label: 'По названию' }, { value: 'price', label: 'По цене' }, { value: 'createdAt', label: 'По дате' }]} />
                </div>
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>Статус</label>
                  <Select dark="branch" value={statusFilter} onChange={setStatusFilter}
                    options={[{ value: 'all', label: 'Все статусы' }, { value: 'active', label: 'Активные' }, { value: 'inactive', label: 'Неактивные' }]} />
                </div>
                <div className="rounded-xl p-4 border flex-1 min-w-[200px] flex flex-col justify-end" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>Порядок</label>
                  <div className="flex gap-2 w-full">
                    {(["asc", "desc"] as const).map((o) => (
                      <button key={o} onClick={() => setSortOrder(o)}
                        className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: sortOrder === o ? '#7C8CA5' : '#1A212B', color: sortOrder === o ? 'white' : '#98A2B3', borderWidth: '1px', borderStyle: 'solid', borderColor: sortOrder === o ? '#7C8CA5' : 'rgba(255,255,255,0.05)' }}>
                        {o === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        <span className="text-sm">{o === "asc" ? "А-Я" : "Я-А"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#1A212B', border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#d62300' }}></div>
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold" style={{ color: '#98A2B3' }}>
              {search ? `По запросу «${search}» ничего не найдено` : "Комбо-наборы не найдены"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map((combo) => (
              <div
                key={combo.id}
                className="rounded-2xl overflow-hidden border transition-all hover:border-[#d62300]"
                style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}
              >
                {/* Image */}
                <div className="relative h-48">
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
                    <p className="text-sm mb-4" style={{ color: '#98A2B3' }}>
                      {combo.description}
                    </p>
                  )}

                  {/* Items */}
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase mb-2" style={{ color: '#98A2B3' }}>
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
                      <span className="text-lg line-through" style={{ color: '#98A2B3' }}>
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
                        color: combo.isActive ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {combo.isActive ? 'Активно' : 'Неактивно'}
                    </span>
                  </div>

                  {/* Actions */}
                  {combo.branchId !== null ? (
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
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs font-semibold" style={{ color: '#98A2B3' }}>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(11,15,20,0.82)', backdropFilter: 'blur(4px)' }}>
          <div
            className="rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#1A212B', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <h2 className="text-2xl font-black text-white mb-6">
              {editingCombo ? "Редактировать комбо" : "Добавить комбо"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
                  placeholder="Например: Семейный комбо"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
                  placeholder="Краткое описание комбо"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Состав комбо *</label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl text-white focus:outline-none border"
                      style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
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
                  style={{ backgroundColor: '#202937' }}
                >
                  + Добавить элемент
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Цена (сом) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
                    placeholder="299"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Старая цена (сом)</label>
                  <input
                    type="number"
                    value={formData.oldPrice}
                    onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
                    placeholder="399"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Порядок сортировки</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Изображение *</label>
                <ImageUpload
                  value={formData.imageUrl}
                  folder="combos"
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="isActive" className="text-white font-semibold">Активно</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingCombo ? handleEditCombo : handleAddCombo}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#d62300' }}
                >
                  {editingCombo ? "Сохранить" : "Создать"}
                </button>
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingCombo(null); }}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#202937', color: 'white' }}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(11,15,20,0.82)', backdropFilter: 'blur(4px)' }}>
          <div
            className="rounded-2xl p-6 max-w-md w-full"
            style={{ backgroundColor: '#1A212B', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <h2 className="text-2xl font-black text-white mb-4">Удалить комбо?</h2>
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
                style={{ backgroundColor: '#202937', color: 'white' }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
