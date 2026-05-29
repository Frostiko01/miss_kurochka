'use client'

import Spinner from './Spinner'

interface ButtonWithLoadingProps {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ButtonWithLoading({
  children,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = ''
}: ButtonWithLoadingProps) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost'
  }[variant]

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  }[size]

  const spinnerSize = {
    sm: 'sm' as const,
    md: 'sm' as const,
    lg: 'md' as const
  }[size]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${className} ${
        (disabled || loading) ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      {loading && <Spinner size={spinnerSize} />}
      {children}
    </button>
  )
}
