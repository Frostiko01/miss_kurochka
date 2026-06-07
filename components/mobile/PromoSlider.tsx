'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  // Пользователь сейчас взаимодействует со слайдером (свайп/инерционный скролл).
  // Пока true — автопрокрутка не вмешивается, чтобы не дёргать палец.
  const interactingRef = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  // Активный индекс определяется ИСКЛЮЧИТЕЛЬНО позицией скролла — это убирает
  // обратную связь (когда программный скролл боролся со свайпом пользователя).
  const syncActiveFromScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    let nearest = 0
    let minDist = Infinity
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement
      const dist = Math.abs(child.offsetLeft - scrollLeft)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    }
    setActive((prev) => (prev !== nearest ? nearest : prev))
  }, [])

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      interactingRef.current = false
    }, 1200)
  }, [])

  const onScroll = () => {
    // Любой скролл = взаимодействие; возобновляем автоплей только после паузы.
    interactingRef.current = true
    scheduleResume()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(syncActiveFromScroll)
  }

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const el = containerRef.current
    if (!el) return
    const child = el.children[index] as HTMLElement | undefined
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: smooth ? 'smooth' : 'auto' })
    }
  }, [])

  // Автопрокрутка — двигает контейнер напрямую (не через setActive → effect),
  // поэтому не конфликтует с ручным свайпом.
  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => {
      if (interactingRef.current) return
      const el = containerRef.current
      if (!el) return
      const next = (active + 1) % slides.length
      const child = el.children[next] as HTMLElement | undefined
      if (child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
    }, intervalMs)
    return () => clearInterval(timer)
  }, [slides.length, intervalMs, active])

  // Чистим таймеры/rAF при размонтировании
  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (slides.length === 0) return null

  return (
    <section className="px-3">
      <div
        ref={containerRef}
        onScroll={onScroll}
        onPointerDown={() => {
          interactingRef.current = true
          if (resumeTimer.current) clearTimeout(resumeTimer.current)
        }}
        onPointerUp={scheduleResume}
        onPointerCancel={scheduleResume}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 touch-pan-x"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
        }}
      >
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => onSlideClick?.(slide, i)}
            className="snap-start shrink-0 w-full relative overflow-hidden rounded-3xl active:scale-[0.98] transition-transform"
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
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)',
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-4 text-left pointer-events-none">
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
              onClick={() => {
                interactingRef.current = true
                scheduleResume()
                scrollToIndex(i)
              }}
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
