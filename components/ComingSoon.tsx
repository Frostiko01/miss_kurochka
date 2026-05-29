'use client'

import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'
import MobileSubScreen from '@/components/mobile/MobileSubScreen'

interface ComingSoonProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  const text = description ?? 'Раздел в разработке. Скоро здесь появится новый функционал.'

  const Body = (
    <div className="w-full max-w-md text-center px-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mb-5">
        {icon ?? <Construction className="w-8 h-8" />}
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-[var(--fg-muted)] mb-6">{text}</p>
    </div>
  )

  return (
    <>
      {/* Mobile */}
      <MobileSubScreen title={title}>
        <div className="flex items-center justify-center min-h-[60vh]">{Body}</div>
      </MobileSubScreen>

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen bg-[var(--bg-muted)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mb-5">
            {icon ?? <Construction className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">{title}</h1>
          <p className="text-sm text-[var(--fg-muted)] mb-6">{text}</p>
          <Link href="/" className="btn btn-primary inline-flex">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
        </div>
      </div>
    </>
  )
}
