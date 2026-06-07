'use client'

import PanLoader from './PanLoader'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingScreen({ 
  message = 'Загрузка...', 
  fullScreen = true 
}: LoadingScreenProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 bg-[var(--bg)] z-50'
    : 'w-full py-20'

  return (
    <div className={`${containerClass} flex flex-col items-center justify-center`}>
      <PanLoader size={120} text={message || undefined} />
    </div>
  )
}
