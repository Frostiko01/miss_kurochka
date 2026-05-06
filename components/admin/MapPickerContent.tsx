"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Исправляем иконки маркеров Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface MapPickerContentProps {
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
  initialAddress?: string;
}

// Компонент для обработки кликов на карте
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPickerContent({
  onLocationSelect,
  initialCoordinates = { lat: 42.8746, lng: 74.5698 }, // Бишкек по умолчанию
  initialAddress = "",
}: MapPickerContentProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    initialCoordinates.lat,
    initialCoordinates.lng,
  ]);
  const [showResults, setShowResults] = useState(false);
  const [showSatellite, setShowSatellite] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Поиск адреса через Nominatim API
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=kg&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching address:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Обратный геокодинг (получение адреса по координатам)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setSearchQuery(data.display_name);
        onLocationSelect(data.display_name, { lat, lng });
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  // Обработка изменения поискового запроса
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Debounce поиска
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  // Выбор результата поиска
  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedPosition([lat, lng]);
    setSearchQuery(result.display_name);
    setShowResults(false);
    onLocationSelect(result.display_name, { lat, lng });

    // Центрируем карту на выбранной точке
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
  };

  // Обработка клика на карте
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  return (
    <div className="space-y-4">
      {/* Поиск адреса */}
      <div className="relative">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Поиск адреса на карте..."
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
            </div>
          )}
        </div>

        {/* Результаты поиска */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-sm text-white">{result.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <svg
          className="w-4 h-4 text-orange-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Кликните на карту или используйте поиск для выбора адреса</span>
      </div>

      {/* Карта */}
      <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative z-10">
        <MapContainer
          center={selectedPosition}
          zoom={13}
          style={{ height: "400px", width: "100%", position: "relative", zIndex: 10 }}
          ref={mapRef}
          scrollWheelZoom={false}
        >
          {/* Спутниковый вид */}
          {showSatellite && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          )}
          
          {/* Обычный вид (резервный) */}
          {!showSatellite && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://openfreemap.org">OpenFreeMap</a>'
              url="https://tiles.openfreemap.org/osm/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}
          
          {/* Маркер */}
          <Marker position={selectedPosition} />
          
          {/* Обработчик кликов */}
          <MapClickHandler onLocationSelect={handleMapClick} />
        </MapContainer>
        
        {/* Кнопка переключения вида */}
        <button
          onClick={() => setShowSatellite(!showSatellite)}
          className="absolute top-4 right-4 z-40 px-3 py-2 bg-white/90 hover:bg-white text-slate-900 rounded-lg font-bold text-sm transition-all shadow-lg flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          {showSatellite ? "Карта" : "Спутник"}
        </button>
      </div>

      {/* Выбранные координаты */}
      <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-5 h-5 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-bold text-slate-200">Выбранная точка:</span>
        </div>
        <p className="text-sm text-slate-300 font-mono">
          Широта: {selectedPosition[0].toFixed(6)}, Долгота: {selectedPosition[1].toFixed(6)}
        </p>
      </div>
    </div>
  );
}
