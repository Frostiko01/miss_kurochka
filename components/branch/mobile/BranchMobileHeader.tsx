"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { branchTheme as c } from "./branchTheme";

interface Props {
  /** Заголовок страницы (название филиала или раздела). */
  title?: string;
}

export default function BranchMobileHeader({ title }: Props) {
  const { data: session } = useSession();
  const branchName = session?.user?.fullName || "Филиал";

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 md:hidden"
      style={{
        background: "rgba(20, 26, 34, 0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `1px solid ${c.border}`,
        paddingTop: "calc(env(safe-area-inset-top, 0) + 10px)",
        paddingBottom: 10,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Логотип */}
      <div
        className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(124, 140, 165, 0.3)",
        }}
      >
        <Image src="/logo.png" alt="Miss Kurochka" width={40} height={40} className="w-full h-full object-cover" />
      </div>

      {/* Название по центру */}
      <div className="flex-1 min-w-0 text-center px-1">
        <p className="text-sm font-bold truncate" style={{ color: c.text }}>
          {title || branchName}
        </p>
        <p className="text-[10px] font-semibold truncate" style={{ color: c.accent }}>
          Панель филиала
        </p>
      </div>

      {/* Уведомления + аватар */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell
          apiUrl="/api/branch/notifications"
          ordersUrl="/branch/orders"
          theme="branch"
        />
        <div
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)",
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(124, 140, 165, 0.3)",
          }}
        >
          <span className="text-sm font-bold text-white">
            {branchName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
