'use client'

import { useState, useEffect } from 'react'

interface QuantityCounterProps {
  quantity: number
  onUpdate: (newQuantity: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function QuantityCounter({ 
  quantity, 
  onUpdate, 
  disabled = false,
  size = 'md' 
}: QuantityCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayQuantity, setDisplayQuantity] = useState(quantity)

  useEffect(() => {
    if (quantity !== displayQuantity) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setDisplayQuantity(quantity)
        setIsAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [quantity, displayQuantity])

  const handleDecrease = () => {
    if (disabled || quantity <= 0) return
    onUpdate(quantity - 1)
  }

  const handleIncrease = () => {
    if (disabled) return
    onUpdate(quantity + 1)
  }

  const sizeClasses = {
    sm: {
      button: 'w-6 h-6',
      text: 'w-6 text-sm',
      icon: 'w-3 h-3'
    },
    md: {
      button: 'w-8 h-8',
      text: 'w-8 text-base',
      icon: 'w-4 h-4'
    },
    lg: {
      button: 'w-10 h-10',
      text: 'w-10 text-lg',
      icon: 'w-5 h-5'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDecrease}
        disabled={disabled || quantity <= 0}
        className={`${classes.button} flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
      >
        <svg className={`${classes.icon} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <div className={`${classes.text} text-center font-semibold text-gray-900 relative overflow-hidden`}>
        <span 
          className={`block transition-all duration-150 ${
            isAnimating ? 'transform scale-110 opacity-0' : 'transform scale-100 opacity-100'
          }`}
        >
          {displayQuantity}
        </span>
      </div>
      
      <button
        onClick={handleIncrease}
        disabled={disabled}
        className={`${classes.button} flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
      >
        <svg className={`${classes.icon} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  )
}