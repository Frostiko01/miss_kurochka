'use client'

import Spinner from './Spinner'

interface LoadingCardProps {
  message?: string
  height?: string
}

export default function LoadingCard({ 
  message = 'Загрузка...', 
  height = 'h-64' 
}: LoadingCardProps) {
  return (
    <div className={`card ${height} flex flex-col items-center justify-center gap-3`}>
      <Spinner size="lg" />
      <p className="text-sm text-[var(--fg-muted)]">{message}</p>
    </div>
  )
}
