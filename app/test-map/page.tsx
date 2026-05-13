'use client'

import DeliveryMap from '@/components/DeliveryMap'

export default function TestMapPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тест карты доставки</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Карта с адресом</h2>
            <DeliveryMap 
              address="Чуй проспект 123, Бишкек"
              height="400px"
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Карта без адреса</h2>
            <DeliveryMap 
              address=""
              height="300px"
            />
          </div>
        </div>
      </div>
    </div>
  )
}