"use client";

import { useEffect, useState } from "react";
import ReportsPage, { type BranchOption } from "@/components/reports/ReportsPage";

export default function AdminReportsPage() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/branches?status=active");
        if (res.ok) {
          const data = await res.json();
          // API возвращает массив или объект с branches — поддерживаем оба варианта
          const list = Array.isArray(data) ? data : data.branches ?? [];
          setBranches(
            list.map((b: any) => ({ id: b.id, name: b.name })),
          );
        }
      } catch (e) {
        console.error("Failed to load branches", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#050c26" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="mt-4 font-semibold" style={{ color: "#a8b1cf" }}>
            Загрузка...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReportsPage
      theme="admin"
      branches={branches}
      generateUrl="/api/admin/reports"
      historyUrl="/api/admin/reports"
      itemUrlPrefix="/api/admin/reports"
    />
  );
}
