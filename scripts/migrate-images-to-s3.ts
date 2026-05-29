/**
 * Скрипт миграции: переносит все base64-изображения из БД в S3.
 *
 * Запуск:
 *   npx tsx scripts/migrate-images-to-s3.ts
 *
 * Что делает:
 *   1. Находит все MenuItemImage, MenuCategory.imageUrl, ComboOffer.imageUrl,
 *      AdditionalOffer.imageUrl, Banner.imageUrl где значение начинается с "data:"
 *   2. Загружает каждое в S3
 *   3. Обновляет запись в БД — заменяет base64 на S3 URL
 */

import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { uploadToS3 } from '../lib/s3'

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function isBase64(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith('data:')
}

function base64ToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
  const buffer = Buffer.from(data, 'base64')
  return { buffer, mime }
}

let uploaded = 0
let skipped = 0
let errors = 0

async function migrateOne(
  id: string,
  field: string,
  dataUrl: string,
  folder: string,
  updater: (id: string, url: string) => Promise<void>,
) {
  try {
    const { buffer, mime } = base64ToBuffer(dataUrl)
    const url = await uploadToS3(buffer, mime, folder)
    await updater(id, url)
    uploaded++
    console.log(`  ✓ [${field}] ${id.slice(0, 8)}… → ${url.slice(0, 60)}…`)
  } catch (err) {
    errors++
    console.error(`  ✗ [${field}] ${id.slice(0, 8)}… — ошибка:`, err)
  }
}

// ─── Таблицы ─────────────────────────────────────────────────────────────────

async function migrateMenuItemImages() {
  console.log('\n📷 MenuItemImage…')
  const rows = await prisma.menuItemImage.findMany({
    where: { imageUrl: { startsWith: 'data:' } },
    select: { id: true, imageUrl: true },
  })
  console.log(`   Найдено: ${rows.length}`)
  for (const row of rows) {
    await migrateOne(row.id, 'MenuItemImage', row.imageUrl, 'menu', async (id, url) => {
      await prisma.menuItemImage.update({ where: { id }, data: { imageUrl: url } })
    })
  }
}

async function migrateMenuCategories() {
  console.log('\n📂 MenuCategory.imageUrl…')
  const rows = await prisma.menuCategory.findMany({
    where: { imageUrl: { startsWith: 'data:' } },
    select: { id: true, imageUrl: true },
  })
  console.log(`   Найдено: ${rows.length}`)
  for (const row of rows) {
    if (!row.imageUrl) { skipped++; continue }
    await migrateOne(row.id, 'MenuCategory', row.imageUrl, 'categories', async (id, url) => {
      await prisma.menuCategory.update({ where: { id }, data: { imageUrl: url } })
    })
  }
}

async function migrateComboOffers() {
  console.log('\n🍱 ComboOffer.imageUrl…')
  const rows = await prisma.comboOffer.findMany({
    where: { imageUrl: { startsWith: 'data:' } },
    select: { id: true, imageUrl: true },
  })
  console.log(`   Найдено: ${rows.length}`)
  for (const row of rows) {
    await migrateOne(row.id, 'ComboOffer', row.imageUrl, 'combos', async (id, url) => {
      await prisma.comboOffer.update({ where: { id }, data: { imageUrl: url } })
    })
  }
}

async function migrateAdditionalOffers() {
  console.log('\n➕ AdditionalOffer.imageUrl…')
  const rows = await prisma.additionalOffer.findMany({
    where: { imageUrl: { startsWith: 'data:' } },
    select: { id: true, imageUrl: true },
  })
  console.log(`   Найдено: ${rows.length}`)
  for (const row of rows) {
    if (!row.imageUrl) { skipped++; continue }
    await migrateOne(row.id, 'AdditionalOffer', row.imageUrl, 'additional', async (id, url) => {
      await prisma.additionalOffer.update({ where: { id }, data: { imageUrl: url } })
    })
  }
}

async function migrateBanners() {
  console.log('\n🖼  Banner.imageUrl…')
  const rows = await prisma.banner.findMany({
    where: { imageUrl: { startsWith: 'data:' } },
    select: { id: true, imageUrl: true },
  })
  console.log(`   Найдено: ${rows.length}`)
  for (const row of rows) {
    await migrateOne(row.id, 'Banner', row.imageUrl, 'banners', async (id, url) => {
      await prisma.banner.update({ where: { id }, data: { imageUrl: url } })
    })
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Миграция изображений в S3')
  console.log(`   Endpoint : ${process.env.S3_ENDPOINT}`)
  console.log(`   Bucket   : ${process.env.S3_BUCKET}`)

  await migrateMenuItemImages()
  await migrateMenuCategories()
  await migrateComboOffers()
  await migrateAdditionalOffers()
  await migrateBanners()

  console.log('\n─────────────────────────────────')
  console.log(`✅ Загружено : ${uploaded}`)
  console.log(`⏭  Пропущено : ${skipped}`)
  console.log(`❌ Ошибок   : ${errors}`)
  console.log('─────────────────────────────────\n')

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Критическая ошибка:', err)
  process.exit(1)
})
