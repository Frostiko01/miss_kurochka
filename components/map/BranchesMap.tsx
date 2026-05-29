'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Branch {
  id: string
  name: string
  address: string
  phone?: string
  latitude?: number | string | null
  longitude?: number | string | null
}

interface BranchesMapProps {
  branches: Branch[]
  className?: string
}

// Красный эмодзи-пин для филиала
function createBranchIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      font-size: 28px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
      cursor: pointer;
    ">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

// Синяя точка — текущее местоположение пользователя
function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 16px; height: 16px;
      background: #2563eb;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(37,99,235,0.5);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function BranchesMap({ branches, className = '' }: BranchesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const withCoords = branches.filter(
    b => b.latitude != null && b.longitude != null &&
         !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude))
  )

  // Центр по умолчанию — Бишкек
  const defaultCenter: [number, number] = [42.8746, 74.5698]

  // Убеждаемся, что компонент смонтирован
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    // Проверяем, что компонент смонтирован и элемент существует
    if (!isMounted || !mapRef.current || mapInstanceRef.current) return

    // Дополнительная проверка готовности DOM
    if (!mapRef.current.offsetParent && mapRef.current.offsetWidth === 0) {
      console.warn('Map container not ready yet, skipping initialization')
      return
    }

    // Небольшая задержка для гарантии готовности DOM
    const initTimeout = setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) return

    const center: [number, number] =
      withCoords.length > 0
        ? [Number(withCoords[0].latitude), Number(withCoords[0].longitude)]
        : defaultCenter

    try {
      const map = L.map(mapRef.current, {
        center,
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      })

      // Тайлы с fallback
      const providers = [
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      ]

      let loaded = false
      let providerIdx = 0

      const tryLoad = (idx: number) => {
        if (idx >= providers.length) { setIsLoading(false); return }
        const tl = L.tileLayer(providers[idx], { maxZoom: 19 })
        tl.on('tileload', () => {
          if (!loaded) { loaded = true; setIsLoading(false) }
        })
        tl.on('tileerror', () => {
          if (!loaded && idx === providerIdx) {
            providerIdx++
            tl.remove()
            tryLoad(providerIdx)
          }
        })
        tl.addTo(map)
        setTimeout(() => { if (!loaded) { tl.remove(); tryLoad(idx + 1) } }, 5000)
      }
      tryLoad(0)

      // Маркеры филиалов
      const branchIcon = createBranchIcon()
      const bounds: [number, number][] = []

      withCoords.forEach(branch => {
        const lat = Number(branch.latitude)
        const lng = Number(branch.longitude)
        bounds.push([lat, lng])

        L.marker([lat, lng], { icon: branchIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:inherit;min-width:150px;padding:2px 0">
              <strong style="font-size:13px;color:#0f0f10">${branch.name}</strong>
              <p style="font-size:11px;color:#57575c;margin:5px 0 0;line-height:1.4">${branch.address}</p>
              ${branch.phone
                ? `<a href="tel:${branch.phone}" style="font-size:11px;color:#d62300;font-weight:700;display:block;margin-top:5px">${branch.phone}</a>`
                : ''}
            </div>`,
            { maxWidth: 220, className: 'branch-popup' }
          )
      })

      // Подгоняем вид под все маркеры
      if (bounds.length === 1) {
        map.setView(bounds[0], 15)
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [24, 24] })
      }

      mapInstanceRef.current = map

      // Пересчёт размера после анимации drawer
      setTimeout(() => map.invalidateSize(), 150)
      setTimeout(() => map.invalidateSize(), 400)
    } catch (error) {
      console.error('Failed to initialize Leaflet map:', error)
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

  // Обновляем маркеры при изменении списка филиалов
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Удаляем старые маркеры (кроме маркера пользователя)
    map.eachLayer(layer => {
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
        layer.remove()
      }
    })

    const branchIcon = createBranchIcon()
    const bounds: [number, number][] = []

    withCoords.forEach(branch => {
      const lat = Number(branch.latitude)
      const lng = Number(branch.longitude)
      bounds.push([lat, lng])

      L.marker([lat, lng], { icon: branchIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:inherit;min-width:150px;padding:2px 0">
            <strong style="font-size:13px;color:#0f0f10">${branch.name}</strong>
            <p style="font-size:11px;color:#57575c;margin:5px 0 0;line-height:1.4">${branch.address}</p>
            ${branch.phone
              ? `<a href="tel:${branch.phone}" style="font-size:11px;color:#d62300;font-weight:700;display:block;margin-top:5px">${branch.phone}</a>`
              : ''}
          </div>`,
          { maxWidth: 220 }
        )
    })

    if (bounds.length === 1) {
      map.setView(bounds[0], 15)
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [24, 24] })
    }
  }, [branches])

  // Кнопка геолокации
  const handleLocate = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        const map = mapInstanceRef.current!

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng])
        } else {
          userMarkerRef.current = L.marker([lat, lng], { icon: createUserIcon() })
            .addTo(map)
            .bindPopup('<span style="font-size:12px;font-weight:600">Вы здесь</span>')
        }

        map.setView([lat, lng], 14)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Карта */}
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: 180 }}
      />

      {/* Загрузка */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--bg-muted)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[var(--fg-muted)] font-semibold">Загрузка карты...</span>
          </div>
        </div>
      )}

      {/* Кнопка геолокации */}
      <button
        onClick={handleLocate}
        disabled={locating}
        title="Моё местоположение"
        className="absolute top-2 right-2 z-[1000] w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-md border border-[var(--border)] hover:bg-[var(--bg-muted)] transition disabled:opacity-60"
      >
        {locating ? (
          <div className="w-3.5 h-3.5 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 text-[var(--fg-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" strokeWidth="1.5" strokeDasharray="4 2" />
          </svg>
        )}
      </button>

      {/* Нет координат */}
      {withCoords.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-muted)]/80">
          <span className="text-2xl">📍</span>
          <p className="text-xs font-semibold text-[var(--fg-muted)]">Координаты не указаны</p>
        </div>
      )}
    </div>
  )
}
