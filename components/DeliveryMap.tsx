'use client'

import { useEffect, useState } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'

interface DeliveryMapProps {
  address: string
  onLocationSelect?: (lat: number, lng: number, address: string) => void
  height?: string
}

export default function DeliveryMap({
  address,
  onLocationSelect,
  height = '260px',
}: DeliveryMapProps) {
  const [loading, setLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (address && address.length > 3) geocodeAddress(address)
  }, [address])

  const geocodeAddress = async (searchAddress: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchAddress + ', Бишкек, Кыргызстан'
        )}&limit=1`
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setCoordinates({ lat, lng })
        if (onLocationSelect) onLocationSelect(lat, lng, data[0].display_name)
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
    <div
      className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)] flex items-center justify-center relative"
      style={{ height }}
    >
      {loading && (
        <div className="absolute top-2 right-2 z-10 bg-white rounded-md p-1.5 shadow-sm">
          <div className="w-3.5 h-3.5 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {coordinates ? (
        <div className="text-center px-5 py-6">
          <div className="w-10 h-10 mx-auto rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold mb-0.5">Адрес найден</p>
          <p className="text-xs text-[var(--fg-muted)] mb-3 line-clamp-2">{address}</p>
          <button
            onClick={openInMaps}
            className="btn btn-secondary btn-sm inline-flex"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Открыть на карте
          </button>
        </div>
      ) : (
        <div className="text-center px-5 py-6">
          <div className="w-10 h-10 mx-auto rounded-full bg-white text-[var(--fg-subtle)] flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-[var(--fg-muted)]">
            {loading ? 'Поиск адреса...' : 'Введите адрес для поиска'}
          </p>
        </div>
      )}
    </div>
  )
}
