import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Miss Kurochka — Самая вкусная курочка',
    short_name: 'Miss Kurochka',
    description:
      'Заказывайте вкусную курицу, бургеры и напитки онлайн. Быстрая доставка и самовывоз.',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#d62300',
    lang: 'ru',
    dir: 'ltr',
    categories: ['food', 'shopping', 'lifestyle'],
    icons: [
      {
        src: '/favicon.ico?v=3',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png?v=3',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png?v=3',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png?v=3',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png?v=3',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Меню',
        short_name: 'Меню',
        description: 'Посмотреть меню и сделать заказ',
        url: '/menu',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Корзина',
        short_name: 'Корзина',
        description: 'Перейти в корзину',
        url: '/cart',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Мои заказы',
        short_name: 'Заказы',
        description: 'История заказов',
        url: '/orders',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
