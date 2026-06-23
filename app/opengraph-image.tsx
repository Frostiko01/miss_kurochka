import { ImageResponse } from 'next/og'

// Размер изображения для Open Graph
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Генерация Open Graph изображения
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: 'linear-gradient(135deg, #d62300 0%, #a01800 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '30px',
            marginBottom: '40px',
          }}
        >
          {/* Эмодзи курицы как временный логотип */}
          <div style={{ fontSize: 160 }}>🍗</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: '-2px' }}>
              Miss Kurochka
            </div>
            <div style={{ fontSize: 36, fontWeight: 600, opacity: 0.9 }}>
              Мисс Курочка
            </div>
          </div>
        </div>
        
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
            opacity: 0.95,
          }}
        >
          Хрустящая корейская курочка и бургеры с доставкой в Бишкеке
        </div>
        
        <div
          style={{
            fontSize: 24,
            marginTop: '30px',
            padding: '15px 40px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50px',
            fontWeight: 700,
          }}
        >
          Янгнём • Кандян • Бургеры • Картофель Фри
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
