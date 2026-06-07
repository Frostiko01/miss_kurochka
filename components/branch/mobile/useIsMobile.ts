"use client";

import { useEffect, useState } from "react";

/**
 * Хук определения мобильного экрана через matchMedia.
 * По умолчанию брейкпоинт 768px (совпадает с Tailwind `md`).
 * Возвращает false на сервере/до монтирования, чтобы избежать рассинхрона гидрации.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

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
