'use client'

import { Locale, defaultLocale } from './config'

const LOCALE_COOKIE_NAME = 'locale'

export function getLocaleCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale
  
  const cookies = document.cookie.split(';')
  const localeCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${LOCALE_COOKIE_NAME}=`)
  )
  
  if (localeCookie) {
    const locale = localeCookie.split('=')[1].trim() as Locale
    if (['ru', 'kg'].includes(locale)) {
      return locale
    }
  }
  
  return defaultLocale
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') return
  
  const maxAge = 365 * 24 * 60 * 60 // 1 year in seconds
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function removeLocaleCookie(): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`
}
