'use client'

import { Settings } from 'lucide-react'
import ComingSoon from '@/components/ComingSoon'

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Настройки"
      description="Управление параметрами аккаунта, языком и приватностью. Раздел в разработке."
      icon={<Settings className="w-8 h-8" />}
    />
  )
}
