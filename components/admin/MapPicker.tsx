"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Динамический импорт для избежания SSR проблем
const MapPickerContent = dynamic(() => import("./MapPickerContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-700/50 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
        <p className="text-slate-300 font-semibold">Загрузка карты...</p>
      </div>
    </div>
  ),
});

interface MapPickerProps {
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
  initialAddress?: string;
}

export default function MapPicker({
  onLocationSelect,
  initialCoordinates,
  initialAddress,
}: MapPickerProps) {
  return (
    <MapPickerContent
      onLocationSelect={onLocationSelect}
      initialCoordinates={initialCoordinates}
      initialAddress={initialAddress}
    />
  );
}
