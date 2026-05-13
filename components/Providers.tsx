'use client'

import { ReactNode } from 'react'
import SessionProvider from '@/components/SessionProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
