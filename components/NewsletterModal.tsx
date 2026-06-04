'use client'

import { useState } from 'react'
import { X, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

interface NewsletterModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEmail('')
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 2000)
      } else {
        setError(data.error || 'Не удалось оформить подписку')
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="surface shadow-lg max-w-md w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Подписка на рассылку
              </h2>
              <p className="text-sm text-[var(--fg-muted)] mt-1">
                Получайте первыми новости о новинках и акциях!
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center transition"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#ecfdf5] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#047857]" />
              </div>
              <p className="text-base font-bold text-center">
                Вы успешно подписались!
              </p>
              <p className="text-sm text-[var(--fg-muted)] text-center mt-1">
                Спасибо за интерес к Miss Kurochka
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fef2f2] border border-[#fee2e2]">
                  <AlertCircle className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--brand)] font-semibold">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="newsletter-email" className="label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none z-10" />
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full"
                    style={{ paddingLeft: '40px' }}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Подписываемся...' : 'Подписаться'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
