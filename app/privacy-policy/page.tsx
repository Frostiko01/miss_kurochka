import Link from 'next/link'
import Image from 'next/image'
import { Shield, Lock, Eye, FileText, Mail, Phone, MapPin, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Политика конфиденциальности | Miss Kurochka',
  description: 'Политика конфиденциальности Miss Kurochka. Защита персональных данных в соответствии с законодательством Кыргызской Республики.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Miss Kurochka" width={40} height={40} className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[var(--brand)] leading-none">
                Miss Kurochka
              </h1>
              <p className="text-xs text-[var(--fg-subtle)] hidden sm:block">Самая вкусная курочка</p>
            </div>
          </Link>
          <Link href="/" className="btn btn-secondary btn-sm">
            На главную
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-[var(--brand-soft)] via-white to-[var(--brand-tint)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand)] text-white text-sm font-bold mb-6">
            <Shield className="w-4 h-4" />
            Ваша конфиденциальность важна для нас
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-5 leading-tight">
            Политика конфиденциальности
          </h1>
          <p className="text-lg text-[var(--fg-muted)] max-w-2xl mx-auto">
            Мы обязуемся защищать и уважать вашу конфиденциальность в соответствии с законодательством Кыргызской Республики
          </p>
          <p className="text-sm text-[var(--fg-subtle)] mt-4">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Основная информация */}
          <div className="card p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">1. Общие положения</h2>
                <p className="text-[var(--fg-muted)]">
                  Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса Miss Kurochka (далее — «Сервис»).
                </p>
              </div>
            </div>

            <div className="space-y-4 text-[var(--fg-muted)] leading-relaxed">
              <p><strong>1.1.</strong> Оператором персональных данных является <strong>Miss Kurochka</strong>, зарегистрированное в соответствии с законодательством Кыргызской Республики.</p>
              <p><strong>1.2.</strong> Обработка персональных данных осуществляется в соответствии с:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Конституцией Кыргызской Республики</li>
                <li>Законом КР «О персональных данных» от 14 апреля 2008 года № 58</li>
                <li>Гражданским кодексом КР</li>
                <li>Другими нормативно-правовыми актами КР</li>
              </ul>
              <p><strong>1.3.</strong> Используя Сервис, вы соглашаетесь с условиями настоящей Политики конфиденциальности.</p>
            </div>
          </div>

          {/* Какие данные собираем */}
          <div className="card p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">2. Какие данные мы собираем</h2>
                <p className="text-[var(--fg-muted)]">
                  Мы собираем только необходимую информацию для предоставления качественного сервиса.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">2.1. Персональные данные:</h3>
                <ul className="list-disc list-inside ml-4 space-y-2 text-[var(--fg-muted)]">
                  <li>Имя и фамилия</li>
                  <li>Номер телефона</li>
                  <li>Адрес электронной почты</li>
                  <li>Адрес доставки</li>
                  <li>Дата рождения (опционально, для бонусов)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">2.2. Данные об использовании:</h3>
                <ul className="list-disc list-inside ml-4 space-y-2 text-[var(--fg-muted)]">
                  <li>История заказов</li>
                  <li>Предпочтения в меню</li>
                  <li>Информация о платежах (через защищенные платежные системы)</li>
                  <li>IP-адрес и данные браузера (для безопасности)</li>
                  <li>Геолокация (только с вашего разрешения, для определения ближайшего филиала)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">2.3. Данные от сторонних сервисов:</h3>
                <ul className="list-disc list-inside ml-4 space-y-2 text-[var(--fg-muted)]">
                  <li>При входе через Google: имя, email, фото профиля</li>
                  <li>Информация от платежных систем (без данных карты)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Как используем данные */}
          <div className="card p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">3. Как мы используем ваши данные</h2>
                <p className="text-[var(--fg-muted)]">
                  Ваши данные используются исключительно для улучшения качества обслуживания.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                  1
                </div>
                <div>
                  <h4 className="font-bold mb-1">Обработка заказов</h4>
                  <p className="text-sm text-[var(--fg-muted)]">Принятие, подготовка и доставка ваших заказов</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                  2
                </div>
                <div>
                  <h4 className="font-bold mb-1">Коммуникация</h4>
                  <p className="text-sm text-[var(--fg-muted)]">Уведомления о статусе заказа, специальных предложениях</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                  3
                </div>
                <div>
                  <h4 className="font-bold mb-1">Персонализация</h4>
                  <p className="text-sm text-[var(--fg-muted)]">Рекомендации блюд на основе ваших предпочтений</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                  4
                </div>
                <div>
                  <h4 className="font-bold mb-1">Улучшение сервиса</h4>
                  <p className="text-sm text-[var(--fg-muted)]">Анализ и улучшение качества нашего сервиса</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                  5
                </div>
                <div>
                  <h4 className="font-bold mb-1">Безопасность</h4>
                  <p className="text-sm text-[var(--fg-muted)]">Предотвращение мошенничества и обеспечение безопасности</p>
                </div>
              </div>
            </div>
          </div>

          {/* Защита данных */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-6">4. Защита ваших данных</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <Shield className="w-8 h-8 text-[var(--brand)] mb-3" />
                <h4 className="font-bold mb-2">Шифрование SSL/TLS</h4>
                <p className="text-sm text-[var(--fg-muted)]">Все данные передаются по защищенному протоколу HTTPS</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <Lock className="w-8 h-8 text-[var(--brand)] mb-3" />
                <h4 className="font-bold mb-2">Безопасное хранение</h4>
                <p className="text-sm text-[var(--fg-muted)]">Пароли хешируются, данные карт не хранятся</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <Eye className="w-8 h-8 text-[var(--brand)] mb-3" />
                <h4 className="font-bold mb-2">Ограниченный доступ</h4>
                <p className="text-sm text-[var(--fg-muted)]">Доступ к данным имеют только уполномоченные сотрудники</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <AlertCircle className="w-8 h-8 text-[var(--brand)] mb-3" />
                <h4 className="font-bold mb-2">Регулярный аудит</h4>
                <p className="text-sm text-[var(--fg-muted)]">Проверка систем безопасности и обновление протоколов</p>
              </div>
            </div>
          </div>

          {/* Ваши права */}
          <div className="card p-6 sm:p-8 mb-8 border-2 border-[var(--brand)] bg-[var(--brand-soft)]">
            <h2 className="text-2xl font-black mb-4">5. Ваши права</h2>
            <p className="text-[var(--fg-muted)] mb-6">
              В соответствии с Законом КР «О персональных данных», вы имеете право:
            </p>
            <ul className="space-y-3">
              {[
                'Получить информацию о ваших персональных данных',
                'Исправить неточные или неполные данные',
                'Удалить ваши персональные данные',
                'Ограничить обработку ваших данных',
                'Возражать против обработки данных',
                'Отозвать согласие на обработку данных',
                'Подать жалобу в уполномоченный орган КР',
              ].map((right, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <span className="text-[var(--fg)]">{right}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cookies */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">6. Использование файлов cookie</h2>
            <p className="text-[var(--fg-muted)] mb-4">
              Мы используем файлы cookie для улучшения работы Сервиса:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-[var(--fg-muted)]">
              <li><strong>Необходимые:</strong> для функционирования сайта (авторизация, корзина)</li>
              <li><strong>Функциональные:</strong> для запоминания ваших предпочтений</li>
              <li><strong>Аналитические:</strong> для анализа использования сервиса (анонимно)</li>
            </ul>
            <p className="text-sm text-[var(--fg-subtle)] mt-4">
              Вы можете отключить cookie в настройках браузера, но это может ограничить функциональность сайта.
            </p>
          </div>

          {/* Передача данных */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">7. Передача данных третьим лицам</h2>
            <p className="text-[var(--fg-muted)] mb-4">
              Мы не продаем и не сдаем в аренду ваши персональные данные. Данные могут передаваться только:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-[var(--brand)] font-bold">•</span>
                <span className="text-[var(--fg-muted)]"><strong>Службам доставки</strong> — для выполнения заказов</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--brand)] font-bold">•</span>
                <span className="text-[var(--fg-muted)]"><strong>Платежным системам</strong> — для обработки платежей</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--brand)] font-bold">•</span>
                <span className="text-[var(--fg-muted)]"><strong>Государственным органам</strong> — при наличии законных требований</span>
              </li>
            </ul>
          </div>

          {/* Хранение данных */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">8. Срок хранения данных</h2>
            <p className="text-[var(--fg-muted)] mb-4">
              Мы храним ваши персональные данные в течение:
            </p>
            <ul className="space-y-2 text-[var(--fg-muted)]">
              <li>• Активные пользователи: пока вы пользуетесь Сервисом</li>
              <li>• История заказов: 3 года (для бухгалтерского учета и налоговой отчетности)</li>
              <li>• После удаления аккаунта: 30 дней (для возможности восстановления)</li>
            </ul>
          </div>

          {/* Дети */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">9. Защита данных несовершеннолетних</h2>
            <p className="text-[var(--fg-muted)]">
              Сервис предназначен для лиц старше 18 лет. Мы не собираем намеренно персональные данные детей до 18 лет без согласия родителей или законных представителей.
            </p>
          </div>

          {/* Изменения */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">10. Изменения в Политике конфиденциальности</h2>
            <p className="text-[var(--fg-muted)]">
              Мы можем обновлять настоящую Политику конфиденциальности. О существенных изменениях мы уведомим вас по email или через уведомления в приложении. Продолжение использования Сервиса после изменений означает ваше согласие с новой редакцией Политики.
            </p>
          </div>

          {/* Контакты */}
          <div className="card p-6 sm:p-8 mb-8 bg-gradient-to-br from-[var(--brand-soft)] to-white border-2 border-[var(--brand)]">
            <h2 className="text-2xl font-black mb-6">11. Контактная информация</h2>
            <p className="text-[var(--fg-muted)] mb-6">
              По вопросам обработки персональных данных вы можете связаться с нами:
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--brand)]" />
                <a href="mailto:privacy@miss-kurochka.com" className="text-[var(--brand)] font-semibold hover:underline">
                  privacy@miss-kurochka.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[var(--brand)]" />
                <a href="tel:+996555123456" className="text-[var(--brand)] font-semibold hover:underline">
                  +996 555 123 456
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--brand)] shrink-0 mt-1" />
                <span className="text-[var(--fg-muted)]">
                  г. Бишкек, Кыргызская Республика<br />
                  (адрес будет уточнен)
                </span>
              </div>
            </div>
          </div>

          {/* Согласие */}
          <div className="text-center py-8">
            <p className="text-[var(--fg-muted)] mb-6">
              Используя наш Сервис, вы подтверждаете, что прочитали и согласны с настоящей Политикой конфиденциальности.
            </p>
            <Link href="/" className="btn btn-primary btn-lg shadow-[var(--shadow-brand)]">
              Вернуться на главную
            </Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f0f10] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Miss Kurochka. Все права защищены.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <Link href="/privacy-policy" className="text-white/70 hover:text-white transition">
              Политика конфиденциальности
            </Link>
            <span className="text-white/30">•</span>
            <Link href="/terms-of-service" className="text-white/70 hover:text-white transition">
              Условия использования
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
