"use client";

import { useState, useEffect } from "react";
import ImageUpload from "@/components/admin/ImageUpload";
import Toast from "@/components/admin/Toast";

// ─── Типы ───────────────────────────────────────────────────────────────────
interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkTarget: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  creator: { fullName: string; email: string };
}

// ─── Стили ──────────────────────────────────────────────────────────────────
const BG = "#050c26";
const CARD = "#181f38";
const BORDER = "#242b47";
const ACCENT = "#4047ee";
const TEXT = "white";
const MUTED = "#78819d";
const INPUT_BG = "#050c26";

const inputCls = "w-full px-4 py-3 rounded-xl text-white focus:outline-none border text-sm";
const inputStyle = { backgroundColor: INPUT_BG, borderColor: BORDER };

// ─── Пустая форма ───────────────────────────────────────────────────────────
const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkTarget: "",
  sortOrder: "0",
  isActive: true,
  startsAt: "",
  expiresAt: "",
};

// ─── Компонент ──────────────────────────────────────────────────────────────
export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      if (res.ok) setBanners(data.banners ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      imageUrl: b.imageUrl,
      linkTarget: b.linkTarget ?? "",
      sortOrder: String(b.sortOrder),
      isActive: b.isActive,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : "",
      expiresAt: b.expiresAt ? b.expiresAt.slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        title: form.title,
        subtitle: form.subtitle || null,
        imageUrl: form.imageUrl,
        linkTarget: form.linkTarget || null,
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      };

      const res = await fetch("/api/admin/banners", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToast({ message: editing ? "Баннер обновлён" : "Баннер создан", type: "success" });
        setShowModal(false);
        fetchBanners();
      } else {
        const data = await res.json();
        setToast({ message: data.error || "Ошибка", type: "error" });
      }
    } catch (e) {
      setToast({ message: "Ошибка сети", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: Banner) => {
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, isActive: !b.isActive }),
      });
      if (res.ok) fetchBanners();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch("/api/admin/banners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      if (res.ok) {
        setToast({ message: "Баннер удалён", type: "success" });
        setDeleteId(null);
        fetchBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isExpired = (b: Banner) =>
    b.expiresAt ? new Date(b.expiresAt) < new Date() : false;

  const isScheduled = (b: Banner) =>
    b.startsAt ? new Date(b.startsAt) > new Date() : false;

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ backgroundColor: BG }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight" style={{ color: TEXT }}>
            Баннеры
          </h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Управление рекламными баннерами на сайте
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all"
          style={{ backgroundColor: ACCENT }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить баннер
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Всего", value: banners.length, color: ACCENT },
          { label: "Активных", value: banners.filter((b) => b.isActive && !isExpired(b)).length, color: "#22c55e" },
          { label: "Запланированных", value: banners.filter(isScheduled).length, color: "#f59e0b" },
          { label: "Истёкших", value: banners.filter(isExpired).length, color: "#ef4444" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 text-center"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1 font-semibold" style={{ color: MUTED }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Список баннеров */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: BORDER }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-semibold" style={{ color: MUTED }}>Баннеров пока нет</p>
            <button onClick={openCreate} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: ACCENT }}>
              Создать первый
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {banners.map((b) => {
              const expired = isExpired(b);
              const scheduled = isScheduled(b);
              return (
                <div key={b.id} className="flex items-center gap-4 p-4">
                  {/* Превью */}
                  <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: INPUT_BG }}>
                    <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{b.title}</p>
                      {/* Статус */}
                      {expired ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }}>Истёк</span>
                      ) : scheduled ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Запланирован</span>
                      ) : b.isActive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>Активен</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(120,129,157,0.15)", color: MUTED }}>Выключен</span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(64,71,238,0.15)", color: ACCENT }}>
                        #{b.sortOrder}
                      </span>
                    </div>
                    {b.subtitle && (
                      <p className="text-xs truncate" style={{ color: MUTED }}>{b.subtitle}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: MUTED }}>
                      {b.startsAt && <span>С {new Date(b.startsAt).toLocaleDateString("ru-RU")}</span>}
                      {b.expiresAt && <span>До {new Date(b.expiresAt).toLocaleDateString("ru-RU")}</span>}
                      {b.linkTarget && <span className="truncate max-w-[120px]">→ {b.linkTarget}</span>}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleActive(b)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ backgroundColor: b.isActive ? ACCENT : BORDER }}
                      title={b.isActive ? "Выключить" : "Включить"}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{ transform: b.isActive ? "translateX(22px)" : "translateX(2px)" }}
                      />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(b)}
                      className="p-2 rounded-lg transition-all"
                      style={{ backgroundColor: "rgba(64,71,238,0.1)", color: ACCENT }}
                      title="Редактировать"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteId(b.id)}
                      className="p-2 rounded-lg transition-all"
                      style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                      title="Удалить"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── МОДАЛКА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: BORDER }}>
              <h2 className="text-xl font-bold" style={{ color: TEXT }}>
                {editing ? "Редактировать баннер" : "Новый баннер"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg"
                style={{ color: MUTED }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Изображение */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: TEXT }}>
                  Изображение <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <ImageUpload
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                  folder="banners"
                />
                {form.imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden h-32">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Заголовок */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: TEXT }}>
                  Заголовок <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Например: Скидка 20% на все комбо"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* Подзаголовок */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: TEXT }}>
                  Подзаголовок
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Дополнительный текст"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* Ссылка */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: TEXT }}>
                  Ссылка при нажатии
                </label>
                <input
                  type="text"
                  value={form.linkTarget}
                  onChange={(e) => setForm({ ...form, linkTarget: e.target.value })}
                  placeholder="/menu или https://..."
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* Сортировка и активность */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: TEXT }}>
                    Порядок сортировки
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className={inputCls}
                    style={inputStyle}
                    min="0"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ backgroundColor: form.isActive ? ACCENT : BORDER }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{ transform: form.isActive ? "translateX(22px)" : "translateX(2px)" }}
                      />
                    </button>
                    <span className="text-sm font-bold" style={{ color: TEXT }}>Активен</span>
                  </label>
                </div>
              </div>

              {/* Даты */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: TEXT }}>
                    Дата начала
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className={inputCls}
                    style={{ ...inputStyle, colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: TEXT }}>
                    Дата окончания
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className={inputCls}
                    style={{ ...inputStyle, colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: BORDER, color: TEXT }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.imageUrl}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── МОДАЛКА УДАЛЕНИЯ ── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDeleteId(null)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ef4444" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center mb-2" style={{ color: TEXT }}>Удалить баннер?</h3>
            <p className="text-sm text-center mb-6" style={{ color: MUTED }}>Это действие нельзя отменить</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: BORDER, color: TEXT }}
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: "#ef4444" }}
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
