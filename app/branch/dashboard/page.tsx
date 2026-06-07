"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import DashboardView from "@/components/dashboard/DashboardView";
import { useIsMobile } from "@/components/branch/mobile/useIsMobile";

// Ленивая загрузка мобильного дашборда (грузится только на телефонах)
const BranchMobileDashboard = dynamic(
  () => import("@/components/branch/mobile/BranchMobileDashboard"),
  { ssr: false },
);

export default function BranchDashboardPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BranchMobileDashboard
        greetingName={session?.user?.fullName ?? null}
        ordersHref="/branch/orders"
        reportsHref="/branch/reports"
        menuHref="/branch/menu"
      />
    );
  }

  return (
    <DashboardView
      theme="branch"
      statsUrl="/api/branch/stats"
      ordersHref="/branch/orders"
      reportsHref="/branch/reports"
      menuHref="/branch/menu"
      greetingName={session?.user?.fullName ?? null}
    />
  );
}
