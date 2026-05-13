import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load .env explicitly
dotenv.config();

console.log('=== Testing Prisma Connection ===\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('');

async function testPrisma() {
  try {
    // Create pool with explicit config
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Test pool connection first
    console.log('Testing Pool connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user');
    console.log('✅ Pool connected successfully');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    client.release();
    console.log('');

    // Now test Prisma with adapter
    console.log('Testing Prisma with adapter...');
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const userCount = await prisma.user.count();
    console.log('✅ Prisma connected successfully');
    console.log('Total users:', userCount);

    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    console.log('\nAdmin users:', admins.length);
    admins.forEach((admin) => {
      console.log(`- ${admin.fullName} (${admin.email}) - ${admin.status}`);
    });

    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPrisma();
