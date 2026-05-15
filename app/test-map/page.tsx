'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Динамический импорт карт для избежания SSR проблем
const DeliveryMap = dynamic(() => import('@/components/map/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-700 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#d62300] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-400 text-sm">Загрузка карты...</p>
      </div>
    </div>
  )
})

const SimpleMap = dynamic(() => import('@/components/map/SimpleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-700 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#d62300] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-400 text-sm">Загрузка простой карты...</p>
      </div>
    </div>
  )
})

export default function TestMapPage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(location)
    console.log('Выбрано местоположение:', location)
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Тест интерактивной карты</h1>
        
        <div className="bg-[#2a3441] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Простая карта (OpenStreetMap)</h2>
          <p className="text-gray-400 text-sm mb-4">
            Базовая карта с OpenStreetMap для тестирования основной функциональности.
          </p>
          <SimpleMap
            onLocationSelect={handleLocationSelect}
            className="w-full"
          />
        </div>

        <div className="bg-[#2a3441] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Продвинутая карта (с fallback)</h2>
          <p className="text-gray-400 text-sm mb-4">
            Карта автоматически переключается между провайдерами тайлов при недоступности основного.
          </p>
          <DeliveryMap
            onLocationSelect={handleLocationSelect}
            className="w-full"
          />
        </div>

        {selectedLocation && (
          <div className="bg-[#2a3441] rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Выбранное местоположение:</h3>
            <div className="space-y-2 text-gray-300">
              <p><strong>Широта:</strong> {selectedLocation.lat.toFixed(6)}</p>
              <p><strong>Долгота:</strong> {selectedLocation.lng.toFixed(6)}</p>
              <p><strong>Адрес:</strong> {selectedLocation.address}</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Нажмите на карту или перетащите маркер для выбора местоположения
          </p>
        </div>
      </div>
    </div>
  )
}