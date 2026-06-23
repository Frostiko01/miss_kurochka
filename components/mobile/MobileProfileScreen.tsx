'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { signOutWithCartCleanup } from '@/lib/cart-utils'
import {
  ChevronRight,
  MapPin,
  Bell,
  Settings,
  HelpCircle,
  Building2,
  Receipt,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MobileSubScreen from './MobileSubScreen'

interface User {
  fullName: string
  email: string
  phone?: string | null
  avatarUrl: string | null
  role: string
}

interface ListItem {
  href: string
  label: string
  icon: LucideIcon
  helper?: string
}

interface Group {
  title?: string
  items: ListItem[]
}

// Только аккаунт и помощь — без дублей (заказы/адреса/филиалы уже в быстрых кнопках)
const groups: Group[] = [
  {
    title: 'Аккаунт',
    items: [
      { href: '/notifications', label: 'Уведомления', icon: Bell },
      { href: '/settings', label: 'Настройки', icon: Settings },
    ],
  },
  {
    title: 'Помощь',
    items: [{ href: '/support', label: 'Поддержка', icon: HelpCircle }],
  },
]

export default function MobileProfileScreen({ user }: { user: User }) {
  const router = useRouter()
  const initials = (user.fullName?.trim()?.[0] ?? 'U').toUpperCase()

  return (
    <MobileSubScreen title="Профиль" back={false}>
      <div className="px-4 pt-4 pb-6">
        {/* User card */}
        <button
          onClick={() => {}}
          className="w-full flex items-center gap-4 p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow: 'var(--shadow-brand)',
          }}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white/20 shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-extrabold text-xl">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-base font-extrabold text-white truncate">{user.fullName}</p>
            <p className="text-xs text-white/85 font-semibold truncate mt-0.5">{user.email}</p>
            {user.phone && (
              <p className="text-xs text-white/75 font-semibold truncate mt-0.5">{user.phone}</p>
            )}
          </div>
        </button>

        {/* Quick actions — 3 кнопки в ряд */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <QuickStat icon={Receipt} label="Заказы" onClick={() => router.push('/orders')} />
          <QuickStat icon={MapPin} label="Адреса" onClick={() => router.push('/addresses')} />
          <QuickStat icon={Building2} label="Филиалы" onClick={() => router.push('/branches')} />
        </div>

        {/* Groups — только аккаунт и помощь */}
        <div className="mt-6 space-y-5">
          {groups.map((group, gi) => (
            <section key={gi}>
              {group.title && (
                <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--fg-subtle)] mb-2 px-1">
                  {group.title}
                </h2>
              )}
              <div className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden">
                {group.items.map((it, idx) => (
                  <Row key={idx} item={it} onClick={() => router.push(it.href)} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOutWithCartCleanup(signOut, '/')}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-[var(--border)] text-sm font-bold text-[#dc2626] active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </button>

        <p className="text-center text-[11px] text-[var(--fg-subtle)] font-semibold mt-4">
          Miss Kurochka · v1.0
        </p>
      </div>
    </MobileSubScreen>
  )
}

function QuickStat({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-[var(--border)] active:scale-95 transition-transform"
    >
      <span className="w-9 h-9 rounded-full bg-[var(--brand-soft)] flex items-center justify-center">
        <Icon className="w-[18px] h-[18px] text-[var(--brand)]" strokeWidth={2.2} />
      </span>
      <span className="text-[11px] font-bold text-[var(--fg)]">{label}</span>
    </button>
  )
}

function Row({ item, onClick }: { item: ListItem; onClick: () => void }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[var(--bg-muted)] transition-colors text-left border-b border-[var(--border)] last:border-0"
    >
      <span className="w-9 h-9 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px] text-[var(--fg)]" strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-[var(--fg)] truncate">{item.label}</span>
        {item.helper && (
          <span className="block text-[11px] text-[var(--fg-subtle)] font-semibold truncate mt-0.5">
            {item.helper}
          </span>
        )}
      </span>
      <ChevronRight className="w-4 h-4 text-[var(--fg-subtle)] shrink-0" />
    </button>
  )
}
