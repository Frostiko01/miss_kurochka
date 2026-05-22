"use client";

import { useSession } from "next-auth/react";
import DashboardView from "@/components/dashboard/DashboardView";

export default function BranchDashboardPage() {
  const { data: session } = useSession();

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
