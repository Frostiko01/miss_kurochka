'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface DeliveryMapProps {
  address: string
  onLocationSelect?: (lat: number, lng: number, address: string) => void
  height?: string
}

export default function DeliveryMap({ address, onLocationSelect, height = '300px' }: DeliveryMapProps) {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    if (address && address.length > 3) {
      geocodeAddress(address)
    }
  }, [address])

  const geocodeAddress = async (searchAddress: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + ', Бишкек, Кыргызстан')}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setCoordinates({ lat, lng })
        
        if (onLocationSelect) {
          onLocationSelect(lat, lng, data[0].display_name)
        }
      }
    } catch (error) {
      console.error('Ошибка геокодирования:', error)
    } finally {
      setLoading(false)
    }
  }

  const openInMaps = () => {
    if (coordinates) {
      const url = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}&zoom=16`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-2 right-2 z-10 bg-white rounded-lg p-2 shadow-lg">
          <div className="w-4 h-4 border-2 border-[#d62300] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <div 
        className={`rounded-xl overflow-hidden shadow-lg border-2 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-200'}`}
        style={{ height }}
      >
        {coordinates ? (
          <div className="text-center p-6">
            <div className="text-6xl mb-4">📍</div>
            <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Адрес найден!
            </h3>
            <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {address}
            </p>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Координаты: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
            <button
              onClick={openInMaps}
              className="px-4 py-2 bg-[#d62300] text-white rounded-lg hover:bg-[#b01e00] transition-colors font-semibold"
            >
              Открыть на карте
            </button>
          </div>
        ) : (
          <div className="text-center p-6">
            <div className="text-6xl mb-4">🗺️</div>
            <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {loading ? 'Поиск адреса...' : 'Введите адрес для поиска'}
            </p>
          </div>
        )}
      </div>
      
      <div className={`mt-2 p-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        📍 {address || 'Укажите адрес для отображения местоположения'}
        {coordinates && (
          <span className="ml-2 text-green-600 font-semibold">
            ✓ Адрес найден
          </span>
        )}
      </div>
    </div>
  )
}