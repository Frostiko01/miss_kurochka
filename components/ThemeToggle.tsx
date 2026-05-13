'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(214, 35, 0, 0.1)'
      }}
      title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      <span className="text-2xl sm:text-3xl">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
