'use client'

import { useState } from 'react'

export default function DemoGeocodingPage() {
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  // Функция обратного геокодирования
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.display_name) {
        return data.display_name
      }
      
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.warn('Ошибка геокодирования:', error)
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  const testGeocode = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const address = await reverseGeocode(lat, lng)
      setLocation({ lat, lng, address })
    } catch (error) {
      console.error('Ошибка:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await testGeocode(latitude, longitude)
      },
      (error) => {
        console.error('Ошибка геолокации:', error)
        setLoading(false)
        alert('Не удалось определить ваше местоположение')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Тест геокодирования</h1>
        
        <div className="bg-[#2a3441] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Тестовые координаты</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => testGeocode(42.8746, 74.5698)}
              disabled={loading}
              className="bg-[#d62300] hover:bg-[#b01e00] text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Бишкек (42.8746, 74.5698)
            </button>
            <button
              onClick={() => testGeocode(55.7558, 37.6176)}
              disabled={loading}
              className="bg-[#d62300] hover:bg-[#b01e00] text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Москва (55.7558, 37.6176)
            </button>
            <button
              onClick={() => testGeocode(43.2220, 76.8512)}
              disabled={loading}
              className="bg-[#d62300] hover:bg-[#b01e00] text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Алматы (43.2220, 76.8512)
            </button>
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Моё местоположение
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-[#2a3441] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#d62300] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-300">Получение адреса...</span>
            </div>
          </div>
        )}

        {location && !loading && (
          <div className="bg-[#2a3441] rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Результат геокодирования:</h3>
            <div className="space-y-3">
              <div className="bg-[#3a4553] rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Координаты:</p>
                <p className="text-white font-mono">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
              </div>
              <div className="bg-[#3a4553] rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Адрес:</p>
                <p className="text-white">{location.address}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Нажмите на любую кнопку, чтобы протестировать обратное геокодирование
          </p>
        </div>
      </div>
    </div>
  )
}