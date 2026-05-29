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

interface DeliveryMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  initialLocation?: { lat: number; lng: number }
  className?: string
}

// Форматирует адрес из Nominatim addressdetails — без страны, индекса и координат
function formatAddress(addr: Record<string, string>): string {
  const parts: string[] = []
  if (addr.road) {
    parts.push(addr.house_number ? `${addr.road}, ${addr.house_number}` : addr.road)
  } else if (addr.pedestrian) {
    parts.push(addr.house_number ? `${addr.pedestrian}, ${addr.house_number}` : addr.pedestrian)
  } else if (addr.neighbourhood) {
    parts.push(addr.neighbourhood)
  }
  if (addr.suburb) parts.push(addr.suburb)
  if (addr.city) parts.push(addr.city)
  else if (addr.town) parts.push(addr.town)
  else if (addr.village) parts.push(addr.village)

  return parts.length > 0 ? parts.join(', ') : (addr.display_name ?? '')
}

export default function DeliveryMap({ 
  onLocationSelect, 
  initialLocation = { lat: 42.8746, lng: 74.5698 }, // Бишкек
  className = '' 
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapStatus, setMapStatus] = useState('Инициализация карты...')
  const [isMounted, setIsMounted] = useState(false)

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
          attributionControl: false,
        })

    // Добавляем тайлы с несколькими fallback вариантами
    let currentTileLayer: L.TileLayer | null = null
    
    const tryTileProviders = [
      {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
      },
      {
        name: 'CartoDB Positron',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '© OpenStreetMap contributors © CARTO'
      },
      {
        name: 'OpenFreeMap',
        url: 'https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png',
        attribution: '© OpenFreeMap contributors'
      }
    ]
    
    const loadTileProvider = (providerIndex: number = 0) => {
      if (providerIndex >= tryTileProviders.length) {
        console.error('Все провайдеры тайлов недоступны')
        setMapStatus('Ошибка загрузки карты')
        setIsLoading(false)
        return
      }
      
      const provider = tryTileProviders[providerIndex]
      console.log(`Загружаем тайлы от ${provider.name}`)
      setMapStatus(`Загрузка карты (${provider.name})...`)
      
      if (currentTileLayer) {
        currentTileLayer.remove()
      }
      
      currentTileLayer = L.tileLayer(provider.url, {
        maxZoom: 19,
        attribution: provider.attribution
      })
      
      let tileErrorCount = 0
      let tileLoadCount = 0
      
      currentTileLayer.on('tileerror', (e) => {
        tileErrorCount++
        console.warn(`Ошибка загрузки тайла от ${provider.name} (${tileErrorCount})`)
        
        // Если слишком много ошибок, переключаемся на следующий провайдер
        if (tileErrorCount > 3) {
          console.warn(`Слишком много ошибок от ${provider.name}, переключаемся на следующий провайдер`)
          setTimeout(() => loadTileProvider(providerIndex + 1), 1000)
        }
      })
      
      currentTileLayer.on('tileload', () => {
        tileLoadCount++
        if (tileLoadCount === 1) {
          console.log(`Тайлы от ${provider.name} загружены успешно`)
          setMapStatus(`Карта загружена (${provider.name})`)
          setIsLoading(false)
        }
      })
      
      currentTileLayer.addTo(map)
      
      // Таймаут для переключения на следующий провайдер, если тайлы не загружаются
      setTimeout(() => {
        if (tileLoadCount === 0 && isLoading) {
          console.warn(`Таймаут загрузки тайлов от ${provider.name}`)
          loadTileProvider(providerIndex + 1)
        }
      }, 5000)
    }
    
    // Начинаем с первого провайдера
    loadTileProvider(0)

    // Создаем кастомную иконку маркера
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="w-8 h-8 bg-[#d62300] rounded-full border-4 border-white shadow-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    // Добавляем начальный маркер
    const marker = L.marker([initialLocation.lat, initialLocation.lng], { 
      icon: customIcon,
      draggable: true 
    }).addTo(map)

    // Обработчик клика по карте
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng
      
      // Перемещаем маркер
      marker.setLatLng([lat, lng])
      
      // Получаем адрес по координатам
      try {
        const address = await reverseGeocode(lat, lng)
        onLocationSelect({ lat, lng, address })
      } catch (error) {
        console.error('Ошибка геокодирования:', error)
        onLocationSelect({ lat, lng, address: `����� �� ��������` })
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
        onLocationSelect({ lat, lng, address: `����� �� ��������` })
      }
    })

    mapInstanceRef.current = map
    markerRef.current = marker
    setIsLoading(false)

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
          address: `${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}` 
        })
      })

      } catch (error) {
        console.error('Failed to initialize Leaflet map:', error)
        setMapStatus('Ошибка инициализации карты')
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

  // Функция обратного геокодирования с улучшенной обработкой ошибок
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

  // Функция поиска по адресу с улучшенной обработкой ошибок
  const searchAddress = async (query: string) => {
    if (!query.trim()) return
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ru&addressdetails=1&countrycodes=kg`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.length > 0) {
        const { lat, lon, address: addrDetails } = data[0]
        const newLat = parseFloat(lat)
        const newLng = parseFloat(lon)
        
        // Форматируем адрес без страны и координат
        const formattedAddress = addrDetails ? formatAddress(addrDetails) : data[0].display_name?.split(',').slice(0, 3).join(',').trim() ?? ''
        
        // Перемещаем карту и маркер
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 15)
          markerRef.current.setLatLng([newLat, newLng])
          onLocationSelect({ lat: newLat, lng: newLng, address: formattedAddress })
        }
        
        return true
      } else {
        console.warn('Адрес не найден:', query)
        return false
      }
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
      return false
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
              address: `������� ��������������` 
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
            <span className="text-white text-sm">{mapStatus}</span>
          </div>
        </div>
      )}
      
      {/* Кнопка "Моё местоположение" */}
      <button
        onClick={getCurrentLocation}
        disabled={isLoading}
        className="absolute top-3 right-3 bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-colors disabled:opacity-50 z-[1000]"
        title="Определить моё местоположение"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {/* Подсказка */}
      <div className="absolute bottom-3 left-3 bg-gray-800/90 text-white text-xs px-3 py-2 rounded-lg z-[1000]">
        Нажмите на карту или перетащите маркер
      </div>
    </div>
  )
}