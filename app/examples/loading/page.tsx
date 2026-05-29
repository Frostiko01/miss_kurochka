'use client'

import { useState } from 'react'
import Spinner from '@/components/Spinner'
import LoadingScreen from '@/components/LoadingScreen'
import LoadingCard from '@/components/LoadingCard'
import ButtonWithLoading from '@/components/ButtonWithLoading'

export default function LoadingExamplesPage() {
  const [showFullScreen, setShowFullScreen] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)

  const handleButtonClick = () => {
    setButtonLoading(true)
    setTimeout(() => setButtonLoading(false), 2000)
  }

  const handleFullScreenDemo = () => {
    setShowFullScreen(true)
    setTimeout(() => setShowFullScreen(false), 3000)
  }

  if (showFullScreen) {
    return <LoadingScreen message="Демонстрация полноэкранной загрузки..." />
  }

  return (
    <div className="min-h-screen bg-[var(--bg-muted)] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-2">Компоненты загрузки</h1>
        <p className="text-[var(--fg-muted)] mb-8">
          Примеры использования спиннеров и индикаторов загрузки
        </p>

        {/* Базовые спиннеры */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">1. Базовый Spinner</h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <Spinner size="sm" />
              <p className="text-xs text-[var(--fg-muted)] mt-2">Small (16px)</p>
            </div>
            <div className="text-center">
              <Spinner size="md" />
              <p className="text-xs text-[var(--fg-muted)] mt-2">Medium (32px)</p>
            </div>
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-xs text-[var(--fg-muted)] mt-2">Large (48px)</p>
            </div>
            <div className="text-center">
              <Spinner size="xl" />
              <p className="text-xs text-[var(--fg-muted)] mt-2">XLarge (64px)</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[var(--bg-muted)] rounded-lg">
            <code className="text-sm">
              {`<Spinner size="md" />`}
            </code>
          </div>
        </section>

        {/* LoadingScreen */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">2. LoadingScreen</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-4">
            Полноэкранная или контейнерная загрузка
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleFullScreenDemo}
              className="btn btn-primary"
            >
              Показать полноэкранную загрузку
            </button>

            <div className="border-2 border-dashed border-[var(--border)] rounded-lg overflow-hidden">
              <LoadingScreen message="Загрузка в контейнере..." fullScreen={false} />
            </div>
          </div>

          <div className="mt-6 p-4 bg-[var(--bg-muted)] rounded-lg">
            <code className="text-sm">
              {`<LoadingScreen message="Загрузка..." fullScreen={true} />`}
            </code>
          </div>
        </section>

        {/* LoadingCard */}
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-4">3. LoadingCard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LoadingCard message="Загрузка меню..." />
            <LoadingCard message="Загрузка заказов..." />
            <LoadingCard message="Загрузка данных..." />
          </div>
          <div className="mt-6 card p-4">
            <code className="text-sm">
              {`<LoadingCard message="Загрузка..." height="h-64" />`}
            </code>
          </div>
        </section>

        {/* ButtonWithLoading */}
        <section className="card p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">4. ButtonWithLoading</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-4">
            Кнопки с индикатором загрузки
          </p>
          
          <div className="flex flex-wrap gap-4">
            <ButtonWithLoading
              loading={buttonLoading}
              onClick={handleButtonClick}
              variant="primary"
              size="lg"
            >
              Primary Large
            </ButtonWithLoading>

            <ButtonWithLoading
              loading={buttonLoading}
              onClick={handleButtonClick}
              variant="secondary"
            >
              Secondary Medium
            </ButtonWithLoading>

            <ButtonWithLoading
              loading={buttonLoading}
              onClick={handleButtonClick}
              variant="ghost"
              size="sm"
            >
              Ghost Small
            </ButtonWithLoading>

            <ButtonWithLoading
              loading={true}
              variant="primary"
            >
              Всегда загружается
            </ButtonWithLoading>
          </div>

          <div className="mt-6 p-4 bg-[var(--bg-muted)] rounded-lg">
            <code className="text-sm">
              {`<ButtonWithLoading loading={isLoading} variant="primary">
  Отправить
</ButtonWithLoading>`}
            </code>
          </div>
        </section>

        {/* Практические примеры */}
        <section className="card p-8">
          <h2 className="text-xl font-bold mb-4">5. Практические примеры</h2>
          
          <div className="space-y-6">
            {/* Пример 1: Форма с загрузкой */}
            <div>
              <h3 className="font-semibold mb-2">Форма заказа</h3>
              <div className="card p-6 bg-[var(--bg-muted)]">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  className="input mb-3"
                />
                <input
                  type="tel"
                  placeholder="Телефон"
                  className="input mb-4"
                />
                <ButtonWithLoading
                  loading={buttonLoading}
                  onClick={handleButtonClick}
                  variant="primary"
                  className="w-full"
                >
                  Оформить заказ
                </ButtonWithLoading>
              </div>
            </div>

            {/* Пример 2: Список с загрузкой */}
            <div>
              <h3 className="font-semibold mb-2">Список товаров</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <span className="text-sm">Загрузка товара 1...</span>
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <span className="text-sm">Загрузка товара 2...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
