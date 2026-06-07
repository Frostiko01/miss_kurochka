/**
 * Дизайн-токены панели филиала (тёмная премиум-тема Miss Kurochka).
 * Полностью совпадают с десктопной версией Branch Dashboard.
 */
export const branchTheme = {
  bg: "#0B0F14",
  card: "#1A212B",
  cardAlt: "#202937",
  header: "#141A22",
  border: "rgba(255,255,255,0.05)",
  borderStrong: "rgba(255,255,255,0.08)",
  text: "#F3F5F7",
  textMuted: "#98A2B3",
  accent: "#7C8CA5",
  accentLight: "#93A4BF",
  accentBg: "rgba(124, 140, 165, 0.15)",
  danger: "#EF4444",
} as const;

/** Лёгкий тактильный отклик (если поддерживается устройством). */
export function haptic(pattern: number | number[] = 10) {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* no-op */
  }
}

export const fmtMoney = (n: number) =>
  `${Math.round(n).toLocaleString("ru-RU")} с`;
