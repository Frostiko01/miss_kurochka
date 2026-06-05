'use client'

import { useEffect } from 'react'

/**
 * Регистрирует service worker для PWA.
 * - Регистрация только в production (в dev SW мешает HMR).
 * - Автоматически подхватывает обновлённую версию SW.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // В dev-режиме не регистрируем, чтобы не кешировать сборку и не ломать HMR
    if (process.env.NODE_ENV !== 'production') return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        // Если найдено обновление SW — активируем его сразу
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              installing.postMessage('SKIP_WAITING')
            }
          })
        })
      } catch (err) {
        console.error('SW registration failed:', err)
      }
    }

    // Регистрируем после полной загрузки страницы, чтобы не конкурировать за ресурсы
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }

    // Перезагружаем страницу когда новый SW взял управление
    let refreshing = false
    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    )

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      )
    }
  }, [])

  return null
}
