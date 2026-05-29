"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";
import ImageUpload from "@/components/admin/ImageUpload";
import Select from "@/components/ui/Select";
import { ArrowUp, ArrowDown, Plus } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  sizes: { price: number }[];
}

interface ComboOffer {
  id: string;
  name: string;
  description: string | null;
  items: string[];
  comboItems: { id: string; menuItemId: string; menuItem: { id: string; name: string } }[];
  price: number;
  oldPrice: number | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface FormData {
  name: string;
  description: string;
  menuItemIds: string[];
  price: string;
  oldPrice: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: string;
}

const defaultForm: FormData = {
  name: "",
  description: "",
  menuItemIds: [],
  price: "",
  oldPrice: "",
  imageUrl: "",
  isActive: true,
  sortOrder: "0",
};

// ─── ComboForm вынесен на уровень модуля ──────────────────────────────────────
// Если объявить его внутри родительского компонента, React будет пересоздавать
// его при каждом изменении state → поле теряет фокус после каждой буквы.
interface ComboFormProps {
  formData: FormData;
  menuItems: MenuItem[];
  onChange: (data: FormData) => void;
}

function ComboForm({ formData, menuItems, onChange }: ComboFormProps) {
  const toggleMenuItem = (id: string) => {
    onChange({
      ...formData,
      menuItemIds: formData.menuItemIds.includes(id)
        ? formData.menuItemIds.filter((x) => x !== id)
        : [...formData.menuItemIds, id],
    });
  };

  return (
    <div className="space-y-4">
      {/* Название */}
      <div>
        <label className="block text-sm font-bold text-white mb-2">
          Название <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
          style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
          placeholder="Например: Комбо №1"
        />
      </div>

      {/* Описание */}
      <div>
        <label className="block text-sm font-bold text-white mb-2">Описание</label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border resize-none"
          style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
          rows={2}
          placeholder="Краткое описание"
        />
      </div>

      {/* Выбор блюд */}
      <div>
        <label className="block text-sm font-bold text-white mb-2">
          Состав (блюда) <span className="text-red-400">*</span>
          <span className="ml-2 text-xs font-normal" style={{ color: "#78819d" }}>
            Выбрано: {formData.menuItemIds.length}
          </span>
        </label>
        <div
          className="max-h-48 overflow-y-auto rounded-xl border p-2 space-y-1"
          style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
        >
          {menuItems.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#78819d" }}>
              Блюда не найдены
            </p>
          ) : (
            menuItems.map((item) => {
              const selected = formData.menuItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleMenuItem(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition"
                  style={{
                    backgroundColor: selected ? "rgba(64,71,238,0.2)" : "transparent",
                    border: `1px solid ${selected ? "#4047ee" : "transparent"}`,
                  }}
                >
                  <span
                    className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition"
                    style={{
                      borderColor: selected ? "#4047ee" : "#78819d",
                      backgroundColor: selected ? "#4047ee" : "transparent",
                    }}
                  >
                    {selected && <span className="w-2 h-2 bg-white rounded-sm" />}
                  </span>
                  <span className="text-sm font-semibold text-white truncate">{item.name}</span>
                  {item.sizes?.[0] && (
                    <span className="ml-auto text-xs shrink-0" style={{ color: "#78819d" }}>
                      {Number(item.sizes[0].price)} сом
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Цена */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Цена <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => onChange({ ...formData, price: e.target.value })}
            className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
            style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">Старая цена</label>
          <input
            type="number"
            value={formData.oldPrice}
            onChange={(e) => onChange({ ...formData, oldPrice: e.target.value })}
            className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
            style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Порядок */}
      <div>
        <label className="block text-sm font-bold text-white mb-2">Порядок сортировки</label>
        <input
          type="number"
          value={formData.sortOrder}
          onChange={(e) => onChange({ ...formData, sortOrder: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
          style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
          placeholder="0"
          min="0"
        />
      </div>

      {/* Изображение */}
      <ImageUpload
        value={formData.imageUrl}
        onChange={(url) => onChange({ ...formData, imageUrl: url })}
        label="Изображение"
        required
        folder="combos"
      />

      {/* Активность */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => onChange({ ...formData, isActive: e.target.checked })}
          className="w-5 h-5 rounded"
          style={{ accentColor: "#4047ee" }}
        />
        <span className="text-sm font-bold text-white">Активно</span>
      </label>
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function AdminComboOffersPage() {
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string; name: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboOffer | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);

  useEffect(() => {
    fetchCombos();
    fetchMenuItems();
  }, [statusFilter, sortBy, sortOrder, search]);

  const filteredCombos = combos;

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/admin/menu-items");
      const data = await res.json();
      if (res.ok) setMenuItems(data.menuItems ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      const response = await fetch(`/api/admin/combo-offers?${params}`);
      const data = await response.json();
      if (response.ok) {
        setCombos(data.combos ?? []);
      }
    } catch {
      setToast({ message: "Ошибка загрузки комбо-наборов", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!formData.name.trim()) { setToast({ message: "Введите название комбо", type: "error" }); return false; }
    if (!formData.price || parseFloat(formData.price) <= 0) { setToast({ message: "Введите корректную цену", type: "error" }); return false; }
    if (!formData.imageUrl.trim()) { setToast({ message: "Добавьте изображение", type: "error" }); return false; }
    if (formData.menuItemIds.length === 0) { setToast({ message: "Выберите хотя бы одно блюдо", type: "error" }); return false; }
    return true;
  };

  const handleAddCombo = async () => {
    if (!validate()) return;
    try {
      const response = await fetch("/api/admin/combo-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          menuItemIds: formData.menuItemIds,
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
        setFormData(defaultForm);
        fetchCombos();
      } else {
        setToast({ message: data.error || "Ошибка при добавлении", type: "error" });
      }
    } catch {
      setToast({ message: "Ошибка при добавлении комбо", type: "error" });
    }
  };

  const handleEditCombo = async () => {
    if (!editingCombo || !validate()) return;
    try {
      const response = await fetch("/api/admin/combo-offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCombo.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          menuItemIds: formData.menuItemIds,
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
    } catch {
      setToast({ message: "Ошибка при обновлении комбо", type: "error" });
    }
  };

  const handleDeleteCombo = async () => {
    if (!deleteModal) return;
    try {
      const response = await fetch("/api/admin/combo-offers", {
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
    } catch {
      setToast({ message: "Ошибка при удалении комбо", type: "error" });
    }
  };

  const openEdit = (combo: ComboOffer) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description || "",
      menuItemIds: combo.comboItems?.map((ci) => ci.menuItemId) ?? [],
      price: combo.price.toString(),
      oldPrice: combo.oldPrice?.toString() || "",
      imageUrl: combo.imageUrl,
      isActive: combo.isActive,
      sortOrder: combo.sortOrder.toString(),
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingCombo(null);
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: "#050c26" }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Комбо-наборы</h1>
          <p className="font-semibold mt-2" style={{ color: "#78819d" }}>
            Управление специальными предложениями
          </p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setFormData(defaultForm); }}
          className="px-6 py-3 text-white rounded-xl font-bold flex items-center gap-2"
          style={{ backgroundColor: "#4047ee" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить комбо
        </button>
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#181f38" }}>
        <div className="flex flex-col gap-4">
          {/* Row 1: Search + Filters Button + Add Button */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#78819d" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Поиск комбо-наборов..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-300 focus:outline-none transition-all border"
                  style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
                />
              </div>
            </div>
            {/* Filters Button */}
            <button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{ backgroundColor: statusFilter !== "all" ? "#4047ee" : "#242b47" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Фильтры
              <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ transform: showFiltersMenu ? "rotate(180deg)" : "rotate(0deg)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Add Button */}
            <button
              onClick={() => { setShowAddModal(true); setFormData(defaultForm); }}
              className="px-6 py-3 text-white rounded-xl font-bold flex items-center gap-2 justify-center"
              style={{ backgroundColor: "#4047ee" }}
            >
              <Plus className="w-5 h-5" />
              Добавить комбо
            </button>
          </div>

          {/* Expandable Filters */}
          <div className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: showFiltersMenu ? "500px" : "0", opacity: showFiltersMenu ? 1 : 0 }}>
            <div className="pt-4 border-t" style={{ borderColor: "#242b47" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase" style={{ color: "#78819d" }}>Фильтры и сортировка</h3>
                {statusFilter !== "all" && (
                  <button onClick={() => setStatusFilter("all")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }}>
                    Сбросить все
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: "#78819d" }}>Сортировка</label>
                  <Select dark="admin" value={sortBy} onChange={setSortBy}
                    options={[
                      { value: "sortOrder", label: "По порядку" },
                      { value: "name", label: "По названию" },
                      { value: "price", label: "По цене" },
                      { value: "createdAt", label: "По дате" },
                    ]} />
                </div>
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: "#78819d" }}>Статус</label>
                  <Select dark="admin" value={statusFilter} onChange={setStatusFilter}
                    options={[
                      { value: "all", label: "Все статусы" },
                      { value: "active", label: "Активные" },
                      { value: "inactive", label: "Неактивные" },
                    ]} />
                </div>
                <div className="rounded-xl p-4 border flex-1 min-w-[200px] flex flex-col justify-end" style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: "#78819d" }}>Порядок</label>
                  <div className="flex gap-2 w-full">
                    {(["asc", "desc"] as const).map((o) => (
                      <button key={o} onClick={() => setSortOrder(o)}
                        className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: sortOrder === o ? "#4047ee" : "#181f38",
                          color: sortOrder === o ? "white" : "#78819d",
                          borderWidth: "1px", borderStyle: "solid",
                          borderColor: sortOrder === o ? "#4047ee" : "#242b47",
                        }}>
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
      <div className="rounded-2xl p-6" style={{ backgroundColor: "#181f38" }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#4047ee" }} />
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold" style={{ color: "#78819d" }}>
              {search ? `По запросу «${search}» ничего не найдено` : "Комбо-наборы не найдены"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCombos.map((combo) => (
              <div
                key={combo.id}
                className="rounded-xl p-4 border transition-all"
                style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
              >
                <div className="w-full h-44 rounded-lg mb-3 overflow-hidden bg-[#181f38]">
                  {combo.imageUrl ? (
                    <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍗</div>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1 truncate">{combo.name}</h3>
                {combo.description && (
                  <p className="text-xs line-clamp-2 mb-2" style={{ color: "#78819d" }}>
                    {combo.description}
                  </p>
                )}

                {combo.items && combo.items.length > 0 && (
                  <ul className="space-y-0.5 mb-3">
                    {combo.items.slice(0, 4).map((item, idx) => (
                      <li key={idx} className="text-xs flex items-center gap-1.5" style={{ color: "#78819d" }}>
                        <span className="w-1 h-1 bg-[#4047ee] rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                    {combo.items.length > 4 && (
                      <li className="text-xs" style={{ color: "#4047ee" }}>
                        +{combo.items.length - 4} ещё
                      </li>
                    )}
                  </ul>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {combo.oldPrice && (
                    <span className="text-xs line-through" style={{ color: "#78819d" }}>
                      {combo.oldPrice} сом
                    </span>
                  )}
                  <span className="text-lg font-black" style={{ color: "#4047ee" }}>
                    {combo.price} сом
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      backgroundColor: combo.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: combo.isActive ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {combo.isActive ? "Активно" : "Неактивно"}
                  </span>
                  <span className="text-xs" style={{ color: "#78819d" }}>
                    #{combo.sortOrder}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(combo)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: "#4047ee" }}
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => setDeleteModal({ show: true, id: combo.id, name: combo.name })}
                    className="px-3 py-2 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#181f38" }}
          >
            <h2 className="text-2xl font-black text-white mb-6">
              {showAddModal ? "Добавить комбо" : "Редактировать комбо"}
            </h2>

            <ComboForm
              formData={formData}
              menuItems={menuItems}
              onChange={setFormData}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: "#242b47" }}
              >
                Отмена
              </button>
              <button
                onClick={showAddModal ? handleAddCombo : handleEditCombo}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: "#4047ee" }}
              >
                {showAddModal ? "Добавить" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: "#181f38" }}>
            <h2 className="text-2xl font-black text-white mb-4">Удалить комбо?</h2>
            <p className="mb-6" style={{ color: "#78819d" }}>
              Вы уверены, что хотите удалить{" "}
              <span className="font-bold text-white">"{deleteModal.name}"</span>? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: "#242b47" }}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteCombo}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: "#ef4444" }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
