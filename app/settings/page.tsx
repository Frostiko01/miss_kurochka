'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Phone, Check, X, KeyRound, Eye, EyeOff } from 'lucide-react'
import MobileSubScreen from '@/components/mobile/MobileSubScreen'

function formatPhone(digits: string): string {
  if (!digits) return ''
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  return parts.join(' ')
}

function extractDigits(raw: string | null | undefined): string {
  if (!raw) return ''
  const clean = raw.replace(/\D/g, '')
  if (clean.startsWith('996') && clean.length > 9) return clean.slice(3)
  return clean.slice(0, 9)
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/settings')
      return
    }
    if (session?.user) {
      setFullName(session.user.fullName ?? '')
      setPhone(extractDigits(session.user.phone))
    }
  }, [status, session, router])

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone ? `+996${phone}` : '',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg({ text: 'Сохранено', ok: true })
        await update({ fullName: data.user.fullName, phone: data.user.phone })
        setTimeout(() => setProfileMsg(null), 3000)
      } else {
        setProfileMsg({ text: data.error || 'Ошибка', ok: false })
      }
    } catch {
      setProfileMsg({ text: 'Ошибка сети', ok: false })
    }
    setSavingProfile(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ text: 'Заполните все поля', ok: false })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Пароли не совпадают', ok: false })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Минимум 6 символов', ok: false })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMsg({ text: 'Пароль изменён', ok: true })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordMsg(null), 3000)
      } else {
        setPasswordMsg({ text: data.error || 'Ошибка', ok: false })
      }
    } catch {
      setPasswordMsg({ text: 'Ошибка сети', ok: false })
    }
    setSavingPassword(false)
  }

  const profileChanged =
    fullName.trim() !== (session?.user?.fullName ?? '') ||
    phone !== extractDigits(session?.user?.phone)

  const content = (
    <div className="px-4 pt-3 space-y-5">
      {/* Личные данные */}
      <section className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-extrabold text-[var(--fg)]">Личные данные</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Имя */}
          <div>
            <label className="text-xs font-bold text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Имя
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-muted)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition"
              style={{ color: 'var(--fg)' }}
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="text-xs font-bold text-[var(--fg-muted)] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Телефон
            </label>
            <div className="flex items-center rounded-xl overflow-hidden bg-[var(--bg-muted)]">
              <span className="px-3 py-2.5 text-sm font-bold text-[var(--fg-muted)] shrink-0 border-r border-[var(--border)]">
                +996
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={formatPhone(phone)}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="555 123 456"
                className="flex-1 px-3 py-2.5 text-sm font-semibold bg-transparent focus:outline-none"
                style={{ color: 'var(--fg)' }}
                maxLength={11}
              />
            </div>
          </div>

          {/* Сообщение */}
          {profileMsg && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: profileMsg.ok ? '#ecfdf5' : '#fef2f2',
                color: profileMsg.ok ? '#047857' : '#dc2626',
              }}
            >
              {profileMsg.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || !profileChanged}
            className="w-full py-2.5 rounded-xl text-sm font-extrabold text-white transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: 'var(--brand)' }}
          >
            {savingProfile ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </section>

      {/* Смена пароля */}
      <section className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-extrabold text-[var(--fg)] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[var(--fg-muted)]" />
            Смена пароля
          </h2>
        </div>
        <div className="p-4 space-y-3">
          {/* Текущий пароль */}
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Текущий пароль"
              className="w-full px-3 py-2.5 pr-10 rounded-xl bg-[var(--bg-muted)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition"
              style={{ color: 'var(--fg)' }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Новый пароль */}
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Новый пароль (мин. 6 символов)"
              className="w-full px-3 py-2.5 pr-10 rounded-xl bg-[var(--bg-muted)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition"
              style={{ color: 'var(--fg)' }}
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Подтверждение */}
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Повторите новый пароль"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-muted)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition"
            style={{ color: 'var(--fg)' }}
          />

          {/* Сообщение */}
          {passwordMsg && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: passwordMsg.ok ? '#ecfdf5' : '#fef2f2',
                color: passwordMsg.ok ? '#047857' : '#dc2626',
              }}
            >
              {passwordMsg.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {passwordMsg.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-2.5 rounded-xl text-sm font-extrabold text-white transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: 'var(--brand)' }}
          >
            {savingPassword ? 'Сохранение...' : 'Изменить пароль'}
          </button>
        </div>
      </section>

      {/* Email (только просмотр) */}
      <section className="rounded-2xl bg-white border border-[var(--border)] p-4">
        <p className="text-xs font-bold text-[var(--fg-muted)] mb-1">Email</p>
        <p className="text-sm font-semibold text-[var(--fg)]">
          {session?.user?.email ?? '—'}
        </p>
        <p className="text-[11px] text-[var(--fg-subtle)] mt-1">
          Email нельзя изменить
        </p>
      </section>
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <MobileSubScreen title="Настройки">
        {content}
      </MobileSubScreen>

      {/* Desktop */}
      <div className="hidden md:block min-h-screen bg-[var(--bg-muted)] py-8 px-4">
        <div className="container-page max-w-xl">{content}</div>
      </div>
    </>
  )
}
