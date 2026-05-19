"use client";

export interface SizeOption {
  name: string;
  price: number; // итоговая цена (не доплата)
}

interface InlineSizesEditorProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  sizes: SizeOption[];
  onSizesChange: (sizes: SizeOption[]) => void;
}

const PRESETS: { label: string; emoji: string; sizes: SizeOption[] }[] = [
  {
    emoji: "🍗",
    label: "Крылышки",
    sizes: [
      { name: "250 г", price: 380 },
      { name: "500 г", price: 700 },
      { name: "1 кг", price: 1300 },
    ],
  },
  {
    emoji: "🍳",
    label: "Курица",
    sizes: [
      { name: "250 г", price: 350 },
      { name: "500 г", price: 700 },
      { name: "1 кг", price: 1300 },
    ],
  },
  {
    emoji: "🥤",
    label: "Напиток",
    sizes: [
      { name: "0.3 л", price: 100 },
      { name: "0.5 л", price: 150 },
      { name: "1 л", price: 250 },
    ],
  },
];

const s = {
  bg: "#050c26",
  border: "#242b47",
  accent: "#4047ee",
  muted: "#78819d",
  white: "white",
  red: "#ef4444",
};

export default function InlineSizesEditor({
  enabled,
  onEnabledChange,
  sizes,
  onSizesChange,
}: InlineSizesEditorProps) {
  const update = (idx: number, field: keyof SizeOption, value: string | number) => {
    const next = [...sizes];
    next[idx] = { ...next[idx], [field]: field === "price" ? Number(value) || 0 : value };
    onSizesChange(next);
  };

  const add = () => onSizesChange([...sizes, { name: "", price: 0 }]);
  const remove = (idx: number) => sizes.length > 1 && onSizesChange(sizes.filter((_, i) => i !== idx));

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: enabled ? s.accent : s.border, backgroundColor: s.bg }}
    >
      {/* Заголовок-переключатель */}
      <label
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ backgroundColor: enabled ? "rgba(64,71,238,0.08)" : "transparent" }}
      >
        <div
          className="relative w-10 h-6 rounded-full transition-colors shrink-0"
          style={{ backgroundColor: enabled ? s.accent : s.border }}
        >
          <div
            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
            style={{ left: enabled ? "22px" : "4px" }}
          />
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="sr-only"
          />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: s.white }}>
            Несколько размеров
          </p>
          <p className="text-xs" style={{ color: s.muted }}>
            Например: 250г / 500г / 1кг с разными ценами
          </p>
        </div>
      </label>

      {enabled && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${s.border}` }}>
          {/* Пресеты */}
          <div className="pt-3">
            <p className="text-[11px] font-bold uppercase mb-2" style={{ color: s.muted }}>
              Быстрый шаблон
            </p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSizesChange([...p.sizes])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                  style={{ backgroundColor: "#181f38", color: "#c8cde0" }}
                >
                  <span>{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Таблица размеров */}
          <div>
            {/* Шапка */}
            <div className="grid grid-cols-[1fr_120px_32px] gap-2 mb-1.5 px-1">
              <p className="text-[11px] font-bold uppercase" style={{ color: s.muted }}>Название</p>
              <p className="text-[11px] font-bold uppercase" style={{ color: s.muted }}>Цена (сом)</p>
              <div />
            </div>

            <div className="space-y-2">
              {sizes.map((size, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                  <input
                    type="text"
                    value={size.name}
                    onChange={(e) => update(idx, "name", e.target.value)}
                    placeholder="250 г"
                    className="px-3 py-2 rounded-lg text-sm focus:outline-none border w-full"
                    style={{ backgroundColor: "#0a1230", borderColor: s.border, color: s.white }}
                  />
                  <input
                    type="number"
                    value={size.price || ""}
                    onChange={(e) => update(idx, "price", e.target.value)}
                    placeholder="0"
                    className="px-3 py-2 rounded-lg text-sm focus:outline-none border w-full"
                    style={{ backgroundColor: "#0a1230", borderColor: s.border, color: s.white }}
                  />
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    disabled={sizes.length <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition-all disabled:opacity-20"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: s.red }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={add}
              className="mt-2 w-full py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: "#181f38", color: s.accent, border: `1px dashed ${s.accent}` }}
            >
              + Добавить размер
            </button>
          </div>

          {/* Превью */}
          {sizes.some(s => s.name && s.price > 0) && (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: "rgba(64,71,238,0.06)", border: `1px solid rgba(64,71,238,0.2)` }}
            >
              <p className="text-[11px] font-bold uppercase mb-1.5" style={{ color: s.accent }}>
                Превью карточки
              </p>
              <div className="space-y-1">
                {sizes.filter(s => s.name).map((sz, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: "#c8cde0" }}>{sz.name}</span>
                    <span className="font-bold" style={{ color: s.white }}>{sz.price} сом</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
