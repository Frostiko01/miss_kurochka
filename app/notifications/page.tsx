'use client'

import { Bell } from 'lucide-react'
import ComingSoon from '@/components/ComingSoon'

export default function NotificationsPage() {
  return (
    <ComingSoon
      title="Уведомления"
      description="Здесь будут отображаться все уведомления о ваших заказах и акциях."
      icon={<Bell className="w-8 h-8" />}
    />
  )
}
