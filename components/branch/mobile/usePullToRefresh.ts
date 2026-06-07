"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "./branchTheme";

/**
 * Pull-to-refresh для мобильных экранов.
 *
 * Производительность: слушатели навешиваются ОДИН раз, во время жеста React
 * НЕ ре-рендерится — анимация идёт через прямую запись в DOM (transform/height)
 * внутри requestAnimationFrame. Состояние `refreshing` меняется только дважды
 * за обновление (старт/финиш), что исключает лаги при касании.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshingRef = useRef(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const triggered = useRef(false);
  const rafRef = useRef<number | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const mountedRef = useRef(true);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const THRESHOLD = 70;
    const MAX = 110;

    const apply = (y: number) => {
      const c = containerRef.current;
      const ind = indicatorRef.current;
      if (c) c.style.transform = y > 0 ? `translateY(${y}px)` : "";
      if (ind) {
        ind.style.height = `${y}px`;
        ind.style.opacity = y > 8 ? "1" : "0";
        const icon = ind.firstElementChild as HTMLElement | null;
        if (icon && !refreshingRef.current) {
          icon.style.transform = `rotate(${y * 3}deg)`;
        }
      }
    };

    const clearTransition = () => {
      if (containerRef.current) containerRef.current.style.transition = "";
      if (indicatorRef.current) indicatorRef.current.style.transition = "";
    };

    const animateTo = (y: number) => {
      const c = containerRef.current;
      const ind = indicatorRef.current;
      if (c) {
        c.style.transition = "transform 0.25s ease";
        c.style.transform = y > 0 ? `translateY(${y}px)` : "";
      }
      if (ind) {
        ind.style.transition = "height 0.25s ease, opacity 0.2s ease";
        ind.style.height = `${y}px`;
        ind.style.opacity = y > 8 ? "1" : "0";
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !refreshingRef.current) {
        startY.current = e.touches[0].clientY;
        triggered.current = false;
        clearTransition();
      } else {
        startY.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        const damped = Math.min(dy * 0.5, MAX);
        pullRef.current = damped;
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            apply(pullRef.current);
          });
        }
        if (damped >= THRESHOLD && !triggered.current) {
          triggered.current = true;
          haptic(10);
        }
      }
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        if (mountedRef.current) setRefreshing(true);
        animateTo(THRESHOLD);
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          if (mountedRef.current) setRefreshing(false);
          pullRef.current = 0;
          animateTo(0);
        }
      } else {
        pullRef.current = 0;
        animateTo(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { containerRef, indicatorRef, refreshing };
}
