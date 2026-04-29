import { Locale, defaultLocale } from './config'

type TranslationFiles = {
  [key: string]: any
}

const translationCache: Map<string, any> = new Map()

/**
 * Load translation file for a specific locale and page
 */
export async function getTranslations(locale: Locale, page: string): Promise<any> {
  const cacheKey = `${locale}-${page}`
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)
  }

  try {
    const translations = await import(`./locales/${locale}/${page}.json`)
    translationCache.set(cacheKey, translations.default)
    return translations.default
  } catch (error) {
    console.warn(`Translation file not found: ${locale}/${page}.json, falling back to ${defaultLocale}`)
    
    if (locale !== defaultLocale) {
      try {
        const fallbackTranslations = await import(`./locales/${defaultLocale}/${page}.json`)
        return fallbackTranslations.default
      } catch (fallbackError) {
        console.error(`Fallback translation file not found: ${defaultLocale}/${page}.json`)
        return {}
      }
    }
    
    return {}
  }
}

/**
 * Get nested translation value by dot notation path
 */
export function getNestedTranslation(translations: any, path: string): string {
  return path.split('.').reduce((obj, key) => obj?.[key], translations) || path
}

/**
 * Simple translation function
 */
export function t(translations: any, key: string, fallback?: string): string {
  const value = getNestedTranslation(translations, key)
  return value || fallback || key
}

/**
 * Translation function with interpolation
 */
export function tInterpolate(
  translations: any,
  key: string,
  params: Record<string, string | number> = {}
): string {
  let text = getNestedTranslation(translations, key)
  
  Object.entries(params).forEach(([paramKey, paramValue]) => {
    text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue))
  })
  
  return text
}

/**
 * Get array of translations
 */
export function tArray(translations: any, key: string): string[] {
  const value = getNestedTranslation(translations, key)
  return Array.isArray(value) ? value : []
}

/**
 * Check if locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return ['ru', 'kg'].includes(locale)
}

/**
 * Get locale from string with fallback
 */
export function getLocale(locale?: string): Locale {
  if (locale && isValidLocale(locale)) {
    return locale
  }
  return defaultLocale
}
