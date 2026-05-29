'use client'

import Spinner from './Spinner'

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
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-sm text-[var(--fg-muted)] animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
