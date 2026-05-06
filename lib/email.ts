// Утилита для отправки email через SMTP
import nodemailer from 'nodemailer';

// Генерация 6-значного кода
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Создаем транспорт для отправки email
function createTransporter() {
  console.log('🔧 Создание SMTP транспорта...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***установлен***' : 'НЕ УСТАНОВЛЕН');
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true для 465, false для других портов
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Включаем debug режим
    logger: true, // Включаем логирование
  });
}

// Отправка кода верификации при регистрации
export async function sendVerificationEmail(email: string, code: string) {
  console.log("=".repeat(50));
  console.log("📧 EMAIL VERIFICATION CODE");
  console.log("=".repeat(50));
  console.log(`Email: ${email}`);
  console.log(`Code: ${code}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log("=".repeat(50));

  // Проверяем, настроен ли SMTP
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️  SMTP не настроен полностью. Проверьте .env файл.');
    console.warn('SMTP_HOST:', process.env.SMTP_HOST || 'НЕ УСТАНОВЛЕН');
    console.warn('SMTP_USER:', process.env.SMTP_USER || 'НЕ УСТАНОВЛЕН');
    console.warn('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    return true;
  }

  try {
    console.log('📤 Попытка отправки email...');
    const transporter = createTransporter();
    
    // Проверяем подключение
    console.log('🔌 Проверка подключения к SMTP серверу...');
    await transporter.verify();
    console.log('✅ Подключение к SMTP серверу успешно!');
    
    // Отправляем email
    console.log('📨 Отправка письма...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Подтверждение регистрации - Miss Kurochka',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d62300 0%, #ff0000 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; border: 3px solid #d62300; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d62300; margin: 20px 0; border-radius: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🍗 Miss Kurochka</h1>
              <p style="margin: 10px 0 0 0;">Подтверждение регистрации</p>
            </div>
            <div class="content">
              <h2>Добро пожаловать!</h2>
              <p>Спасибо за регистрацию в Miss Kurochka. Для завершения регистрации введите код подтверждения:</p>
              <div class="code">${code}</div>
              <p><strong>Важно:</strong> Код действителен в течение 10 минут.</p>
              <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
            </div>
            <div class="footer">
              <p>© 2026 Miss Kurochka. Все права защищены.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Добро пожаловать в Miss Kurochka!

Ваш код подтверждения: ${code}

Код действителен в течение 10 минут.

Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.

© 2026 Miss Kurochka
      `,
    });

    console.log('✅ Email успешно отправлен!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    return true;
  } catch (error: any) {
    console.error('❌ ОШИБКА ОТПРАВКИ EMAIL:');
    console.error('Тип ошибки:', error.name);
    console.error('Сообщение:', error.message);
    console.error('Код ошибки:', error.code);
    console.error('Полная ошибка:', error);
    
    // В случае ошибки все равно возвращаем true, чтобы не блокировать регистрацию
    return true;
  }
}

// Отправка кода для сброса пароля
export async function sendPasswordResetEmail(email: string, code: string) {
  console.log("=".repeat(50));
  console.log("🔑 PASSWORD RESET CODE");
  console.log("=".repeat(50));
  console.log(`Email: ${email}`);
  console.log(`Code: ${code}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log("=".repeat(50));

  // Проверяем, настроен ли SMTP
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️  SMTP не настроен полностью. Проверьте .env файл.');
    return true;
  }

  try {
    console.log('📤 Попытка отправки email для сброса пароля...');
    const transporter = createTransporter();
    
    // Проверяем подключение
    console.log('🔌 Проверка подключения к SMTP серверу...');
    await transporter.verify();
    console.log('✅ Подключение к SMTP серверу успешно!');
    
    // Отправляем email
    console.log('📨 Отправка письма...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Восстановление пароля - Miss Kurochka',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d62300 0%, #ff0000 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; border: 3px solid #d62300; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d62300; margin: 20px 0; border-radius: 10px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🍗 Miss Kurochka</h1>
              <p style="margin: 10px 0 0 0;">Восстановление пароля</p>
            </div>
            <div class="content">
              <h2>Запрос на сброс пароля</h2>
              <p>Вы запросили сброс пароля для вашего аккаунта. Используйте код ниже для продолжения:</p>
              <div class="code">${code}</div>
              <p><strong>Важно:</strong> Код действителен в течение 10 минут.</p>
              <div class="warning">
                <strong>⚠️ Внимание!</strong> Если вы не запрашивали сброс пароля, немедленно проигнорируйте это письмо и свяжитесь с нами.
              </div>
            </div>
            <div class="footer">
              <p>© 2026 Miss Kurochka. Все права защищены.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Восстановление пароля - Miss Kurochka

Вы запросили сброс пароля для вашего аккаунта.

Ваш код подтверждения: ${code}

Код действителен в течение 10 минут.

⚠️ ВНИМАНИЕ! Если вы не запрашивали сброс пароля, немедленно проигнорируйте это письмо и свяжитесь с нами.

© 2026 Miss Kurochka
      `,
    });

    console.log('✅ Email успешно отправлен!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    return true;
  } catch (error: any) {
    console.error('❌ ОШИБКА ОТПРАВКИ EMAIL:');
    console.error('Тип ошибки:', error.name);
    console.error('Сообщение:', error.message);
    console.error('Код ошибки:', error.code);
    console.error('Полная ошибка:', error);
    
    // В случае ошибки все равно возвращаем true, чтобы не блокировать процесс
    return true;
  }
}
