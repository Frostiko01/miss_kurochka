'use client'

import { ReactNode } from 'react'
import SessionProvider from '@/components/SessionProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import MobileLayout from '@/components/mobile/MobileLayout'
import FavoritesCleaner from '@/components/FavoritesCleaner'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <FavoritesCleaner />
        <MobileLayout>{children}</MobileLayout>
      </ThemeProvider>
    </SessionProvider>
  )
}
