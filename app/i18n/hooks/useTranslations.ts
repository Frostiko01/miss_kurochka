'use client'

import { useState, useEffect } from 'react'
import { Locale, defaultLocale } from '../config'
import { getTranslations, t, tInterpolate, tArray } from '../index'
import { getLocaleCookie, setLocaleCookie } from '../cookies'

export function useTranslations(page: string) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [translations, setTranslations] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load locale from cookie
    const savedLocale = getLocaleCookie()
    setLocale(savedLocale)
  }, [])

  useEffect(() => {
    async function loadTranslations() {
      setIsLoading(true)
      const trans = await getTranslations(locale, page)
      setTranslations(trans)
      setIsLoading(false)
    }

    loadTranslations()
  }, [locale, page])

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    setLocaleCookie(newLocale)
  }

  return {
    locale,
    changeLocale,
    translations,
    isLoading,
    t: (key: string, fallback?: string) => t(translations, key, fallback),
    tInterpolate: (key: string, params?: Record<string, string | number>) => 
      tInterpolate(translations, key, params),
    tArray: (key: string) => tArray(translations, key)
  }
}
