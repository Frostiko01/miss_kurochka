"use client";

import { useSession } from "next-auth/react";

export default function BranchHeader() {
  const { data: session } = useSession();

  return (
    <header 
      className="sticky top-0 flex items-center justify-between w-full"
      style={{ 
        background: '#141A22',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 50,
        paddingLeft: '2rem',
        paddingRight: '2rem',
        paddingTop: '1.25rem',
        paddingBottom: '1.25rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(124, 140, 165, 0.3)'
          }}
        >
          <span className="text-2xl">🍗</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#F3F5F7' }}>
            Miss Kurochka
          </h1>
          <p className="text-xs font-semibold" style={{ color: '#7C8CA5' }}>
            Панель филиала
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-bold text-sm" style={{ color: '#F3F5F7' }}>
            {session?.user?.fullName || "Филиал"}
          </p>
          <p className="text-xs font-medium" style={{ color: '#98A2B3' }}>
            {session?.user?.email}
          </p>
        </div>
        <div 
          className="w-11 h-11 flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(124, 140, 165, 0.3)'
          }}
        >
          <span className="text-lg font-bold text-white">
            {session?.user?.fullName?.charAt(0) || "F"}
          </span>
        </div>
      </div>
    </header>
  );
}
