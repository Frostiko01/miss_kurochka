'use client'

import { Heart } from 'lucide-react'
import ComingSoon from '@/components/ComingSoon'

export default function FavoritesPage() {
  return (
    <ComingSoon
      title="Избранное"
      description="Сохраняйте любимые блюда в избранное, чтобы заказывать их быстрее. Раздел в разработке."
      icon={<Heart className="w-8 h-8" />}
    />
  )
}
