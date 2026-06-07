'use client'

import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import SmartImage from './SmartImage'

export interface PromoSlide {
  image: string
  title?: string | null
  subtitle?: string | null
  link?: string | null
}

interface Props {
  slides: PromoSlide[]
  onSlideClick?: (slide: PromoSlide, index: number) => void
  intervalMs?: number
}

export default function PromoSlider({ slides, onSlideClick, intervalMs = 5500 }: Props) {
  const [active, setActive] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserDragging = useRef(false)
  const isProgrammatic = useRef(false)
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Автопрокрутка
  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => {
      if (isUserDragging.current) return
      setActive((i) => (i + 1) % slides.length)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [slides.length, intervalMs])

  // Скролл к активному слайду
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const child = el.children[active] as HTMLElement | undefined
    if (child) {
      isProgrammatic.current = true
      el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
      // Снимаем флаг после завершения плавного скролла
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current)
      scrollEndTimer.current = setTimeout(() => {
        isProgrammatic.current = false
      }, 500)
    }
  }, [active])

  // Обновление active по позиции скролла (только при ручном свайпе)
  const onScroll = () => {
    if (isProgrammatic.current) return
    const el = containerRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== active) setActive(i)
  }

  if (slides.length === 0) return null

  return (
    <section className="px-3">
      <div
        ref={containerRef}
        onScroll={onScroll}
        onTouchStart={() => (isUserDragging.current = true)}
        onTouchEnd={() => {
          setTimeout(() => (isUserDragging.current = false), 400)
        }}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => onSlideClick?.(slide, i)}
            className="snap-center shrink-0 w-full relative overflow-hidden rounded-3xl active:scale-[0.98] transition-transform"
            style={{ aspectRatio: '16 / 10' }}
          >
            <SmartImage
              src={slide.image}
              alt={slide.title ?? ''}
              className="absolute inset-0 w-full h-full object-cover"
              eager={i === 0}
              sizes="100vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)',
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
              <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full bg-white/90 text-[var(--brand)] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                <Flame className="w-3 h-3" />
                Акция
              </span>
              {slide.title && (
                <h3 className="text-white text-xl font-extrabold leading-tight tracking-tight line-clamp-2">
                  {slide.title}
                </h3>
              )}
              {slide.subtitle && (
                <p className="text-white/85 text-xs font-medium mt-1 line-clamp-2">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Слайд ${i + 1}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === active ? 20 : 6,
                backgroundColor:
                  i === active ? 'var(--brand)' : 'var(--border-strong)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
