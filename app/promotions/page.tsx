'use client'

import { Tag } from 'lucide-react'
import ComingSoon from '@/components/ComingSoon'

export default function PromotionsPage() {
  return (
    <ComingSoon
      title="Акции"
      description="Все акции, скидки и специальные предложения будут собраны в этом разделе."
      icon={<Tag className="w-8 h-8" />}
    />
  )
}
