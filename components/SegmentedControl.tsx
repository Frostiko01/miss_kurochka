'use client'

interface SegmentedItem {
  label: string
  value: string
}

interface SegmentedControlProps {
  items: SegmentedItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function SegmentedControl({
  items,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 gap-0.5 ${className}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
      onClick={e => e.stopPropagation()}
    >
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          onClick={e => { e.stopPropagation(); onChange(item.value) }}
          className="relative px-2.5 py-1 rounded-full text-[11px] font-bold transition-all leading-none"
          style={{
            backgroundColor: value === item.value ? 'var(--brand)' : 'transparent',
            color: value === item.value ? 'white' : 'var(--fg-muted)',
            boxShadow: value === item.value ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
