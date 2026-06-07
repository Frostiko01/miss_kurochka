"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "./branchTheme";

/**
 * Pull-to-refresh для мобильных экранов.
 * Срабатывает только когда страница прокручена в самый верх.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const THRESHOLD = 70;
    const MAX = 110;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !refreshing) {
        startY.current = e.touches[0].clientY;
        triggered.current = false;
      } else {
        startY.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        const damped = Math.min(dy * 0.5, MAX);
        setPull(damped);
        if (damped >= THRESHOLD && !triggered.current) {
          triggered.current = true;
          haptic(10);
        }
      }
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      if (pull >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
      startY.current = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pull, refreshing]);

  return { pull, refreshing };
}
