'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  /**
   * Тема:
   * - undefined / false — светлая (пользовательский интерфейс)
   * - 'admin' — тёмно-синяя (#050c26 триггер, #181f38 дропдаун)
   * - 'branch' — тёмно-серая (#1A212B триггер, #202937 дропдаун)
   * - true — алиас для 'branch' (обратная совместимость)
   */
  dark?: boolean | 'admin' | 'branch'
  disabled?: boolean
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  className = '',
  dark = false,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
  }

  // ── Цветовые схемы ─────────────────────────────────────────────────────────
  const isDark = !!dark

  // Определяем вариант
  const variant: 'light' | 'admin' | 'branch' =
    dark === 'admin' ? 'admin'
    : dark === 'branch' || dark === true ? 'branch'
    : 'light'

  const triggerStyle = isDark
    ? variant === 'admin'
      ? {
          backgroundColor: '#181f38',
          borderColor: open ? '#4047ee' : '#242b47',
          color: selected ? '#fff' : '#78819d',
        }
      : {
          // branch
          backgroundColor: '#1A212B',
          borderColor: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
          color: selected ? '#fff' : '#98A2B3',
        }
    : undefined

  const dropdownStyle = isDark
    ? variant === 'admin'
      ? { backgroundColor: '#181f38', borderColor: '#242b47' }
      : { backgroundColor: '#1A212B', borderColor: 'rgba(255,255,255,0.08)' }
    : undefined

  const mutedColor = variant === 'admin' ? '#78819d' : '#98A2B3'
  const accentColor = variant === 'admin' ? '#4047ee' : '#7C8CA5'

  const itemBase = isDark
    ? 'text-white hover:bg-white/8'
    : 'text-[var(--fg)] hover:bg-[var(--bg-muted)]'

  const itemSelected = isDark
    ? 'bg-white/10 text-white font-bold'
    : 'bg-[var(--brand-soft)] text-[var(--brand)] font-bold'

  return (
    <div ref={containerRef} className={`relative ${className}`} id={id}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-3
          rounded-xl border text-sm font-semibold
          transition-all duration-150 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isDark
            ? 'focus:outline-none'
            : 'bg-[var(--surface)] border-[var(--border-strong)] text-[var(--fg)] focus:border-[var(--brand)] focus:shadow-[0_0_0_4px_rgba(214,35,0,0.10)] focus:outline-none'
          }
        `}
        style={triggerStyle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={isDark && !selected ? { color: mutedColor } : undefined}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={isDark ? { color: mutedColor } : { color: 'var(--fg-subtle)' }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`
            absolute z-50 w-full mt-1.5 rounded-xl border shadow-lg overflow-hidden
            ${isDark ? '' : 'bg-[var(--surface)] border-[var(--border)]'}
          `}
          style={dropdownStyle}
          role="listbox"
        >
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-thin">
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between gap-2
                    px-4 py-2.5 text-sm text-left transition-colors duration-100
                    ${isSelected ? itemSelected : itemBase}
                  `}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5 shrink-0"
                      style={isDark ? { color: accentColor } : { color: 'var(--brand)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
