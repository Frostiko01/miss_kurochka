"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";
import ImageUpload from "@/components/admin/ImageUpload";
import Select from "@/components/ui/Select";
import { ArrowUp, ArrowDown, Plus, Trash2, X, Zap } from "lucide-react";

interface MenuItem { id: string; name: string; }

interface MiniCombo {
  id: string;
  name: string;
  description: string | null;
  items: string[];
  comboItems: { menuItemId: string; menuItem: { id: string; name: string } }[];
  price: number;
  oldPrice: number | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const defaultForm = {
  name: "", description: "", menuItemIds: [] as string[],
  price: "", oldPrice: "", imageUrl: "", isActive: true, sortOrder: "0",
};

const T = {
  bg: "#0B0F14", card: "#1A212B", cardAlt: "#202937",
  border: "rgba(255,255,255,0.05)", text: "white", muted: "#98A2B3", accent: "#7C8CA5",
};

export default function BranchMiniCombosPage() {
  const [combos, setCombos] = useState<MiniCombo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MiniCombo | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { fetchCombos(); fetchMenuItems(); }, [statusFilter]);

  const filteredCombos = search.trim()
    ? combos.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        c.items.some((it) => it.toLowerCase().includes(search.toLowerCase()))
      )
    : combos;

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "mini" });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/branch/combo-offers?${params}`);
      const data = await res.json();
      if (res.ok) {
        const sorted = [...(data.combos ?? [])].sort((a: MiniCombo, b: MiniCombo) => {
          const av = sortBy === "name" ? a.name.toLowerCase() : sortBy === "price" ? a.price : sortBy === "createdAt" ? new Date(a.createdAt).getTime() : a.sortOrder;
          const bv = sortBy === "name" ? b.name.toLowerCase() : sortBy === "price" ? b.price : sortBy === "createdAt" ? new Date(b.createdAt).getTime() : b.sortOrder;
          return sortOrder === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
        });
        setCombos(sorted);
      }
    } catch { setToast({ message: "Ошибка загрузки", type: "error" }); }
    finally { setLoading(false); }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/branch/menu-items?limit=200");
      const data = await res.json();
      if (res.ok) setMenuItems(data.menuItems ?? []);
    } catch {}
  };

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (c: MiniCombo) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "", menuItemIds: c.comboItems.map((ci) => ci.menuItemId), price: c.price.toString(), oldPrice: c.oldPrice?.toString() ?? "", imageUrl: c.imageUrl, isActive: c.isActive, sortOrder: c.sortOrder.toString() });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setToast({ message: "Введите название", type: "error" }); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setToast({ message: "Введите цену", type: "error" }); return; }
    if (!form.imageUrl.trim()) { setToast({ message: "Добавьте изображение", type: "error" }); return; }
    if (form.menuItemIds.length === 0) { setToast({ message: "Добавьте хотя бы одно блюдо", type: "error" }); return; }

    const body = { ...(editing ? { id: editing.id } : {}), name: form.name.trim(), description: form.description.trim() || null, menuItemIds: form.menuItemIds, price: parseFloat(form.price), oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null, imageUrl: form.imageUrl.trim(), isActive: form.isActive, sortOrder: parseInt(form.sortOrder) || 0, type: "mini" };
    const res = await fetch("/api/branch/combo-offers", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) { setToast({ message: editing ? "Обновлено" : "Создано", type: "success" }); setShowModal(false); fetchCombos(); }
    else { setToast({ message: data.error ?? "Ошибка", type: "error" }); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    const res = await fetch("/api/branch/combo-offers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteModal.id }) });
    if (res.ok) { setToast({ message: "Удалено", type: "success" }); setDeleteModal(null); fetchCombos(); }
    else { setToast({ message: "Ошибка удаления", type: "error" }); }
  };

  const toggleMenuItem = (id: string) => setForm((f) => ({ ...f, menuItemIds: f.menuItemIds.includes(id) ? f.menuItemIds.filter((x) => x !== id) : [...f.menuItemIds, id] }));

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: T.bg }}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Zap className="w-7 h-7" style={{ color: T.accent }} />
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Мини-комбо</h1>
        </div>
        <p className="font-semibold mt-1" style={{ color: T.muted }}>Небольшие наборы, отображаются внизу пользовательской страницы</p>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: T.muted }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Поиск мини-комбо..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border"
                  style={{ backgroundColor: T.bg, borderColor: T.border }} />
              </div>
            </div>
            <button onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{ backgroundColor: statusFilter !== "all" ? T.accent : T.cardAlt }}
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
            <button onClick={openAdd} className="px-6 py-3 text-white rounded-xl font-bold flex items-center gap-2 justify-center" style={{ backgroundColor: T.accent }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#93A4BF")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = T.accent)}>
              <Plus className="w-5 h-5" /> Добавить мини-комбо
            </button>
          </div>
          <div className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: showFiltersMenu ? '500px' : '0', opacity: showFiltersMenu ? 1 : 0 }}>
            <div className="pt-4 border-t" style={{ borderColor: T.border }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase" style={{ color: T.muted }}>Фильтры и сортировка</h3>
                {statusFilter !== "all" && (
                  <button onClick={() => setStatusFilter("all")} className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>Сбросить все</button>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: T.bg, borderColor: T.border }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: T.muted }}>Сортировка</label>
                  <Select dark="branch" value={sortBy} onChange={setSortBy}
                    options={[{ value: "sortOrder", label: "По порядку" }, { value: "name", label: "По названию" }, { value: "price", label: "По цене" }, { value: "createdAt", label: "По дате" }]} />
                </div>
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: T.bg, borderColor: T.border }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: T.muted }}>Статус</label>
                  <Select dark="branch" value={statusFilter} onChange={setStatusFilter}
                    options={[{ value: "all", label: "Все статусы" }, { value: "active", label: "Активные" }, { value: "inactive", label: "Неактивные" }]} />
                </div>
                <div className="rounded-xl p-4 border flex-1 min-w-[200px] flex flex-col justify-end" style={{ backgroundColor: T.bg, borderColor: T.border }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: T.muted }}>Порядок</label>
                  <div className="flex gap-2 w-full">
                    {(["asc", "desc"] as const).map((o) => (
                      <button key={o} onClick={() => setSortOrder(o)}
                        className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: sortOrder === o ? T.accent : T.card, color: sortOrder === o ? "white" : T.muted, borderWidth: "1px", borderStyle: "solid", borderColor: sortOrder === o ? T.accent : T.border }}>
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

      <div className="rounded-2xl p-6" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: T.accent }} /></div>
        ) : filteredCombos.length === 0 ? (
          <div className="text-center py-12"><Zap className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: T.muted }} /><p className="font-semibold" style={{ color: T.muted }}>{search ? `По запросу «${search}» ничего не найдено` : "Мини-комбо не найдены"}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map((c) => (
              <div key={c.id} className="rounded-2xl overflow-hidden border transition-all hover:border-[#7C8CA5]" style={{ backgroundColor: T.bg, borderColor: T.cardAlt }}>
                <div className="relative h-44">
                  <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                  {c.oldPrice && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-red-500">−{Math.round((1 - c.price / c.oldPrice) * 100)}%</span>}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: T.accent }}>Мини</span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-white mb-1">{c.name}</h3>
                  {c.description && <p className="text-sm mb-3" style={{ color: T.muted }}>{c.description}</p>}
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase mb-1.5" style={{ color: T.muted }}>Состав:</p>
                    <ul className="space-y-0.5">{c.items.map((it, i) => <li key={i} className="text-sm text-white flex items-center gap-1.5"><span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: T.accent }} />{it}</li>)}</ul>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    {c.oldPrice && <span className="text-sm line-through" style={{ color: T.muted }}>{c.oldPrice} сом</span>}
                    <span className="text-2xl font-black" style={{ color: T.accent }}>{c.price} сом</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: c.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: c.isActive ? "#22c55e" : "#ef4444" }}>{c.isActive ? "Активно" : "Неактивно"}</span>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openEdit(c)} className="flex-1 py-2 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: T.accent }}>Редактировать</button>
                    <button onClick={() => setDeleteModal({ id: c.id, name: c.name })} className="px-3 py-2 rounded-xl font-bold text-white" style={{ backgroundColor: "#ef4444" }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(11,15,20,0.82)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: T.card }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">{editing ? "Редактировать мини-комбо" : "Добавить мини-комбо"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg" style={{ color: T.muted }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Название *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border" style={{ backgroundColor: T.bg, borderColor: T.border }} /></Field>
              <Field label="Описание"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border" style={{ backgroundColor: T.bg, borderColor: T.border }} /></Field>
              <Field label="Блюда в составе *">
                <div className="max-h-48 overflow-y-auto rounded-xl border p-2 space-y-1" style={{ borderColor: T.border, backgroundColor: T.bg }}>
                  {menuItems.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/5">
                      <input type="checkbox" checked={form.menuItemIds.includes(m.id)} onChange={() => toggleMenuItem(m.id)} className="w-4 h-4 rounded" />
                      <span className="text-sm text-white">{m.name}</span>
                    </label>
                  ))}
                </div>
                {form.menuItemIds.length > 0 && <p className="text-xs mt-1" style={{ color: T.muted }}>Выбрано: {form.menuItemIds.length}</p>}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Цена (сом) *"><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border" style={{ backgroundColor: T.bg, borderColor: T.border }} /></Field>
                <Field label="Старая цена (сом)"><input type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border" style={{ backgroundColor: T.bg, borderColor: T.border }} /></Field>
              </div>
              <Field label="Изображение *"><ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} folder="combos" /></Field>
              <label className="flex items-center gap-3"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded" /><span className="text-white font-semibold">Активно</span></label>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: T.accent }}>
                  {editing ? "Сохранить" : "Создать"}
                </button>
                <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: T.cardAlt }}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(11,15,20,0.82)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: T.card }}>
            <h2 className="text-xl font-black text-white mb-3">Удалить мини-комбо?</h2>
            <p className="text-white mb-6">Вы уверены, что хотите удалить «{deleteModal.name}»?</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: "#ef4444" }}>Удалить</button>
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: T.cardAlt }}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-bold text-white mb-2">{label}</label>{children}</div>;
}
