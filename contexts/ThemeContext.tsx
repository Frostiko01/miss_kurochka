'use client'

import { createContext, useContext, ReactNode } from 'react'

type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
})

/**
 * Светлая тема — единственная для пользовательской части.
 * Контекст оставлен для обратной совместимости с компонентами,
 * которые ещё используют useTheme().
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
