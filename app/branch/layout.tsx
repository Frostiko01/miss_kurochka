"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BranchHeader from "@/components/branch/BranchHeader";
import BranchSidebar from "@/components/branch/BranchSidebar";

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Защита всех маршрутов филиала
  useEffect(() => {
    if (status === "loading") return;

    // Разрешаем доступ к странице входа
    if (pathname === "/branch/signin") return;

    if (status === "unauthenticated") {
      router.replace("/branch/signin");
    } else if (status === "authenticated" && session?.user?.role !== "branch") {
      router.replace("/");
    }
  }, [status, session, router, pathname]);

  // Если на странице входа - не показываем layout
  if (pathname === "/branch/signin") {
    return <>{children}</>;
  }

  // Показываем загрузку
  if (status === "loading") {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ 
          backgroundColor: '#0B0F14'
        }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-4 mx-auto" 
            style={{ 
              borderColor: '#202937',
              borderTopColor: '#7C8CA5'
            }}
          ></div>
          <p className="mt-4 font-semibold" style={{ color: '#98A2B3' }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован или не филиал - не показываем контент
  if (status !== "authenticated" || session?.user?.role !== "branch") {
    return null;
  }

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: '#0B0F14'
      }}
    >
      {/* Header */}
      <BranchHeader />

      {/* Sidebar */}
      <BranchSidebar onCollapsedChange={setIsSidebarCollapsed} />

      {/* Main Content */}
      <main
        className="transition-all duration-300"
        style={{
          marginLeft: isSidebarCollapsed ? "120px" : "320px",
          marginTop: '16px',
          marginRight: '16px',
          marginBottom: '16px',
          minHeight: "calc(100vh - 121px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
