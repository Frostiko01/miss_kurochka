"use client";

import { useState, useEffect } from "react";

// ─── Типы ───────────────────────────────────────────────────────────────────
type Section =
  | "general"
  | "delivery"
  | "orders"
  | "notifications"
  | "security"
  | "appearance";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  status: string;
  averageCookingTime: number | null;
  minOrderAmount: number | null;
}

// ─── Константы ──────────────────────────────────────────────────────────────
const SECTIONS: { id: Section; label: string; icon: string }[] = [
  {
    id: "general",
    label: "Общие",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
  {
    id: "delivery",
    label: "Доставка",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    id: "orders",
    label: "Заказы",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  },
  {
    id: "notifications",
    label: "Уведомления",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    id: "security",
    label: "Безопасность",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    id: "appearance",
    label: "Внешний вид",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  },
];

const BG = "#050c26";
const CARD = "#181f38";
const BORDER = "#242b47";
const ACCENT = "#4047ee";
const TEXT = "white";
const MUTED = "#78819d";
const INPUT_BG = "#050c26";

// ─── Компоненты ─────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start justify-between gap-6 py-5 border-b"
      style={{ borderColor: BORDER }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: TEXT }}>
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{ backgroundColor: checked ? ACCENT : BORDER }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 rounded-xl text-sm focus:outline-none border w-48"
      style={{
        backgroundColor: INPUT_BG,
        borderColor: BORDER,
        color: TEXT,
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
      onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl text-sm focus:outline-none border w-48"
      style={{ backgroundColor: INPUT_BG, borderColor: BORDER, color: TEXT }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ backgroundColor: CARD }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6 mb-5"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
    >
      <div className="mb-4">
        <h3 className="text-base font-bold" style={{ color: TEXT }}>
          {title}
        </h3>
        {description && (
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Системные настройки
  const [settings, setSettings] = useState({
    // Общие
    site_name: "Miss Kurochka",
    site_phone: "+996 555 183 333",
    site_email: "info@misskurochka.kg",
    site_address: "г. Бишкек",
    currency: "KGS",
    language: "ru",

    // Доставка
    delivery_enabled: "true",
    delivery_free_from: "1500",
    delivery_base_fee: "150",
    delivery_min_order: "500",
    delivery_time_min: "30",
    delivery_time_max: "60",
    delivery_radius_km: "10",

    // Заказы
    orders_auto_confirm: "false",
    orders_max_per_day: "500",
    orders_cancel_timeout: "15",
    orders_pickup_enabled: "true",
    orders_payment_card: "true",
    orders_payment_cash: "false",
    orders_payment_online: "false",

    // Уведомления
    notify_new_order_sound: "true",
    notify_new_order_email: "false",
    notify_order_status_sms: "false",
    notify_admin_email: "",

    // Безопасность
    session_timeout_hours: "24",
    max_login_attempts: "5",
    require_2fa_admin: "false",

    // Внешний вид
    theme_primary_color: "#d62300",
    show_promo_banner: "true",
    show_combo_section: "true",
    items_per_page: "20",
  });

  useEffect(() => {
    fetchSettings();
    fetchBranches();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/admin/branches");
      const data = await res.json();
      if (res.ok) setBranches(data.branches ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const set = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key as keyof typeof prev] === "true" ? "false" : "true",
    }));
  };

  const bool = (key: string) => settings[key as keyof typeof settings] === "true";

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight" style={{ color: TEXT }}>
            Настройки
          </h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Управление системой и конфигурация
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: saved ? "#22c55e" : ACCENT }}
        >
          {saving ? "Сохранение..." : saved ? "✓ Сохранено" : "Сохранить"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar навигация */}
        <aside className="w-56 shrink-0">
          <nav
            className="rounded-2xl p-2 sticky top-6"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                style={{
                  backgroundColor: activeSection === s.id ? ACCENT : "transparent",
                  color: activeSection === s.id ? "white" : MUTED,
                }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Контент */}
        <main className="flex-1 min-w-0">
          {/* ── ОБЩИЕ ── */}
          {activeSection === "general" && (
            <div>
              <SectionCard title="Информация о компании" description="Основные данные отображаемые на сайте">
                <SettingRow label="Название сайта">
                  <Input value={settings.site_name} onChange={(v) => set("site_name", v)} placeholder="Miss Kurochka" />
                </SettingRow>
                <SettingRow label="Телефон" description="Отображается в шапке и футере">
                  <Input value={settings.site_phone} onChange={(v) => set("site_phone", v)} placeholder="+996 555 000 000" />
                </SettingRow>
                <SettingRow label="Email">
                  <Input value={settings.site_email} onChange={(v) => set("site_email", v)} placeholder="info@example.com" type="email" />
                </SettingRow>
                <SettingRow label="Адрес">
                  <Input value={settings.site_address} onChange={(v) => set("site_address", v)} placeholder="г. Бишкек" />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Региональные настройки">
                <SettingRow label="Валюта">
                  <Select
                    value={settings.currency}
                    onChange={(v) => set("currency", v)}
                    options={[
                      { value: "KGS", label: "Сом (KGS)" },
                      { value: "KZT", label: "Тенге (KZT)" },
                      { value: "RUB", label: "Рубль (RUB)" },
                      { value: "USD", label: "Доллар (USD)" },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="Язык интерфейса">
                  <Select
                    value={settings.language}
                    onChange={(v) => set("language", v)}
                    options={[
                      { value: "ru", label: "Русский" },
                      { value: "kg", label: "Кыргызча" },
                      { value: "en", label: "English" },
                    ]}
                  />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Филиалы" description={`Всего филиалов: ${branches.length}`}>
                {branches.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: MUTED }}>Нет филиалов</p>
                ) : (
                  <div className="space-y-2">
                    {branches.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ backgroundColor: INPUT_BG, border: `1px solid ${BORDER}` }}
                      >
                        <div>
                          <p className="text-sm font-semibold" style={{ color: TEXT }}>{b.name}</p>
                          <p className="text-xs" style={{ color: MUTED }}>{b.address}</p>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-lg font-bold"
                          style={{
                            backgroundColor: b.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: b.status === "active" ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {b.status === "active" ? "Активен" : "Неактивен"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* ── ДОСТАВКА ── */}
          {activeSection === "delivery" && (
            <div>
              <SectionCard title="Параметры доставки">
                <SettingRow label="Доставка включена" description="Разрешить заказы с доставкой">
                  <Toggle checked={bool("delivery_enabled")} onChange={() => toggle("delivery_enabled")} />
                </SettingRow>
                <SettingRow label="Бесплатная доставка от (сом)" description="0 = всегда платная">
                  <Input value={settings.delivery_free_from} onChange={(v) => set("delivery_free_from", v)} type="number" placeholder="1500" />
                </SettingRow>
                <SettingRow label="Базовая стоимость доставки (сом)">
                  <Input value={settings.delivery_base_fee} onChange={(v) => set("delivery_base_fee", v)} type="number" placeholder="150" />
                </SettingRow>
                <SettingRow label="Минимальная сумма заказа (сом)">
                  <Input value={settings.delivery_min_order} onChange={(v) => set("delivery_min_order", v)} type="number" placeholder="500" />
                </SettingRow>
                <SettingRow label="Радиус доставки (км)">
                  <Input value={settings.delivery_radius_km} onChange={(v) => set("delivery_radius_km", v)} type="number" placeholder="10" />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Время доставки">
                <SettingRow label="Минимальное время (мин)">
                  <Input value={settings.delivery_time_min} onChange={(v) => set("delivery_time_min", v)} type="number" placeholder="30" />
                </SettingRow>
                <SettingRow label="Максимальное время (мин)">
                  <Input value={settings.delivery_time_max} onChange={(v) => set("delivery_time_max", v)} type="number" placeholder="60" />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {/* ── ЗАКАЗЫ ── */}
          {activeSection === "orders" && (
            <div>
              <SectionCard title="Обработка заказов">
                <SettingRow label="Автоподтверждение заказов" description="Заказы подтверждаются автоматически без участия оператора">
                  <Toggle checked={bool("orders_auto_confirm")} onChange={() => toggle("orders_auto_confirm")} />
                </SettingRow>
                <SettingRow label="Максимум заказов в день">
                  <Input value={settings.orders_max_per_day} onChange={(v) => set("orders_max_per_day", v)} type="number" placeholder="500" />
                </SettingRow>
                <SettingRow label="Время на отмену заказа (мин)" description="Клиент может отменить заказ в течение этого времени">
                  <Input value={settings.orders_cancel_timeout} onChange={(v) => set("orders_cancel_timeout", v)} type="number" placeholder="15" />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Типы заказов">
                <SettingRow label="Самовывоз" description="Разрешить заказы с самовывозом">
                  <Toggle checked={bool("orders_pickup_enabled")} onChange={() => toggle("orders_pickup_enabled")} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Способы оплаты">
                <SettingRow label="Оплата картой">
                  <Toggle checked={bool("orders_payment_card")} onChange={() => toggle("orders_payment_card")} />
                </SettingRow>
                <SettingRow label="Оплата наличными">
                  <Toggle checked={bool("orders_payment_cash")} onChange={() => toggle("orders_payment_cash")} />
                </SettingRow>
                <SettingRow label="Онлайн-оплата (Mbank, O!Dengi)">
                  <Toggle checked={bool("orders_payment_online")} onChange={() => toggle("orders_payment_online")} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {/* ── УВЕДОМЛЕНИЯ ── */}
          {activeSection === "notifications" && (
            <div>
              <SectionCard title="Уведомления о заказах">
                <SettingRow label="Звуковой сигнал при новом заказе" description="Воспроизводить звук в браузере">
                  <Toggle checked={bool("notify_new_order_sound")} onChange={() => toggle("notify_new_order_sound")} />
                </SettingRow>
                <SettingRow label="Email при новом заказе" description="Отправлять письмо администратору">
                  <Toggle checked={bool("notify_new_order_email")} onChange={() => toggle("notify_new_order_email")} />
                </SettingRow>
                <SettingRow label="SMS клиенту при смене статуса">
                  <Toggle checked={bool("notify_order_status_sms")} onChange={() => toggle("notify_order_status_sms")} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Контакты для уведомлений">
                <SettingRow label="Email администратора" description="Куда отправлять системные уведомления">
                  <Input value={settings.notify_admin_email} onChange={(v) => set("notify_admin_email", v)} placeholder="admin@example.com" type="email" />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {/* ── БЕЗОПАСНОСТЬ ── */}
          {activeSection === "security" && (
            <div>
              <SectionCard title="Сессии и доступ">
                <SettingRow label="Время сессии (часов)" description="Через сколько часов пользователь будет разлогинен">
                  <Input value={settings.session_timeout_hours} onChange={(v) => set("session_timeout_hours", v)} type="number" placeholder="24" />
                </SettingRow>
                <SettingRow label="Максимум попыток входа" description="После превышения аккаунт блокируется">
                  <Input value={settings.max_login_attempts} onChange={(v) => set("max_login_attempts", v)} type="number" placeholder="5" />
                </SettingRow>
                <SettingRow label="Двухфакторная аутентификация для админов" description="Требовать код при входе">
                  <Toggle checked={bool("require_2fa_admin")} onChange={() => toggle("require_2fa_admin")} />
                </SettingRow>
              </SectionCard>

              <SectionCard title="Статистика безопасности">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Активных сессий", value: "—" },
                    { label: "Попыток входа сегодня", value: "—" },
                    { label: "Заблокированных IP", value: "0" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl text-center"
                      style={{ backgroundColor: INPUT_BG, border: `1px solid ${BORDER}` }}
                    >
                      <p className="text-2xl font-black" style={{ color: TEXT }}>{stat.value}</p>
                      <p className="text-xs mt-1" style={{ color: MUTED }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── ВНЕШНИЙ ВИД ── */}
          {activeSection === "appearance" && (
            <div>
              <SectionCard title="Цвета и брендинг">
                <SettingRow label="Основной цвет бренда" description="Используется для кнопок и акцентов">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.theme_primary_color}
                      onChange={(e) => set("theme_primary_color", e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      style={{ backgroundColor: "transparent" }}
                    />
                    <Input value={settings.theme_primary_color} onChange={(v) => set("theme_primary_color", v)} placeholder="#d62300" />
                  </div>
                </SettingRow>
              </SectionCard>

              <SectionCard title="Отображение на сайте">
                <SettingRow label="Показывать промо-баннер" description="Баннер на главной странице лендинга">
                  <Toggle checked={bool("show_promo_banner")} onChange={() => toggle("show_promo_banner")} />
                </SettingRow>
                <SettingRow label="Показывать секцию комбо-наборов">
                  <Toggle checked={bool("show_combo_section")} onChange={() => toggle("show_combo_section")} />
                </SettingRow>
                <SettingRow label="Товаров на странице">
                  <Select
                    value={settings.items_per_page}
                    onChange={(v) => set("items_per_page", v)}
                    options={[
                      { value: "10", label: "10" },
                      { value: "20", label: "20" },
                      { value: "50", label: "50" },
                      { value: "100", label: "100" },
                    ]}
                  />
                </SettingRow>
              </SectionCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
