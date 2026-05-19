"use client";

import { useState, useEffect } from "react";

interface ModifierOption {
  id?: string;
  name: string;
  priceDelta: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  selectionType: string;
  isRequired: boolean;
  options: ModifierOption[];
}

interface ModifierGroupEditorProps {
  menuItemId: string;
  apiBase?: string; // например "/api/admin/menu-items/modifiers" или "/api/branch/menu-items/modifiers"
  onSaved?: () => void;
}

export default function ModifierGroupEditor({
  menuItemId,
  apiBase = "/api/admin/menu-items/modifiers",
  onSaved,
}: ModifierGroupEditorProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Форма новой группы
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("Размер");
  const [selectionType, setSelectionType] = useState<"single" | "multiple">("single");
  const [isRequired, setIsRequired] = useState(true);
  const [options, setOptions] = useState<ModifierOption[]>([
    { name: "", priceDelta: 0 },
  ]);

  useEffect(() => {
    if (menuItemId) fetchGroups();
  }, [menuItemId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}?menuItemId=${menuItemId}`);
      const data = await res.json();
      if (res.ok) {
        setGroups(
          data.modifiers.map((m: any) => ({
            id: m.modifierGroup.id,
            name: m.modifierGroup.name,
            selectionType: m.modifierGroup.selectionType,
            isRequired: m.modifierGroup.isRequired,
            options: m.modifierGroup.options,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { name: "", priceDelta: 0 }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, field: keyof ModifierOption, value: string | number) => {
    const next = [...options];
    next[idx] = { ...next[idx], [field]: value };
    setOptions(next);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const validOptions = options.filter((o) => o.name.trim());
    if (!groupName.trim()) {
      setError("Укажите название группы");
      return;
    }
    if (validOptions.length < 1) {
      setError("Добавьте хотя бы одну опцию");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId,
          groupName: groupName.trim(),
          selectionType,
          isRequired,
          options: validOptions.map((o) => ({
            name: o.name.trim(),
            priceDelta: Number(o.priceDelta) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Группа добавлена");
        setShowForm(false);
        setGroupName("Размер");
        setOptions([{ name: "", priceDelta: 0 }]);
        fetchGroups();
        onSaved?.();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Ошибка сохранения");
      }
    } catch (e) {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Удалить эту группу модификаторов?")) return;
    try {
      const res = await fetch(
        `${apiBase}?modifierGroupId=${groupId}&menuItemId=${menuItemId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchGroups();
        onSaved?.();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const inputStyle = {
    backgroundColor: "#050c26",
    borderColor: "#242b47",
    color: "white",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase" style={{ color: "#78819d" }}>
          Размеры / Модификаторы
        </h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
          style={{ backgroundColor: showForm ? "#242b47" : "#4047ee" }}
        >
          {showForm ? "Отмена" : "+ Добавить группу"}
        </button>
      </div>

      {/* Уведомления */}
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
          {success}
        </div>
      )}

      {/* Существующие группы */}
      {loading ? (
        <div className="text-sm" style={{ color: "#78819d" }}>Загрузка...</div>
      ) : groups.length > 0 ? (
        <div className="space-y-3 mb-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl p-4 border"
              style={{ backgroundColor: "#050c26", borderColor: "#242b47" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-bold text-white">{group.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#78819d" }}>
                    {group.selectionType === "single" ? "Один выбор" : "Несколько"} •{" "}
                    {group.isRequired ? "Обязательно" : "Необязательно"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(group.id)}
                  className="text-xs px-2 py-1 rounded-lg font-bold transition-all"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                >
                  Удалить
                </button>
              </div>
              <div className="space-y-1">
                {group.options.map((opt, i) => (
                  <div key={opt.id ?? i} className="flex items-center justify-between text-xs">
                    <span style={{ color: "#c8cde0" }}>{opt.name}</span>
                    <span style={{ color: Number(opt.priceDelta) > 0 ? "#4047ee" : "#78819d" }}>
                      {Number(opt.priceDelta) > 0 ? `+${opt.priceDelta}` : opt.priceDelta} сом
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-xs mb-3" style={{ color: "#78819d" }}>
            Нет групп. Добавьте группу «Размер» чтобы показывать варианты (250г / 500г / 1кг).
          </p>
        )
      )}

      {/* Форма добавления */}
      {showForm && (
        <div className="rounded-xl p-4 border space-y-4" style={{ backgroundColor: "#050c26", borderColor: "#4047ee" }}>
          {/* Название группы */}
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "#78819d" }}>
              Название группы
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Например: Размер, Острота, Соус"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none border"
              style={inputStyle}
            />
          </div>

          {/* Тип выбора и обязательность */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "#78819d" }}>
                Тип выбора
              </label>
              <select
                value={selectionType}
                onChange={(e) => setSelectionType(e.target.value as "single" | "multiple")}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none border"
                style={inputStyle}
              >
                <option value="single" style={{ backgroundColor: "#181f38" }}>Один вариант</option>
                <option value="multiple" style={{ backgroundColor: "#181f38" }}>Несколько</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "#4047ee" }}
                />
                <span className="text-sm font-bold text-white">Обязательно</span>
              </label>
            </div>
          </div>

          {/* Опции */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase" style={{ color: "#78819d" }}>
                Варианты
              </label>
              <button
                type="button"
                onClick={addOption}
                className="text-xs px-2 py-1 rounded-lg font-bold text-white"
                style={{ backgroundColor: "#4047ee" }}
              >
                + Добавить
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) => updateOption(idx, "name", e.target.value)}
                    placeholder={`Вариант ${idx + 1} (напр. 250 г)`}
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none border"
                    style={inputStyle}
                  />
                  <div className="relative w-28">
                    <input
                      type="number"
                      value={opt.priceDelta}
                      onChange={(e) => updateOption(idx, "priceDelta", e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 pr-10 rounded-lg text-sm focus:outline-none border"
                      style={inputStyle}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#78819d" }}>
                      сом
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    disabled={options.length <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "#78819d" }}>
              Цена = базовая цена блюда + доплата. Для первого варианта доплата обычно 0.
            </p>
          </div>

          {/* Кнопка сохранения */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: "#4047ee" }}
          >
            {saving ? "Сохранение..." : "Сохранить группу"}
          </button>
        </div>
      )}
    </div>
  );
}
