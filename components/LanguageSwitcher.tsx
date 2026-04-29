'use client'

import { useState } from 'react'
import { Locale, localeNames, localeFlags } from '@/app/i18n/config'

interface LanguageSwitcherProps {
  currentLocale: Locale
  onLocaleChange: (locale: Locale) => void
  className?: string
}

export default function LanguageSwitcher({ 
  currentLocale, 
  onLocaleChange,
  className = ''
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const locales: Locale[] = ['ru', 'kg']

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-white border-2 border-[#d62300] rounded-xl font-bold text-[#d62300] hover:bg-[#d62300] hover:text-white transition-all shadow-lg text-sm"
      >
        <span className="text-lg sm:text-xl">{localeFlags[currentLocale]}</span>
        <span className="hidden md:inline text-xs sm:text-sm">{localeNames[currentLocale]}</span>
        <svg 
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 bg-white border-2 border-[#d62300] rounded-xl shadow-2xl overflow-hidden z-50 min-w-[140px] sm:min-w-[160px]">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => {
                  onLocaleChange(locale)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 font-bold transition-all text-sm ${
                  currentLocale === locale
                    ? 'bg-[#d62300] text-white'
                    : 'text-black hover:bg-red-50'
                }`}
              >
                <span className="text-lg sm:text-xl">{localeFlags[locale]}</span>
                <span className="text-xs sm:text-sm">{localeNames[locale]}</span>
                {currentLocale === locale && (
                  <span className="ml-auto">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
