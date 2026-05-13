import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Инициализация настроек Telegram...');

  const botToken = process.env.ADMIN_TELEGRAM_BOT_TOKEN;
  const userId = process.env.ADMIN_TELEGRAM_USER_ID;

  if (!botToken || !userId) {
    console.error('❌ Ошибка: ADMIN_TELEGRAM_BOT_TOKEN и ADMIN_TELEGRAM_USER_ID должны быть установлены в .env');
    console.log('\n📝 Инструкция по настройке:');
    console.log('1. Создайте бота через @BotFather в Telegram');
    console.log('2. Получите токен бота');
    console.log('3. Узнайте свой Telegram User ID через @userinfobot');
    console.log('4. Добавьте в .env:');
    console.log('   ADMIN_TELEGRAM_BOT_TOKEN="ваш-токен-бота"');
    console.log('   ADMIN_TELEGRAM_USER_ID="ваш-user-id"');
    process.exit(1);
  }

  try {
    // Создаем или обновляем настройку Bot Token
    await prisma.systemSetting.upsert({
      where: { key: 'ADMIN_TELEGRAM_BOT_TOKEN' },
      update: { value: botToken },
      create: {
        key: 'ADMIN_TELEGRAM_BOT_TOKEN',
        value: botToken,
        description: 'Токен Telegram бота для отправки 2FA кодов администраторам',
      },
    });

    // Создаем или обновляем настройку User ID
    await prisma.systemSetting.upsert({
      where: { key: 'ADMIN_TELEGRAM_USER_ID' },
      update: { value: userId },
      create: {
        key: 'ADMIN_TELEGRAM_USER_ID',
        value: userId,
        description: 'Telegram User ID администратора для получения 2FA кодов',
      },
    });

    console.log('✅ Настройки Telegram успешно сохранены в базу данных!');
    console.log(`   Bot Token: ${botToken.substring(0, 10)}...`);
    console.log(`   User ID: ${userId}`);
    
    // Проверяем работу бота
    console.log('\n🔍 Проверка подключения к Telegram...');
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Бот подключен: @${data.result.username}`);
      console.log(`   Имя: ${data.result.first_name}`);
      
      // Отправляем тестовое сообщение
      console.log('\n📤 Отправка тестового сообщения...');
      const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: userId,
          text: '✅ Telegram бот успешно настроен для админ-панели Miss Kurochka!\n\nТеперь вы будете получать коды для двухфакторной аутентификации.',
        }),
      });
      
      const testData = await testResponse.json();
      if (testData.ok) {
        console.log('✅ Тестовое сообщение отправлено!');
      } else {
        console.log('⚠️  Не удалось отправить тестовое сообщение:', testData.description);
        console.log('   Убедитесь, что вы начали диалог с ботом (отправили /start)');
      }
    } else {
      console.log('❌ Ошибка подключения к боту:', data.description);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении настроек:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
