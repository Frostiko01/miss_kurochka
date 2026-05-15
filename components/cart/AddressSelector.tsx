'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Search, Save } from 'lucide-react'

const DeliveryMap = dynamic(() => import('../map/SimpleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center border border-[var(--border)]">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-[var(--fg-muted)] font-semibold">Загрузка карты...</p>
      </div>
    </div>
  ),
})

interface AddressData {
  street: string
  apartment: string
  entrance: string
  floor: string
  intercom: string
  comment: string
  coordinates?: { lat: number; lng: number }
}

interface AddressSelectorProps {
  onAddressChange: (address: AddressData) => void
  initialAddress?: AddressData
}

export default function AddressSelector({ onAddressChange, initialAddress }: AddressSelectorProps) {
  const [showMap, setShowMap] = useState(false)
  const [address, setAddress] = useState<AddressData>({
    street: initialAddress?.street || '',
    apartment: initialAddress?.apartment || '',
    entrance: initialAddress?.entrance || '',
    floor: initialAddress?.floor || '',
    intercom: initialAddress?.intercom || '',
    comment: initialAddress?.comment || '',
    coordinates: initialAddress?.coordinates,
  })
  const [isSearching, setIsSearching] = useState(false)
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false)

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setIsGeocodingLocation(true)
    setTimeout(() => {
      const newAddress = {
        ...address,
        street: location.address,
        coordinates: { lat: location.lat, lng: location.lng },
      }
      setAddress(newAddress)
      onAddressChange(newAddress)
      setIsGeocodingLocation(false)
    }, 400)
  }

  const handleInputChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...address, [field]: value }
    setAddress(newAddress)
    onAddressChange(newAddress)
  }

  const searchAddressByText = async (query: string) => {
    if (!query.trim() || query.length < 3) return
    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&accept-language=ru&addressdetails=1&countrycodes=kg`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const { lat, lon, display_name } = data[0]
          const coordinates = { lat: parseFloat(lat), lng: parseFloat(lon) }
          const newAddress = {
            ...address,
            street: display_name.length > 100 ? display_name.substring(0, 100) + '...' : display_name,
            coordinates,
          }
          setAddress(newAddress)
          onAddressChange(newAddress)
          if (showMap) handleLocationSelect({ ...coordinates, address: display_name })
        } else {
          alert('Адрес не найден. Попробуйте другой запрос.')
        }
      }
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
      alert('Ошибка поиска адреса.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleStreetInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchAddressByText(address.street)
    }
  }

  const handleSaveAddress = () => {
    console.log('Сохранение адреса:', address)
    alert('Адрес сохранён')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--fg-muted)]">
          Введите адрес и нажмите Enter для поиска
        </p>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="btn btn-ghost btn-sm"
        >
          <MapPin className="w-3.5 h-3.5" />
          {showMap ? 'Скрыть карту' : 'На карте'}
        </button>
      </div>

      {showMap && (
        <DeliveryMap
          onLocationSelect={handleLocationSelect}
          initialLocation={address.coordinates}
          className="w-full"
        />
      )}

      {/* Address line */}
      <div className="relative">
        <input
          type="text"
          placeholder="Улица, дом"
          value={address.street}
          onChange={(e) => handleInputChange('street', e.target.value)}
          onKeyDown={handleStreetInputKeyPress}
          className="input pr-10"
        />
        <button
          type="button"
          onClick={() => searchAddressByText(address.street)}
          disabled={isSearching || address.street.length < 3}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[var(--fg-subtle)] hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] transition disabled:opacity-50"
          aria-label="Найти"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Detail fields */}
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="text"
          placeholder="Квартира"
          value={address.apartment}
          onChange={(e) => handleInputChange('apartment', e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Подъезд"
          value={address.entrance}
          onChange={(e) => handleInputChange('entrance', e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Этаж"
          value={address.floor}
          onChange={(e) => handleInputChange('floor', e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Домофон"
          value={address.intercom}
          onChange={(e) => handleInputChange('intercom', e.target.value)}
          className="input"
        />
      </div>

      <textarea
        placeholder="Комментарий к адресу"
        value={address.comment}
        onChange={(e) => handleInputChange('comment', e.target.value)}
        rows={2}
        className="textarea"
      />

      <button onClick={handleSaveAddress} className="btn btn-secondary w-full">
        <Save className="w-4 h-4" />
        Сохранить адрес
      </button>

      {(isGeocodingLocation || address.coordinates) && (
        <p className="text-[11px] text-[var(--fg-subtle)] text-center">
          {isGeocodingLocation
            ? 'Определяем адрес...'
            : address.coordinates &&
              `Координаты: ${address.coordinates.lat.toFixed(5)}, ${address.coordinates.lng.toFixed(5)}`}
        </p>
      )}
    </div>
  )
}
