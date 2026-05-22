'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, Bot, User, Sparkles, RotateCcw, ChevronDown } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AiChatModalProps {
  isOpen: boolean
  onClose: () => void
}

const QUICK_QUESTIONS = [
  'Что посоветуете попробовать?',
  'Есть ли вегетарианские блюда?',
  'Какие комбо-наборы есть?',
  'Как сделать доставку?',
]

export default function AiChatModal({ isOpen, onClose }: AiChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // ── Приветствие при первом открытии ────────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Привет! 👋 Я ИИ-помощник Miss Kurochka. Помогу выбрать блюдо, расскажу о составе или отвечу на любой вопрос о нашем ресторане. Что вас интересует?',
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen])

  // ── Блокируем скролл ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  // ── Escape ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  // ── Скролл вниз при новых сообщениях ───────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // ── Фокус на input ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, loading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distanceFromBottom > 100)
  }

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMessage: Message = { role: 'user', content, timestamp: new Date() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()

      console.log('📥 Ответ от API:', { status: res.status, data })

      if (res.ok) {
        if (data.reply) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: data.reply, timestamp: new Date() },
          ])
        } else {
          console.error('❌ Нет поля reply в ответе:', data)
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: 'Ошибка: получен некорректный ответ от сервера', timestamp: new Date() },
          ])
        }
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Ошибка: ${data.error ?? 'Попробуйте ещё раз'}`, timestamp: new Date() },
        ])
      }
    } catch (error) {
      console.error('❌ Ошибка при запросе к ИИ:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Не удалось подключиться. Проверьте интернет и попробуйте снова.', timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Привет! 👋 Я ИИ-помощник Miss Kurochka. Помогу выбрать блюдо, расскажу о составе или отвечу на любой вопрос о нашем ресторане. Что вас интересует?',
        timestamp: new Date(),
      },
    ])
    setInput('')
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full flex flex-col bg-white overflow-hidden"
        style={{
          maxWidth: 480,
          height: '90vh',
          maxHeight: 700,
          borderRadius: '20px 20px 0 0',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ══ ШАПКА ══════════════════════════════════════════════════════════ */}
        <div
          className="flex items-center gap-3 px-4 py-4 shrink-0"
          style={{ background: 'linear-gradient(135deg, #111 0%, #d62300 100%)' }}
        >
          {/* Аватар */}
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-sm leading-tight">ИИ Поддержка</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-[11px] font-semibold">Miss Kurochka · GPT-4o mini</span>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={resetChat}
              title="Новый чат"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition"
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

        {/* ══ СООБЩЕНИЯ ══════════════════════════════════════════════════════ */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ background: '#f8f8f9' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Аватар */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant'
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg, #111 0%, #d62300 100%)' } : {}}
              >
                {msg.role === 'assistant'
                  ? <Bot className="w-4 h-4" />
                  : <User className="w-4 h-4" />
                }
              </div>

              {/* Пузырь */}
              <div className={`flex flex-col gap-1 max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                  }`}
                  style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #d62300 0%, #b01e00 100%)' } : {}}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Анимация набора */}
          {loading && (
            <div className="flex gap-2.5 flex-row">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                style={{ background: 'linear-gradient(135deg, #111 0%, #d62300 100%)' }}
              >
                <Bot className="w-4 h-4" />
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
            onClick={scrollToBottom}
            className="absolute right-4 bottom-24 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition z-10"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* ══ БЫСТРЫЕ ВОПРОСЫ (только если 1 сообщение — приветствие) ══════ */}
        {messages.length === 1 && !loading && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-white border-t border-gray-100">
            <div className="flex gap-2 py-3 min-w-max">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition"
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
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ ПОЛЕ ВВОДА ══════════════════════════════════════════════════════ */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              disabled={loading}
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
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition text-white disabled:opacity-40"
              style={{ background: !input.trim() || loading ? '#ccc' : 'linear-gradient(135deg, #d62300 0%, #b01e00 100%)' }}
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
