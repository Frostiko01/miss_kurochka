import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Загружаем .env
dotenv.config();

async function testConnection() {
  console.log('=== Тест подключения к базе данных ===\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    const client = await pool.connect();
    console.log('✅ Подключение успешно!');
    
    const result = await client.query('SELECT current_database(), current_user');
    console.log('База данных:', result.rows[0].current_database);
    console.log('Пользователь:', result.rows[0].current_user);
    
    client.release();
  } catch (error) {
    console.error('❌ Ошибка подключения:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
