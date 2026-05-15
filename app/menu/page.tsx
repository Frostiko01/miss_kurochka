'use client'

import { UtensilsCrossed } from 'lucide-react'
import ComingSoon from '@/components/ComingSoon'

export default function MenuPage() {
  return (
    <ComingSoon
      title="Меню"
      description="Полное меню с категориями скоро появится. Пока вы можете заказать популярные блюда с главной страницы."
      icon={<UtensilsCrossed className="w-8 h-8" />}
    />
  )
}
