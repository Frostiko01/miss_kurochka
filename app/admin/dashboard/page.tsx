"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardView from "@/components/dashboard/DashboardView";

interface BranchOption {
  id: string;
  name: string;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [branches, setBranches] = useState<BranchOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/branches?status=active")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.branches ?? [];
        setBranches(list.map((b: any) => ({ id: b.id, name: b.name })));
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardView
      theme="admin"
      statsUrl="/api/admin/stats"
      ordersHref="/admin/orders"
      reportsHref="/admin/reports"
      menuHref="/admin/menu"
      branches={branches}
      greetingName={session?.user?.fullName ?? null}
    />
  );
}
