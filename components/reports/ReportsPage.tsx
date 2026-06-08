"use client";

import { useEffect, useState } from "react";

export type Theme = "branch" | "admin";

export interface BranchOption {
  id: string;
  name: string;
}

interface HistoryItem {
  id: string;
  reportType: string;
  format: string;
  scope?: string;
  periodStart: string;
  periodEnd: string;
  fileName: string;
  fileSize: number | null;
  createdAt: string;
  branchName?: string;
  userName?: string;
}

interface Props {
  theme: Theme;
  // Если admin — показывает выбор филиала и колонки филиала/пользователя
  branches?: BranchOption[];
  generateUrl: string; // например /api/branch/reports или /api/admin/reports
  historyUrl: string; // тот же URL с GET
  itemUrlPrefix: string; // /api/branch/reports или /api/admin/reports — префикс для /:id
}

const REPORT_TYPES: { value: string; label: string; icon: string }[] = [
  {
    value: "sales",
    label: "Продажи",
    icon: "M3 13a4 4 0 014-4h10a4 4 0 014 4v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H8a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z",
  },
  {
    value: "orders",
    label: "Заказы",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    value: "order_items",
    label: "Детализация по блюдам",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6m-6 4h6",
  },
  {
    value: "popular_items",
    label: "Популярные блюда",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
  {
    value: "menu_items",
    label: "Блюда меню",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    value: "customers",
    label: "Клиенты",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    value: "full",
    label: "Полный отчет",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

const REPORT_TYPE_LABELS: Record<string, string> = {
  sales: "Продажи",
  orders: "Заказы",
  order_items: "Детализация по блюдам",
  popular_items: "Популярные блюда",
  menu_items: "Блюда меню",
  customers: "Клиенты",
  full: "Полный отчет",
};

// Темы оформления
const themes = {
  branch: {
    bg: "#0B0F14",
    card: "#141A22",
    cardHover: "#1A212B",
    border: "rgba(255,255,255,0.05)",
    accent: "#7C8CA5",
    accentHover: "#AAB7CC",
    accentBg: "#202937",
    text: "#F3F5F7",
    textMuted: "#98A2B3",
    textSecondary: "#7C8CA5",
    inputBg: "#1A212B",
    inputBorder: "#2A3442",
    danger: "#EF4444",
    success: "#10B981",
  },
  admin: {
    bg: "#050c26",
    card: "#181f38",
    cardHover: "#242b47",
    border: "#242b47",
    accent: "#4047ee",
    accentHover: "#5a61f0",
    accentBg: "#242b47",
    text: "#FFFFFF",
    textMuted: "#a8b1cf",
    textSecondary: "#78819d",
    inputBg: "#0f1530",
    inputBorder: "#242b47",
    danger: "#EF4444",
    success: "#10B981",
  },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
};

// Получить дату 7 дней назад в формате YYYY-MM-DD
const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};
const weekAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
};

export default function ReportsPage({
  theme,
  branches,
  generateUrl,
  historyUrl,
  itemUrlPrefix,
}: Props) {
  const t = themes[theme];
  const isAdmin = theme === "admin";

  const [reportType, setReportType] = useState<string>("sales");
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [periodStart, setPeriodStart] = useState<string>(weekAgoStr());
  const [periodEnd, setPeriodEnd] = useState<string>(todayStr());
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [redownloading, setRedownloading] = useState<string | null>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      let url = historyUrl;
      if (isAdmin && historyFilter !== "all") {
        url += `?branchId=${encodeURIComponent(historyFilter)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFilter]);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);

    // iOS Safari плохо поддерживает атрибут download и синхронный revoke:
    // файл не скачивается / открывается пустым. Для мобильных открываем
    // документ в новой вкладке, чтобы пользователь мог сохранить/отправить
    // его системными средствами (Share Sheet).
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    if (isMobile) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Откладываем освобождение URL, чтобы навигация/скачивание успели начаться.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const extractFileName = (response: Response, fallback: string) => {
    const cd = response.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="([^"]+)"/);
    return match?.[1] ?? fallback;
  };

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);

    try {
      const body: any = {
        type: reportType,
        format,
        periodStart,
        periodEnd,
      };
      if (isAdmin && selectedBranch !== "all") {
        body.branchId = selectedBranch;
      }

      const res = await fetch(generateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Ошибка генерации отчета");
      }

      const blob = await res.blob();
      const fileName = extractFileName(res, "report");
      downloadBlob(blob, fileName);
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setGenerating(false);
    }
  };

  const handleRedownload = async (id: string) => {
    setRedownloading(id);
    try {
      const res = await fetch(`${itemUrlPrefix}/${id}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Ошибка перескачивания");
      }
      const blob = await res.blob();
      const fileName = extractFileName(res, "report");
      downloadBlob(blob, fileName);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setRedownloading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить запись из истории?")) return;
    try {
      const res = await fetch(`${itemUrlPrefix}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((h) => h.filter((it) => it.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ backgroundColor: t.bg, minHeight: "100vh" }}>
      <div className="p-8 max-w-[1400px]">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: t.text }}>
            Отчеты
          </h1>
          <p className="mt-2 text-sm" style={{ color: t.textMuted }}>
            Сформируйте отчет за нужный период и скачайте его в PDF или Excel
          </p>
        </div>

        {/* Конструктор отчета */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          {/* Выбор типа отчета */}
          <div className="mb-6">
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: t.text }}
            >
              Тип отчета
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {REPORT_TYPES.map((rt) => {
                const active = reportType === rt.value;
                return (
                  <button
                    key={rt.value}
                    onClick={() => setReportType(rt.value)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                    style={{
                      backgroundColor: active ? t.accent : t.inputBg,
                      color: active ? "#fff" : t.textMuted,
                      border: `1px solid ${active ? t.accent : t.inputBorder}`,
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={rt.icon}
                      />
                    </svg>
                    <span className="text-sm">{rt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Период */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: t.text }}
              >
                Период с
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                max={periodEnd}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-colors"
                style={{
                  backgroundColor: t.inputBg,
                  color: t.text,
                  border: `1px solid ${t.inputBorder}`,
                  colorScheme: "dark",
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: t.text }}
              >
                Период по
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                min={periodStart}
                max={todayStr()}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-colors"
                style={{
                  backgroundColor: t.inputBg,
                  color: t.text,
                  border: `1px solid ${t.inputBorder}`,
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          {/* Быстрые периоды */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { label: "Сегодня", days: 0 },
              { label: "7 дней", days: 7 },
              { label: "30 дней", days: 30 },
              { label: "90 дней", days: 90 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - preset.days);
                  setPeriodStart(start.toISOString().slice(0, 10));
                  setPeriodEnd(end.toISOString().slice(0, 10));
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: t.inputBg,
                  color: t.textMuted,
                  border: `1px solid ${t.inputBorder}`,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Выбор филиала (только админ) */}
          {isAdmin && branches && (
            <div className="mb-6">
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: t.text }}
              >
                Филиал
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  color: t.text,
                  border: `1px solid ${t.inputBorder}`,
                }}
              >
                <option value="all">Все филиалы (сводный)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Формат */}
          <div className="mb-6">
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: t.text }}
            >
              Формат файла
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "pdf", label: "PDF", desc: "Документ для печати" },
                { value: "excel", label: "Excel", desc: "Таблица для анализа" },
              ].map((fmt) => {
                const active = format === fmt.value;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setFormat(fmt.value as "pdf" | "excel")}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-left"
                    style={{
                      backgroundColor: active ? t.accent : t.inputBg,
                      color: active ? "#fff" : t.text,
                      border: `1px solid ${active ? t.accent : t.inputBorder}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: active
                          ? "rgba(255,255,255,0.15)"
                          : t.accentBg,
                        color: active ? "#fff" : t.accent,
                      }}
                    >
                      {fmt.label}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{fmt.label}</div>
                      <div
                        className="text-xs"
                        style={{
                          color: active ? "rgba(255,255,255,0.7)" : t.textMuted,
                        }}
                      >
                        {fmt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: t.danger,
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              {error}
            </div>
          )}

          {/* Кнопка скачать */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-6 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            style={{
              backgroundColor: t.accent,
              color: "#fff",
            }}
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Генерация...
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Сформировать и скачать
              </>
            )}
          </button>
        </div>

        {/* История скачиваний */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: t.text }}>
                История скачиваний
              </h2>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>
                {history.length > 0
                  ? `Всего записей: ${history.length}`
                  : "История пуста"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && branches && (
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm font-medium outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    color: t.text,
                    border: `1px solid ${t.inputBorder}`,
                  }}
                >
                  <option value="all">Все записи</option>
                  <option value="all_branches">Только сводные</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={loadHistory}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: t.inputBg,
                  color: t.textMuted,
                  border: `1px solid ${t.inputBorder}`,
                }}
              >
                Обновить
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div className="text-center py-12" style={{ color: t.textMuted }}>
              Загрузка...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: t.textSecondary }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p style={{ color: t.textMuted }}>
                Пока нет ни одного сформированного отчета
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${t.border}`,
                    }}
                  >
                    <th
                      className="text-left text-xs font-bold uppercase tracking-wider py-3 px-3"
                      style={{ color: t.textMuted }}
                    >
                      Тип
                    </th>
                    <th
                      className="text-left text-xs font-bold uppercase tracking-wider py-3 px-3"
                      style={{ color: t.textMuted }}
                    >
                      Период
                    </th>
                    {isAdmin && (
                      <>
                        <th
                          className="text-left text-xs font-bold uppercase tracking-wider py-3 px-3"
                          style={{ color: t.textMuted }}
                        >
                          Филиал
                        </th>
                        <th
                          className="text-left text-xs font-bold uppercase tracking-wider py-3 px-3"
                          style={{ color: t.textMuted }}
                        >
                          Кто скачал
                        </th>
                      </>
                    )}
                    <th
                      className="text-left text-xs font-bold uppercase tracking-wider py-3 px-3"
                      style={{ color: t.textMuted }}
                    >
                      Формат
                    </th>
                    <th
                      className="text-left text-xs font-bold uppercase tracking-wider py-3 px-3"
                      style={{ color: t.textMuted }}
                    >
                      Размер
                    </th>
                    <th
                      className="text-left text-xs font-bold uppercase tracking-wider py-3 px-3"
                      style={{ color: t.textMuted }}
                    >
                      Скачано
                    </th>
                    <th
                      className="text-right text-xs font-bold uppercase tracking-wider py-3 px-3"
                      style={{ color: t.textMuted }}
                    >
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h.id}
                      className="transition-colors"
                      style={{
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      <td className="py-4 px-3">
                        <div
                          className="font-semibold text-sm"
                          style={{ color: t.text }}
                        >
                          {REPORT_TYPE_LABELS[h.reportType] ?? h.reportType}
                        </div>
                        <div
                          className="text-xs truncate max-w-[260px]"
                          style={{ color: t.textMuted }}
                          title={h.fileName}
                        >
                          {h.fileName}
                        </div>
                      </td>
                      <td
                        className="py-4 px-3 text-sm"
                        style={{ color: t.textMuted }}
                      >
                        {fmtDate(h.periodStart)} — {fmtDate(h.periodEnd)}
                      </td>
                      {isAdmin && (
                        <>
                          <td
                            className="py-4 px-3 text-sm"
                            style={{ color: t.textMuted }}
                          >
                            {h.scope === "all_branches" ? (
                              <span
                                className="px-2 py-1 rounded-md text-xs font-semibold"
                                style={{
                                  backgroundColor: t.accentBg,
                                  color: t.accent,
                                }}
                              >
                                Все филиалы
                              </span>
                            ) : (
                              h.branchName ?? "—"
                            )}
                          </td>
                          <td
                            className="py-4 px-3 text-sm"
                            style={{ color: t.textMuted }}
                          >
                            {h.userName ?? "—"}
                          </td>
                        </>
                      )}
                      <td className="py-4 px-3">
                        <span
                          className="px-2 py-1 rounded-md text-xs font-bold uppercase"
                          style={{
                            backgroundColor:
                              h.format === "pdf"
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(16, 185, 129, 0.15)",
                            color: h.format === "pdf" ? "#EF4444" : "#10B981",
                          }}
                        >
                          {h.format}
                        </span>
                      </td>
                      <td
                        className="py-4 px-3 text-sm"
                        style={{ color: t.textMuted }}
                      >
                        {fmtSize(h.fileSize)}
                      </td>
                      <td
                        className="py-4 px-3 text-sm"
                        style={{ color: t.textMuted }}
                      >
                        {fmtDateTime(h.createdAt)}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleRedownload(h.id)}
                            disabled={redownloading === h.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60"
                            style={{
                              backgroundColor: t.accent,
                              color: "#fff",
                            }}
                            title="Перескачать"
                          >
                            {redownloading === h.id ? (
                              <svg
                                className="animate-spin w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                              </svg>
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            )}
                            Скачать
                          </button>
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              color: t.danger,
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                            }}
                            title="Удалить из истории"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"
                              />
                            </svg>
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
      </div>
    </div>
  );
}
