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
        src: '/favicon/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon/web-app-manifest-512x512.png',
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
        icons: [{ src: '/favicon/web-app-manifest-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Корзина',
        short_name: 'Корзина',
        description: 'Перейти в корзину',
        url: '/cart',
        icons: [{ src: '/favicon/web-app-manifest-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Мои заказы',
        short_name: 'Заказы',
        description: 'История заказов',
        url: '/orders',
        icons: [{ src: '/favicon/web-app-manifest-192x192.png', sizes: '192x192' }],
      },
    ],
  }
}
