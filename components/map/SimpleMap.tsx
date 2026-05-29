'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Исправляем иконки маркеров для Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface SimpleMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  initialLocation?: { lat: number; lng: number }
  className?: string
}

// Форматирует адрес из Nominatim addressdetails — без страны, индекса и координат
function formatAddress(addr: Record<string, string>): string {
  const parts: string[] = []
  // Улица + номер дома
  if (addr.road) {
    parts.push(addr.house_number ? `${addr.road}, ${addr.house_number}` : addr.road)
  } else if (addr.pedestrian) {
    parts.push(addr.house_number ? `${addr.pedestrian}, ${addr.house_number}` : addr.pedestrian)
  } else if (addr.neighbourhood) {
    parts.push(addr.neighbourhood)
  }
  // Район
  if (addr.suburb) parts.push(addr.suburb)
  // Город
  if (addr.city) parts.push(addr.city)
  else if (addr.town) parts.push(addr.town)
  else if (addr.village) parts.push(addr.village)

  return parts.length > 0 ? parts.join(', ') : (addr.display_name ?? '')
}

export default function SimpleMap({ 
  onLocationSelect, 
  initialLocation = { lat: 42.8746, lng: 74.5698 }, // Бишкек
  className = '' 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

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
      
      if (data.address) {
        return formatAddress(data.address)
      }
      
      return data.display_name?.split(',').slice(0, 3).join(',').trim() ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.warn('Ошибка геокодирования:', error)
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  // Функция определения текущего местоположения
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером')
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15)
          markerRef.current.setLatLng([latitude, longitude])
          
          try {
            const address = await reverseGeocode(latitude, longitude)
            onLocationSelect({ lat: latitude, lng: longitude, address })
          } catch (error) {
            onLocationSelect({ 
              lat: latitude, 
              lng: longitude, 
              address: 'Текущее местоположение'
            })
          }
        }
        setIsLoading(false)
      },
      (error) => {
        console.error('Ошибка геолокации:', error)
        setIsLoading(false)
        alert('Не удалось определить ваше местоположение')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // Убеждаемся, что компонент смонтирован
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapRef.current || mapInstanceRef.current) return

    // Проверка готовности DOM
    if (!mapRef.current.offsetParent && mapRef.current.offsetWidth === 0) {
      console.warn('Map container not ready yet, skipping initialization')
      return
    }

    // Небольшая задержка для гарантии готовности DOM
    const initTimeout = setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) return

      try {
        // Инициализация карты
        const map = L.map(mapRef.current, {
          center: [initialLocation.lat, initialLocation.lng],
          zoom: 13,
          zoomControl: true,
          attributionControl: true,
        })

        // Добавляем простые тайлы OpenStreetMap
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        })

        tileLayer.on('tileload', () => {
          console.log('Тайлы OpenStreetMap загружены успешно')
          setIsLoading(false)
          setError(null)
        })

        tileLayer.on('tileerror', (e) => {
          console.error('Ошибка загрузки тайлов:', e)
          setError('Ошибка загрузки карты')
          setIsLoading(false)
        })

        tileLayer.addTo(map)

        // Добавляем маркер
        const marker = L.marker([initialLocation.lat, initialLocation.lng], { 
          draggable: true 
        }).addTo(map)

        // Обработчик клика по карте
        map.on('click', async (e) => {
          const { lat, lng } = e.latlng
          marker.setLatLng([lat, lng])
          
          try {
            const address = await reverseGeocode(lat, lng)
            onLocationSelect({ lat, lng, address })
          } catch (error) {
            console.error('Ошибка геокодирования:', error)
            onLocationSelect({ lat, lng, address: 'Адрес не определён' })
          }
        })

        // Обработчик перетаскивания маркера
        marker.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng()
          
          try {
            const address = await reverseGeocode(lat, lng)
            onLocationSelect({ lat, lng, address })
          } catch (error) {
            console.error('Ошибка геокодирования:', error)
            onLocationSelect({ lat, lng, address: 'Адрес не определён' })
          }
        })

        mapInstanceRef.current = map
        markerRef.current = marker

        // Получаем начальный адрес
        reverseGeocode(initialLocation.lat, initialLocation.lng)
          .then(address => {
            onLocationSelect({ 
              lat: initialLocation.lat, 
              lng: initialLocation.lng, 
              address 
            })
          })
          .catch(() => {
            onLocationSelect({ 
              lat: initialLocation.lat, 
              lng: initialLocation.lng, 
              address: 'Адрес не определён'
            })
          })

        // Таймаут для снятия индикатора загрузки, если тайлы не загрузились
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false)
          }
        }, 10000)

      } catch (err) {
        console.error('Ошибка инициализации карты:', err)
        setError('Ошибка инициализации карты')
        setIsLoading(false)
      }
    }, 100) // Задержка 100мс для готовности DOM

    return () => {
      clearTimeout(initTimeout)
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (error) {
          console.error('Error removing map:', error)
        }
        mapInstanceRef.current = null
      }
    }
  }, [isMounted])

  return (
    <div className={`relative ${className}`}>
      {/* Карта */}
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-xl overflow-hidden bg-gray-700"
        style={{ minHeight: '256px' }}
      />
      
      {/* Загрузка */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center rounded-xl">
          <div className="bg-gray-700 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#d62300] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-sm">Загрузка карты...</span>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center rounded-xl">
          <div className="bg-red-700 rounded-lg p-4 text-center">
            <span className="text-white text-sm">{error}</span>
            <button 
              onClick={() => window.location.reload()}
              className="block mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-xs"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      )}
      
      {/* Подсказка */}
      {!isLoading && !error && (
        <div className="absolute bottom-3 left-3 bg-gray-800/90 text-white text-xs px-3 py-2 rounded-lg z-[1000]">
          Нажмите на карту или перетащите маркер
        </div>
      )}

      {/* Кнопка "Моё местоположение" */}
      {!isLoading && !error && (
        <button
          onClick={getCurrentLocation}
          className="absolute top-3 right-3 bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-colors z-[1000]"
          title="Определить моё местоположение"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  )
}