'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Drumstick, Package, MapPin, Mail, Phone as PhoneIcon, User as UserIcon, ArrowLeft, LogOut } from 'lucide-react'

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

export default function ProfileContent({ user }: ProfileContentProps) {
  const initials = user.fullName.charAt(0).toUpperCase()

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
          <div className="space-y-3">
            <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Имя" value={user.fullName} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
            <InfoRow icon={<PhoneIcon className="w-4 h-4" />} label="Телефон" value={user.phone || 'Не указан'} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <QuickAction href="/" icon={<Drumstick className="w-5 h-5" />} title="Меню" subtitle="Перейти к блюдам" />
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
