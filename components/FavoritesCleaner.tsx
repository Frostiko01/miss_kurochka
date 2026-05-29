'use client'

import { useEffect } from 'react'

const CLEARED_KEY = 'fav_cleared_v4'

export default function FavoritesCleaner() {
  useEffect(() => {
    try {
      if (!localStorage.getItem(CLEARED_KEY)) {
        localStorage.removeItem('favorites')
        // Убираем старые флаги версий
        localStorage.removeItem('fav_cleared_v3')
        localStorage.removeItem('favorites_version')
        localStorage.setItem(CLEARED_KEY, '1')
      }
    } catch {}
  }, [])

  return null
}
