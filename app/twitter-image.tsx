import { ImageResponse } from 'next/og'

// Размер изображения для Twitter
export const size = {
  width: 1200,
  height: 600,
}

export const contentType = 'image/png'

// Генерация Twitter изображения
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #d62300 0%, #a01800 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
          padding: '50px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '25px',
            marginBottom: '35px',
          }}
        >
          <div style={{ fontSize: 140 }}>🍗</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: 70, fontWeight: 900, letterSpacing: '-2px' }}>
              Miss Kurochka
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, opacity: 0.9 }}>
              Мисс Курочка Бишкек
            </div>
          </div>
        </div>
        
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.3,
            opacity: 0.95,
          }}
        >
          Хрустящая корейская курочка и бургеры с доставкой
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
