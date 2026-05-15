'use client'

import { MapPin } from 'lucide-react'
import ComingSoon from '@/components/ComingSoon'

export default function AddressesPage() {
  return (
    <ComingSoon
      title="Мои адреса"
      description="Управление сохранёнными адресами доставки. Раздел в разработке."
      icon={<MapPin className="w-8 h-8" />}
    />
  )
}
