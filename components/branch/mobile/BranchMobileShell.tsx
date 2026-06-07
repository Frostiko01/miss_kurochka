"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import BranchMobileHeader from "./BranchMobileHeader";
import BranchBottomNav from "./BranchBottomNav";
import BranchMoreSheet from "./BranchMoreSheet";

/** Заголовки разделов для мобильного хедера. */
const TITLES: Record<string, string> = {
  "/branch/dashboard": "Панель управления",
  "/branch/orders": "Заказы",
  "/branch/menu": "Меню",
  "/branch/combo-offers": "Комбо-наборы",
  "/branch/mini-combos": "Мини-комбо",
  "/branch/stop-list": "Стоп-лист",
  "/branch/reports": "Отчёты",
  "/branch/additional-offers": "Доп. предложения",
  "/branch/settings": "Настройки",
};

export default function BranchMobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const [moreOpen, setMoreOpen] = useState(false);

  const title = Object.keys(TITLES).find(
    (k) => pathname === k || pathname.startsWith(`${k}/`),
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0B0F14" }}>
      <BranchMobileHeader title={title ? TITLES[title] : undefined} />

      <main
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 84px)",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        {children}
      </main>

      <BranchBottomNav onMoreClick={() => setMoreOpen(true)} moreActive={moreOpen} />
      <BranchMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
