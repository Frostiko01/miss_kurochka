"use client";

import ReportsPage from "@/components/reports/ReportsPage";

export default function BranchReportsPage() {
  return (
    <ReportsPage
      theme="branch"
      generateUrl="/api/branch/reports"
      historyUrl="/api/branch/reports"
      itemUrlPrefix="/api/branch/reports"
    />
  );
}
