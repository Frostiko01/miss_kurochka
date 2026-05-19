'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Drumstick,
  Package,
  MapPin,
  Mail,
  Phone as PhoneIcon,
  User as UserIcon,
  ArrowLeft,
  LogOut,
  Pencil,
  Check,
  X,
} from 'lucide-react'

interface User {
  fullName: string
  email: string
  phone?: string | null
  avatarUrl: string | null
  role: string
}

interface ProfileContentProps {
  user: User
}

// Форматирует 9 цифр в "XXX XXX XXX"
function formatPhone(digits: string): string {
  if (!digits) return ''
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  return parts.join(' ')
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const router = useRouter()
  const initials = user.fullName.charAt(0).toUpperCase()

  const [editingPhone, setEditingPhone] = useState(false)
  // Храним только 9 цифр без +996
  const extractDigits = (raw: string | null | undefined) => {
    if (!raw) return ''
    const clean = raw.replace(/\D/g, '')
    // Если начинается с 996 — убираем
    if (clean.startsWith('996') && clean.length > 9) return clean.slice(3)
    return clean.slice(0, 9)
  }
  const [phoneValue, setPhoneValue] = useState(() => extractDigits(user.phone))
  const [saving, setSaving] = useState(false)
  const [savedPhone, setSavedPhone] = useState(() => extractDigits(user.phone))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSavePhone = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    // Формируем полный номер с +996
    const fullPhone = phoneValue ? `+996${phoneValue}` : ''

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await res.json()

      if (res.ok) {
        const newDigits = extractDigits(data.user.phone)
        setSavedPhone(newDigits)
        setPhoneValue(newDigits)
        setEditingPhone(false)
        setSuccess('Номер сохранён')
        setTimeout(() => setSuccess(''), 3000)
        router.refresh()
      } else {
        setError(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      setError('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setPhoneValue(savedPhone)
    setEditingPhone(false)
    setError('')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] py-8 px-4">
      <div className="container-page max-w-3xl">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        {/* Header card */}
        <div className="surface p-6 sm:p-7 mb-5">
          <div className="flex items-center gap-5">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-20 h-20 rounded-full object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-3xl font-extrabold">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight truncate">{user.fullName}</h1>
              <p className="text-sm text-[var(--fg-muted)] truncate">{user.email}</p>
              <span className="badge badge-brand mt-2">
                {user.role === 'customer' ? 'Клиент' : user.role === 'admin' ? 'Администратор' : 'Филиал'}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="surface p-6 sm:p-7 mb-5">
          <h2 className="text-base font-extrabold mb-4">Информация профиля</h2>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-[#fef2f2] border border-[#fee2e2] text-sm text-[var(--brand)] font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-[#ecfdf5] border border-[#d1fae5] text-sm text-[#047857] font-semibold">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Имя" value={user.fullName} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />

            {/* Телефон — редактируемый */}
            <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center text-[var(--fg-muted)]">
                <PhoneIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--fg-subtle)] font-semibold">Телефон</p>
                {editingPhone ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-stretch flex-1 rounded-xl border border-[var(--border-strong)] bg-white overflow-hidden focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--brand)]/10 transition">
                      <div className="flex items-center gap-1.5 px-2.5 bg-[var(--bg-muted)] border-r border-[var(--border)]">
                        <span className="text-sm leading-none">🇰🇬</span>
                        <span className="text-xs font-bold text-[var(--fg)]">+996</span>
                      </div>
                      <input
                        type="tel"
                        value={formatPhone(phoneValue)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                          setPhoneValue(val)
                        }}
                        placeholder="555 123 456"
                        className="flex-1 px-2.5 py-1.5 text-sm font-semibold text-[var(--fg)] placeholder-[var(--fg-subtle)] focus:outline-none bg-transparent font-mono tracking-wider"
                        autoFocus
                        maxLength={11}
                        inputMode="numeric"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePhone()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSavePhone}
                      disabled={saving}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] transition disabled:opacity-50 shrink-0"
                      aria-label="Сохранить"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition disabled:opacity-50 shrink-0"
                      aria-label="Отмена"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate font-mono tracking-wider">
                      {savedPhone ? `+996 ${formatPhone(savedPhone)}` : <span className="text-[var(--fg-subtle)] font-sans">Не указан</span>}
                    </p>
                    <button
                      onClick={() => setEditingPhone(true)}
                      className="p-1 rounded-md hover:bg-[var(--bg-muted)] text-[var(--fg-subtle)] hover:text-[var(--brand)] transition"
                      aria-label="Изменить телефон"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <QuickAction href="/home" icon={<Drumstick className="w-5 h-5" />} title="Меню" subtitle="Перейти к блюдам" />
          <QuickAction href="/orders" icon={<Package className="w-5 h-5" />} title="Заказы" subtitle="История и статусы" />
          <QuickAction href="/cart" icon={<MapPin className="w-5 h-5" />} title="Корзина" subtitle="Оформить заказ" />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="btn btn-secondary w-full"
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center text-[var(--fg-muted)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--fg-subtle)] font-semibold">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Link
      href={href}
      className="card card-hover p-4 flex items-center gap-3 group"
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center group-hover:bg-[var(--brand)] group-hover:text-white transition">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold truncate">{title}</p>
        <p className="text-xs text-[var(--fg-muted)] truncate">{subtitle}</p>
      </div>
    </Link>
  )
}
