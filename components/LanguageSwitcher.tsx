'use client'

import { useState, useRef, useEffect } from 'react'
import { Locale, localeNames, localeFlags } from '@/app/i18n/config'
import { Check, ChevronDown } from 'lucide-react'

interface LanguageSwitcherProps {
  currentLocale: Locale
  onLocaleChange: (locale: Locale) => void
  className?: string
}

export default function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  className = '',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const locales: Locale[] = ['ru', 'kg']

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition"
      >
        <span className="text-base leading-none">{localeFlags[currentLocale]}</span>
        <span className="hidden md:inline text-xs uppercase font-bold">{currentLocale}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 bg-white border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px] animate-fadeIn">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => {
                onLocaleChange(locale)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold transition ${
                currentLocale === locale
                  ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                  : 'text-[var(--fg)] hover:bg-[var(--bg-muted)]'
              }`}
            >
              <span className="text-base leading-none">{localeFlags[locale]}</span>
              <span className="flex-1 text-left">{localeNames[locale]}</span>
              {currentLocale === locale && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
