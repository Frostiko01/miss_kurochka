'use client'

import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'

export interface CategoryItem {
  id: string
  name: string
  imageUrl?: string | null
}

interface Props {
  categories: CategoryItem[]
  activeId: string
  onChange: (id: string) => void
  sticky?: boolean
}

export default function CategoryTabs({ categories, activeId, onChange, sticky }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const btn = el.querySelector<HTMLButtonElement>(`[data-cat="${activeId}"]`)
    if (btn) {
      const left = btn.offsetLeft - el.clientWidth / 2 + btn.clientWidth / 2
      el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
    }
  }, [activeId])

  const containerStyle = sticky
    ? {
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }
    : undefined

  return (
    <div className={sticky ? 'sticky top-[60px] z-30' : ''} style={containerStyle}>
      <div ref={ref} className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
        <Pill
          id="all"
          name="Все"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          active={activeId === 'all'}
          onClick={() => onChange('all')}
        />
        {categories.map((cat) => (
          <Pill
            key={cat.id}
            id={cat.id}
            name={cat.name}
            imageUrl={cat.imageUrl}
            active={activeId === cat.id}
            onClick={() => onChange(cat.id)}
          />
        ))}
      </div>
    </div>
  )
}

function Pill({
  id,
  name,
  imageUrl,
  icon,
  active,
  onClick,
}: {
  id: string
  name: string
  imageUrl?: string | null
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      data-cat={id}
      onClick={onClick}
      aria-pressed={active}
      className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-bold transition-all active:scale-95"
      style={{
        backgroundColor: active ? 'var(--brand)' : 'var(--bg-muted)',
        color: active ? '#fff' : 'var(--fg-muted)',
        boxShadow: active ? '0 6px 14px rgba(214,35,0,0.25)' : 'none',
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
      ) : icon ? (
        <span className={active ? 'text-white' : 'text-[var(--fg-subtle)]'}>{icon}</span>
      ) : null}
      <span className="whitespace-nowrap">{name}</span>
    </button>
  )
}
