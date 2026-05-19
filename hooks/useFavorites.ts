'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'favorites'

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Читаем из localStorage при монтировании (один раз)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setIds(parsed)
      }
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (id: string) => ids.includes(id),
    [ids]
  )

  // Стабильный ref для has/size — не создаём новый объект на каждый рендер
  // SideMenu использует favorites.size и favorites.has(id)
  const idsRef = useRef(ids)
  idsRef.current = ids

  const favoritesRef = useRef({
    get size() { return idsRef.current.length },
    has: (id: string) => idsRef.current.includes(id),
    [Symbol.iterator]: function* () { yield* idsRef.current },
  })

  return {
    // Стабильный объект — не вызывает лишних ре-рендеров в зависимостях
    favorites: favoritesRef.current as unknown as Set<string> & { size: number },
    ids,
    toggle,
    isFavorite,
    mounted,
  }
}
