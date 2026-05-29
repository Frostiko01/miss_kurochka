'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'favorites'

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Читаем из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setIds(parsed)
      }
    } catch {}
    setMounted(true)
  }, [])

  // Добавить/убрать из избранного
  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (id: string) => ids.includes(id),
    [ids]
  )

  const idsRef = useRef(ids)
  idsRef.current = ids

  const favoritesRef = useRef({
    get size() { return idsRef.current.length },
    has: (id: string) => idsRef.current.includes(id),
    [Symbol.iterator]: function* () { yield* idsRef.current },
  })

  return {
    favorites: favoritesRef.current as unknown as Set<string> & { size: number },
    ids,
    toggle,
    isFavorite,
    mounted,
  }
}
