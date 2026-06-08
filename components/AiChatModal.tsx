'use client'

import React from 'react'
import Image from 'next/image'
import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Send, User, RotateCcw, ChevronDown, Star, Flame, Package, Leaf, ShoppingCart, MapPin } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AiChatModalProps {
  isOpen: boolean
  onClose: () => void
}

const WELCOME_TEXT =
  'Привет! 👋 Я ИИ-помощник Miss Kurochka.\n\nЗнаю всё о нашем меню — цены, состав, новинки, акции. Помогу выбрать блюдо и оформить заказ. Спрашивайте!'

const QUICK_QUESTIONS: { icon: React.ReactNode; text: string }[] = [
  { icon: <Star className="w-3 h-3" />,        text: 'Что у вас новенького?' },
  { icon: <Flame className="w-3 h-3" />,       text: 'Что посоветуете попробовать?' },
  { icon: <Package className="w-3 h-3" />,     text: 'Какие комбо-наборы есть?' },
  { icon: <Leaf className="w-3 h-3" />,        text: 'Есть вегетарианские блюда?' },
  { icon: <ShoppingCart className="w-3 h-3" />,text: 'Как сделать заказ?' },
  { icon: <MapPin className="w-3 h-3" />,      text: 'Адреса и время работы' },
]

export default function AiChatModal({ isOpen, onClose }: AiChatModalProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'assistant', content: WELCOME_TEXT, timestamp: new Date() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)        // ждём первый токен
  const [streaming, setStreaming] = useState(false)     // идёт генерация
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  // Высота видимой области (учитывает клавиатуру) — для мобильных
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Прилипание к низу: если пользователь сам не отскроллил вверх — автоскроллим
  const stickToBottomRef = useRef(true)
  // Аккумулятор текста текущего стримингового ответа (мутабельный, вне рендера)
  const streamAccRef = useRef('')

  // ── Приветствие при первом открытии ────────────────────────────────────
  // Инициализируем сразу в useState (см. выше), отдельный эффект не нужен.

  // ── Блокируем скролл фона ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isOpen])

  // ── Escape ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  // ── Visual Viewport API: подстраиваем высоту окна под клавиатуру ─────────
  // Когда появляется системная клавиатура, visualViewport.height уменьшается.
  // Мы фиксируем высоту контейнера под это значение, чтобы header и поле ввода
  // всегда оставались видимыми, а скролл работал только внутри сообщений.
  useEffect(() => {
    if (!isOpen) return
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return  // нет Visual Viewport API — остаёмся на 100dvh

    const update = () => {
      setViewportHeight(vv.height)
      // Держим окно прижатым к верху видимой области, чтобы iOS не уезжал вверх
      window.scrollTo(0, 0)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [isOpen])

  // ── Автоскролл вниз ───────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  // Скроллим при изменении сообщений, если пользователь «прилип» к низу
  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollToBottom('smooth')
    }
  }, [messages, scrollToBottom])

  // При изменении высоты вьюпорта (открытие клавиатуры) — доскроллить вниз
  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollToBottom('auto')
    }
  }, [viewportHeight, scrollToBottom])

  // ── Фокус на input ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !loading && !streaming) {
      const t = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [isOpen, loading, streaming])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < 80
    setShowScrollBtn(distanceFromBottom > 100)
  }

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading || streaming) return

    const userMessage: Message = { role: 'user', content, timestamp: new Date() }
    const baseMessages = [...messages, userMessage]
    setMessages(baseMessages)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)
    stickToBottomRef.current = true

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: baseMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) {
        let errText = 'Попробуйте ещё раз'
        try {
          const data = await res.json()
          errText = data.error ?? errText
        } catch { /* ответ не JSON */ }
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Ошибка: ${errText}`, timestamp: new Date() },
        ])
        return
      }

      // Стартуем чтение потока. Создаём пустое сообщение ассистента и наполняем его.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      streamAccRef.current = ''
      let started = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (!chunk) continue
        streamAccRef.current += chunk
        const text = streamAccRef.current

        if (!started) {
          started = true
          setLoading(false)
          setStreaming(true)
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: text, timestamp: new Date() },
          ])
        } else {
          setMessages(prev => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: text }
            }
            return next
          })
        }
      }

      // Поток мог завершиться без единого токена
      if (!started) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Пустой ответ. Попробуйте ещё раз 🤔', timestamp: new Date() },
        ])
      }
    } catch (error) {
      console.error('Ошибка при запросе к ИИ:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Не удалось подключиться. Проверьте интернет и попробуйте снова.', timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    if (loading || streaming) return
    setMessages([{ role: 'assistant', content: WELCOME_TEXT, timestamp: new Date() }])
    setInput('')
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (!isOpen) return null

  const busy = loading || streaming

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full flex flex-col bg-white overflow-hidden sm:rounded-[20px]"
        style={{
          maxWidth: 480,
          // На мобильных используем фактическую высоту видимой области (с учётом
          // клавиатуры). На десктопе/sm — ограниченная высота карточки.
          height: viewportHeight ? `${viewportHeight}px` : '100dvh',
          maxHeight: viewportHeight ? `${viewportHeight}px` : 700,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ══ ШАПКА (фиксирована сверху) ═══════════════════════════════════════ */}
        <div
          className="flex items-center gap-3 px-4 py-4 shrink-0"
          style={{ background: 'linear-gradient(135deg, #111 0%, #d62300 100%)' }}
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/25 overflow-hidden">
            <Image src="/logo.png" alt="Miss Kurochka" width={40} height={40} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-sm leading-tight">ИИ Поддержка</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-[11px] font-semibold">Miss Kurochka · GPT-4o mini</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={resetChat}
              disabled={busy}
              title="Новый чат"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Закрыть"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ══ СООБЩЕНИЯ (единственная скроллируемая область) ══════════════════ */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
          style={{ background: '#f8f8f9', WebkitOverflowScrolling: 'touch' }}
        >
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1
            const showCaret = streaming && isLast && msg.role === 'assistant'
            return (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                    msg.role === 'assistant' ? '' : 'bg-gray-200 text-gray-600'
                  }`}
                  style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg, #111 0%, #d62300 100%)' } : {}}
                >
                  {msg.role === 'assistant'
                    ? <Image src="/logo.png" alt="Miss Kurochka" width={32} height={32} className="w-full h-full object-cover" />
                    : <User className="w-4 h-4" />
                  }
                </div>

                <div className={`flex flex-col gap-1 max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                    }`}
                    style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #d62300 0%, #b01e00 100%)' } : {}}
                  >
                    {msg.content}
                    {showCaret && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-gray-400 animate-pulse rounded-sm" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Индикатор «думает» — пока не пришёл первый токен */}
          {loading && (
            <div className="flex gap-2.5 flex-row">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #111 0%, #d62300 100%)' }}
              >
                <Image src="/logo.png" alt="Miss Kurochka" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Кнопка прокрутки вниз */}
        {showScrollBtn && (
          <button
            onClick={() => { stickToBottomRef.current = true; scrollToBottom('smooth') }}
            className="absolute right-4 bottom-28 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition z-10"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* ══ БЫСТРЫЕ ВОПРОСЫ (только при приветствии) ════════════════════════ */}
        {messages.length === 1 && !busy && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-white border-t border-gray-100">
            <div className="flex gap-2 py-3 min-w-max">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.text)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                  style={{ borderColor: '#d62300', color: '#d62300' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.background = '#d62300'
                    el.style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = ''
                    el.style.color = '#d62300'
                  }}
                >
                  {q.icon}
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ ПОЛЕ ВВОДА (фиксировано снизу) ══════════════════════════════════ */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              disabled={busy}
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:bg-white transition disabled:opacity-50"
              style={{ maxHeight: 120, lineHeight: '1.5' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || busy}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition text-white disabled:opacity-40"
              style={{ background: !input.trim() || busy ? '#ccc' : 'linear-gradient(135deg, #d62300 0%, #b01e00 100%)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Enter — отправить · Shift+Enter — новая строка
          </p>
        </div>
      </div>
    </div>
  )
}
