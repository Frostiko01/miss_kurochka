import Link from 'next/link'
import Image from 'next/image'
import { FileText, ShieldCheck, CreditCard, Truck, AlertTriangle, Scale, Mail, Phone } from 'lucide-react'

export const metadata = {
  title: 'Условия использования | Miss Kurochka',
  description: 'Условия использования сервиса Miss Kurochka. Правила и условия предоставления услуг в соответствии с законодательством КР.',
}

export default function TermsOfServicePage() {
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
            <Scale className="w-4 h-4" />
            Правовые основы сотрудничества
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-5 leading-tight">
            Условия использования
          </h1>
          <p className="text-lg text-[var(--fg-muted)] max-w-2xl mx-auto">
            Пожалуйста, внимательно ознакомьтесь с условиями использования нашего сервиса перед оформлением заказа
          </p>
          <p className="text-sm text-[var(--fg-subtle)] mt-4">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Общие положения */}
          <div className="card p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">1. Общие положения</h2>
                <p className="text-[var(--fg-muted)]">
                  Настоящие Условия использования регулируют отношения между вами и Miss Kurochka.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-[var(--fg-muted)] leading-relaxed">
              <p><strong>1.1.</strong> Настоящие Условия использования (далее — «Условия») представляют собой публичную оферту в соответствии со статьей 395 Гражданского кодекса Кыргызской Республики.</p>
              
              <p><strong>1.2.</strong> Предметом настоящих Условий является предоставление услуг по:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Приему заказов на доставку готовых блюд</li>
                <li>Приготовлению и доставке заказанных блюд</li>
                <li>Предоставлению информации о меню и специальных предложениях</li>
              </ul>

              <p><strong>1.3.</strong> Используя наш Сервис, регистрируясь или оформляя заказ, вы полностью и безоговорочно принимаете настоящие Условия.</p>

              <p><strong>1.4.</strong> Если вы не согласны с какими-либо положениями настоящих Условий, пожалуйста, не используйте наш Сервис.</p>
            </div>
          </div>

          {/* Регистрация */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-6">2. Регистрация и учетная запись</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">2.1. Требования к регистрации:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Вам должно быть не менее 18 лет</li>
                  <li>• Предоставленная информация должна быть достоверной и актуальной</li>
                  <li>• Один человек может иметь только одну учетную запись</li>
                  <li>• Запрещено создавать аккаунты с использованием ложных данных</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">2.2. Безопасность аккаунта:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Вы несете ответственность за конфиденциальность вашего пароля</li>
                  <li>• Немедленно сообщайте нам о любом несанкционированном доступе</li>
                  <li>• Мы не несем ответственности за убытки от несанкционированного использования вашего аккаунта</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[var(--brand-soft)] border-l-4 border-[var(--brand)]">
                <p className="text-sm text-[var(--fg)]">
                  <strong>Важно:</strong> Мы можем приостановить или удалить вашу учетную запись при нарушении настоящих Условий.
                </p>
              </div>
            </div>
          </div>

          {/* Заказы */}
          <div className="card p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">3. Оформление и выполнение заказов</h2>
                <p className="text-[var(--fg-muted)]">
                  Порядок работы с заказами и условия доставки.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">3.1. Оформление заказа:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Заказ считается принятым после подтверждения оператором или автоматической системой</li>
                  <li>• Минимальная сумма заказа: 200 сом (может отличаться в зависимости от филиала)</li>
                  <li>• Мы оставляем за собой право отклонить заказ при наличии технических проблем</li>
                  <li>• Вы можете отменить заказ до начала его приготовления</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">3.2. Время доставки:</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                    <p className="font-bold mb-1">Стандартная доставка</p>
                    <p className="text-2xl font-black text-[var(--brand)] mb-1">30-60 мин</p>
                    <p className="text-sm text-[var(--fg-subtle)]">В пределах зоны доставки</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                    <p className="font-bold mb-1">Пиковые часы</p>
                    <p className="text-2xl font-black text-[var(--brand)] mb-1">60-90 мин</p>
                    <p className="text-sm text-[var(--fg-subtle)]">12:00-14:00, 18:00-21:00</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--fg-subtle)] mt-3">
                  * Указанное время является приблизительным и может варьироваться в зависимости от загруженности
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">3.3. Зоны доставки:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Доставка осуществляется в пределах определенных зон для каждого филиала</li>
                  <li>• Стоимость доставки рассчитывается автоматически при оформлении заказа</li>
                  <li>• Бесплатная доставка при заказе от 500 сом (в пределах основной зоны)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">3.4. Получение заказа:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Проверьте комплектность и качество заказа при получении</li>
                  <li>• Если есть претензии — сообщите курьеру или позвоните нам немедленно</li>
                  <li>• Претензии принимаются в течение 1 часа после получения заказа</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Оплата */}
          <div className="card p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">4. Оплата</h2>
                <p className="text-[var(--fg-muted)]">
                  Способы оплаты и условия возврата средств.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">4.1. Способы оплаты:</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-muted)] text-center">
                    <div className="text-3xl mb-2">💵</div>
                    <p className="font-bold">Наличные</p>
                    <p className="text-xs text-[var(--fg-subtle)] mt-1">При получении</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-muted)] text-center">
                    <div className="text-3xl mb-2">💳</div>
                    <p className="font-bold">Банковская карта</p>
                    <p className="text-xs text-[var(--fg-subtle)] mt-1">Visa, MasterCard</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-muted)] text-center">
                    <div className="text-3xl mb-2">📱</div>
                    <p className="font-bold">Электронные кошельки</p>
                    <p className="text-xs text-[var(--fg-subtle)] mt-1">O!, Megapay</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">4.2. Цены:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Все цены указаны в киргизских сомах (KGS)</li>
                  <li>• Цены включают НДС в соответствии с законодательством КР</li>
                  <li>• Мы оставляем за собой право изменять цены без предварительного уведомления</li>
                  <li>• Цена заказа фиксируется в момент его подтверждения</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">4.3. Возврат средств:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Возврат возможен при отмене заказа до начала приготовления</li>
                  <li>• При онлайн-оплате возврат происходит на ту же карту в течение 5-14 рабочих дней</li>
                  <li>• При наличной оплате возврат осуществляется наличными или на карту по вашему выбору</li>
                  <li>• Комиссия платежной системы не возвращается</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ответственность */}
          <div className="card p-6 sm:p-8 mb-8 border-2 border-[var(--brand)]">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">5. Ответственность сторон</h2>
                <p className="text-[var(--fg-muted)]">
                  Права и обязанности Miss Kurochka и клиента.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">5.1. Наши обязательства:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Предоставлять качественные продукты и услуги</li>
                  <li>• Соблюдать санитарно-гигиенические нормы</li>
                  <li>• Доставлять заказы в указанные сроки</li>
                  <li>• Обеспечивать конфиденциальность ваших данных</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">5.2. Ваши обязательства:</h3>
                <ul className="space-y-2 text-[var(--fg-muted)]">
                  <li>• Предоставлять достоверную информацию при заказе</li>
                  <li>• Быть доступным по указанному номеру телефона</li>
                  <li>• Обеспечить доступ курьера к месту доставки</li>
                  <li>• Оплатить заказ в соответствии с выбранным способом оплаты</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[var(--brand-soft)]">
                <h3 className="text-lg font-bold mb-3">5.3. Ограничение ответственности:</h3>
                <ul className="space-y-2 text-sm text-[var(--fg-muted)]">
                  <li>• Мы не несем ответственности за задержки, вызванные форс-мажорными обстоятельствами</li>
                  <li>• Мы не несем ответственности за некорректную информацию, предоставленную клиентом</li>
                  <li>• Максимальная сумма компенсации не может превышать стоимость заказа</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Запрещенные действия */}
          <div className="card p-6 sm:p-8 mb-8 bg-red-50 border-2 border-red-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">6. Запрещенные действия</h2>
                <p className="text-[var(--fg-muted)]">
                  Действия, которые могут привести к блокировке аккаунта.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                'Размещение ложных или мошеннических заказов',
                'Использование Сервиса в незаконных целях',
                'Попытки несанкционированного доступа к системе',
                'Злоупотребление программой лояльности или бонусами',
                'Размещение оскорбительных или дискриминационных комментариев',
                'Распространение вредоносного программного обеспечения',
                'Использование автоматизированных систем для заказов',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    ✕
                  </div>
                  <span className="text-[var(--fg)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Интеллектуальная собственность */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">7. Интеллектуальная собственность</h2>
            <div className="space-y-4 text-[var(--fg-muted)]">
              <p><strong>7.1.</strong> Все права на контент Сервиса (тексты, изображения, логотипы, товарные знаки) принадлежат Miss Kurochka или используются на законных основаниях.</p>
              <p><strong>7.2.</strong> Запрещается копирование, распространение или иное использование контента без письменного разрешения.</p>
              <p><strong>7.3.</strong> Название «Miss Kurochka» и логотип являются зарегистрированными товарными знаками.</p>
            </div>
          </div>

          {/* Разрешение споров */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">8. Разрешение споров</h2>
            <div className="space-y-4 text-[var(--fg-muted)]">
              <p><strong>8.1.</strong> Все споры решаются путем переговоров.</p>
              <p><strong>8.2.</strong> Претензии направляются в письменной форме на email: <a href="mailto:support@miss-kurochka.com" className="text-[var(--brand)] hover:underline">support@miss-kurochka.com</a></p>
              <p><strong>8.3.</strong> Срок рассмотрения претензии: до 14 рабочих дней.</p>
              <p><strong>8.4.</strong> При невозможности урегулирования спора в досудебном порядке, спор передается в суд по месту нахождения Miss Kurochka в соответствии с законодательством Кыргызской Республики.</p>
            </div>
          </div>

          {/* Применимое право */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">9. Применимое право</h2>
            <p className="text-[var(--fg-muted)] mb-4">
              Настоящие Условия регулируются и толкуются в соответствии с законодательством Кыргызской Республики, включая, но не ограничиваясь:
            </p>
            <ul className="space-y-2 text-[var(--fg-muted)]">
              <li>• Гражданский кодекс КР</li>
              <li>• Закон КР «О защите прав потребителей»</li>
              <li>• Закон КР «О персональных данных»</li>
              <li>• Закон КР «Об электронной коммерции»</li>
            </ul>
          </div>

          {/* Изменения условий */}
          <div className="card p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-black mb-4">10. Изменение условий</h2>
            <div className="space-y-4 text-[var(--fg-muted)]">
              <p><strong>10.1.</strong> Мы оставляем за собой право изменять настоящие Условия в любое время.</p>
              <p><strong>10.2.</strong> О существенных изменениях мы уведомим вас по email или через уведомления в приложении за 7 дней до вступления изменений в силу.</p>
              <p><strong>10.3.</strong> Продолжение использования Сервиса после вступления изменений в силу означает ваше согласие с новой редакцией Условий.</p>
              <p><strong>10.4.</strong> Актуальная версия Условий всегда доступна на нашем сайте.</p>
            </div>
          </div>

          {/* Контакты */}
          <div className="card p-6 sm:p-8 mb-8 bg-gradient-to-br from-[var(--brand-soft)] to-white border-2 border-[var(--brand)]">
            <h2 className="text-2xl font-black mb-6">11. Контактная информация</h2>
            <p className="text-[var(--fg-muted)] mb-6">
              По вопросам, связанным с настоящими Условиями, обращайтесь:
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--brand)]" />
                <a href="mailto:support@miss-kurochka.com" className="text-[var(--brand)] font-semibold hover:underline">
                  support@miss-kurochka.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[var(--brand)]" />
                <a href="tel:+996555123456" className="text-[var(--brand)] font-semibold hover:underline">
                  +996 555 123 456
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[var(--brand)]" />
                <span className="text-[var(--fg-muted)]">Горячая линия: 8:00 - 23:00 ежедневно</span>
              </div>
            </div>
          </div>

          {/* Согласие */}
          <div className="text-center py-8">
            <div className="p-6 rounded-2xl bg-[var(--brand-soft)] border-2 border-[var(--brand)] mb-6">
              <p className="text-[var(--fg)] font-bold mb-2">
                Принимая настоящие Условия, вы подтверждаете:
              </p>
              <ul className="text-sm text-[var(--fg-muted)] space-y-1">
                <li>✓ Вы прочитали и поняли все положения</li>
                <li>✓ Вам исполнилось 18 лет</li>
                <li>✓ Вы согласны соблюдать все условия</li>
              </ul>
            </div>
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
