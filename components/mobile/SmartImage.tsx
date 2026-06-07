'use client'

import { useEffect, useRef, useState } from 'react'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  /** eager для первого/видимого слайда, lazy для остальных */
  eager?: boolean
  /** sizes для адаптивной загрузки */
  sizes?: string
}

/**
 * SmartImage — обёртка над <img>, которая убирает «белую вспышку» до загрузки.
 *
 * Пока картинка не загрузилась/не декодировалась — показывается мягкий
 * скелетон-плейсхолдер (shimmer). Когда изображение готово — оно плавно
 * проявляется (fade-in).
 *
 * ВАЖНО: если картинка уже в кэше браузера, событие onLoad может сработать
 * ДО того, как React навесит обработчик. Поэтому при монтировании проверяем
 * img.complete и сразу помечаем как загруженную — иначе скелетон зависал бы
 * навсегда поверх готового изображения.
 */
export default function SmartImage({
  src,
  alt,
  className = '',
  eager = false,
  sizes,
}: SmartImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    // Картинка уже загружена (из кэша) — onLoad может не сработать, помечаем вручную.
    if (img.complete) {
      if (img.naturalWidth > 0) {
        setLoaded(true)
        setError(false)
      } else {
        setError(true)
      }
    } else {
      // Новая ещё не загруженная картинка — показываем скелетон
      setLoaded(false)
      setError(false)
    }
  }, [src])

  return (
    <>
      {/* Скелетон-плейсхолдер, пока картинка грузится */}
      {!loaded && !error && <span className="smart-img__skeleton" aria-hidden="true" />}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`smart-img ${loaded ? 'smart-img--loaded' : ''} ${className}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        draggable={false}
      />

      <style jsx>{`
        .smart-img {
          opacity: 0;
          transition: opacity 0.4s ease;
          will-change: opacity;
        }
        .smart-img--loaded {
          opacity: 1;
        }
        .smart-img__skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            100deg,
            var(--bg-muted) 30%,
            rgba(255, 255, 255, 0.45) 50%,
            var(--bg-muted) 70%
          );
          background-size: 200% 100%;
          animation: smart-img-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes smart-img-shimmer {
          from {
            background-position: 200% 0;
          }
          to {
            background-position: -200% 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .smart-img {
            transition: none;
          }
          .smart-img__skeleton {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}
