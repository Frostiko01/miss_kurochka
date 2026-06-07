"use client";

import { useEffect, useState } from "react";

/**
 * Хук определения мобильного экрана через matchMedia.
 * По умолчанию брейкпоинт 768px (совпадает с Tailwind `md`).
 *
 * Начальное значение читается синхронно из window при первом клиентском
 * рендере — это исключает «моргание» и лишний монтаж тяжёлого десктопного
 * дашборда на телефоне (страницы филиала рендерятся только на клиенте за
 * проверкой сессии, поэтому рассинхрона гидрации не возникает).
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
