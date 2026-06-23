'use client'

export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Мисс Курочка',
    alternateName: 'Miss Kurochka',
    image: '/logo.png',
    '@id': 'https://miss-kurochka.com',
    url: 'https://miss-kurochka.com',
    telephone: '+996-XXX-XXX-XXX', // Замените на реальный номер
    priceRange: '$$',
    servesCuisine: ['Корейская кухня', 'Фастфуд'],
    menu: 'https://miss-kurochka.com/menu',
    acceptsReservations: 'False',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Бишкек', // Добавьте конкретный адрес
      addressLocality: 'Бишкек',
      addressRegion: 'Чуйская область',
      addressCountry: 'KG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 42.8746, // Координаты Бишкека
      longitude: 74.5698,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '10:00',
        closes: '23:00',
      },
    ],
    sameAs: [
      // Добавьте ссылки на соцсети
      // 'https://www.instagram.com/miss_kurochka',
      // 'https://www.facebook.com/miss_kurochka',
    ],
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: 'https://miss-kurochka.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Меню',
        item: 'https://miss-kurochka.com/menu',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Филиалы',
        item: 'https://miss-kurochka.com/branches',
      },
    ],
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Мисс Курочка',
    alternateName: 'Miss Kurochka',
    url: 'https://miss-kurochka.com',
    logo: 'https://miss-kurochka.com/logo.png',
    description: 'Сеть заведений быстрого питания с доставкой в Бишкеке. Специализация: корейская хрустящая курочка, бургеры, картофель фри.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+996-XXX-XXX-XXX', // Замените на реальный номер
      contactType: 'Customer Service',
      areaServed: 'KG',
      availableLanguage: ['Russian', 'Kyrgyz'],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
    </>
  )
}
