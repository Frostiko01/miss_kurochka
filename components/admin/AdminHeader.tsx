"use client";

import { useSession } from "next-auth/react";

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header 
      className="sticky top-0 flex items-center justify-between border-b w-full"
      style={{ 
        backgroundColor: '#181f38',
        borderColor: '#242b47',
        zIndex: 50,
        paddingLeft: '2rem',
        paddingRight: '2rem',
        paddingTop: '1rem',
        paddingBottom: '1rem'
      }}
    >
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
          <span className="text-2xl">🍗</span>
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: 'white' }}>
            Miss Kurochka
          </h1>
          <p className="text-xs font-semibold" style={{ color: '#78819d' }}>
            Admin Panel
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-bold text-sm text-white">
            {session?.user?.fullName || "Admin"}
          </p>
          <p className="text-xs" style={{ color: '#78819d' }}>
            {session?.user?.email}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#555e7d' }}>
          <span className="text-lg font-black text-white">
            {session?.user?.fullName?.charAt(0) || "A"}
          </span>
        </div>
      </div>
    </header>
  );
}
