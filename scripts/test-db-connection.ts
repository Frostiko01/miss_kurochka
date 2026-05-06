import { Pool } from "pg";
import * as dotenv from "dotenv";

// Загружаем переменные окружения из .env
dotenv.config();

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  console.log("🔍 Проверка подключения к базе данных...");
  console.log("📝 Connection string:", connectionString?.replace(/:[^:@]+@/, ":****@"));

  if (!connectionString) {
    console.error("❌ DATABASE_URL не установлен!");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    // Пробуем подключиться
    const client = await pool.connect();
    console.log("✅ Подключение успешно!");

    // Проверяем версию PostgreSQL
    const versionResult = await client.query("SELECT version()");
    console.log("📊 PostgreSQL версия:", versionResult.rows[0].version.split(" ")[1]);

    // Проверяем текущую базу данных
    const dbResult = await client.query("SELECT current_database()");
    console.log("💾 Текущая база данных:", dbResult.rows[0].current_database);

    // Проверяем таблицы
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("\n📋 Таблицы в базе данных:");
    if (tablesResult.rows.length === 0) {
      console.log("   ⚠️ Таблиц не найдено! Нужно выполнить миграции.");
      console.log("   Запустите: npm run db:push");
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // Проверяем админов
    try {
      const adminResult = await client.query(`
        SELECT id, email, full_name, role, status 
        FROM users 
        WHERE role = 'admin'
      `);
      
      console.log("\n👥 Админы в базе данных:");
      if (adminResult.rows.length === 0) {
        console.log("   ⚠️ Админов не найдено!");
        console.log("   Создайте админа: npx tsx scripts/make-admin.ts");
      } else {
        adminResult.rows.forEach((admin) => {
          console.log(`   - ${admin.email} (${admin.full_name}) - ${admin.status}`);
        });
      }
    } catch (err: any) {
      console.log("\n⚠️ Ошибка при проверке админов:", err.message);
    }

    client.release();
    await pool.end();
    
    console.log("\n✅ Все проверки завершены!");
  } catch (error: any) {
    console.error("\n❌ Ошибка подключения:", error.message);
    console.error("\n💡 Возможные причины:");
    console.error("   1. PostgreSQL не запущен");
    console.error("   2. Неправильный пароль в DATABASE_URL");
    console.error("   3. База данных 'miss_kurochka' не существует");
    console.error("   4. Неправильный хост или порт");
    console.error("\n🔧 Решение:");
    console.error("   1. Проверьте, что PostgreSQL запущен");
    console.error("   2. Создайте базу данных: CREATE DATABASE miss_kurochka;");
    console.error("   3. Проверьте пароль в .env файле");
    await pool.end();
    process.exit(1);
  }
}

testConnection();
