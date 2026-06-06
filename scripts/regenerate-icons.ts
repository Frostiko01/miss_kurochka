/**
 * Пересоздаёт все PNG-иконки и public/favicon.ico из нового app/favicon.ico.
 * Запуск: npx tsx scripts/regenerate-icons.ts
 *
 * sharp не умеет читать ICO, поэтому декодируем встроенный 32-bit BMP DIB вручную,
 * получаем RGBA-пиксели, и далее sharp делает ресайз во все нужные размеры.
 */
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const ROOT = process.cwd()
const SRC_ICO = path.join(ROOT, 'app', 'favicon.ico')

interface DecodedImage {
  width: number
  height: number
  rgba: Buffer
}

/**
 * Извлекает крупнейшее изображение из ICO-файла и возвращает RGBA-пиксели.
 * Поддерживает как встроенный PNG, так и 32-bit BMP DIB (BGRA, снизу-вверх).
 */
async function decodeIco(file: string): Promise<DecodedImage> {
  const buf = fs.readFileSync(file)

  const reserved = buf.readUInt16LE(0)
  const type = buf.readUInt16LE(2)
  const count = buf.readUInt16LE(4)
  if (reserved !== 0 || type !== 1 || count < 1) {
    throw new Error('Файл не является корректным ICO')
  }

  // Выбираем самый большой по площади образ
  let best = { width: 0, height: 0, size: 0, offset: 0, area: -1 }
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16
    let w = buf.readUInt8(entry)
    let h = buf.readUInt8(entry + 1)
    if (w === 0) w = 256
    if (h === 0) h = 256
    const size = buf.readUInt32LE(entry + 8)
    const offset = buf.readUInt32LE(entry + 12)
    const area = w * h
    if (area > best.area) best = { width: w, height: h, size, offset, area }
  }

  const imgData = buf.subarray(best.offset, best.offset + best.size)

  // Встроенный PNG (сигнатура \x89PNG)
  if (
    imgData.length > 8 &&
    imgData[0] === 0x89 &&
    imgData[1] === 0x50 &&
    imgData[2] === 0x4e &&
    imgData[3] === 0x47
  ) {
    const png = await sharp(imgData).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { width: png.info.width, height: png.info.height, rgba: png.data }
  }

  // Иначе — BMP DIB (BITMAPINFOHEADER)
  const headerSize = imgData.readUInt32LE(0)
  const dibWidth = imgData.readInt32LE(4)
  // высота в DIB иконки — двойная (XOR-маска + AND-маска)
  const dibHeightField = imgData.readInt32LE(8)
  const bitCount = imgData.readUInt16LE(14)
  const width = dibWidth
  const height = Math.abs(dibHeightField) / 2

  if (bitCount !== 32) {
    throw new Error(`Поддерживается только 32-bit ICO, получено ${bitCount}-bit`)
  }

  const pixelStart = headerSize // палитры у 32bpp нет
  const rowSize = width * 4
  const rgba = Buffer.alloc(width * height * 4)

  // BMP хранит строки снизу-вверх, пиксели в порядке BGRA
  for (let y = 0; y < height; y++) {
    const srcRow = pixelStart + (height - 1 - y) * rowSize
    for (let x = 0; x < width; x++) {
      const s = srcRow + x * 4
      const d = (y * width + x) * 4
      const b = imgData[s]
      const g = imgData[s + 1]
      const r = imgData[s + 2]
      const a = imgData[s + 3]
      rgba[d] = r
      rgba[d + 1] = g
      rgba[d + 2] = b
      rgba[d + 3] = a
    }
  }

  return { width, height, rgba }
}

async function main() {
  if (!fs.existsSync(SRC_ICO)) {
    console.error('❌ Не найден app/favicon.ico')
    process.exit(1)
  }

  console.log('🔍 Декодирую app/favicon.ico ...')
  const img = await decodeIco(SRC_ICO)
  console.log(`✅ Извлечено изображение ${img.width}x${img.height}`)

  const base = sharp(img.rgba, {
    raw: { width: img.width, height: img.height, channels: 4 },
  })

  // Цвет фона для maskable-иконок (фирменный красный, как в манифесте)
  const BRAND = { r: 214, g: 35, b: 0, alpha: 1 }

  const targets: Array<{
    file: string
    size: number
    maskable?: boolean
  }> = [
    { file: 'public/icon-192.png', size: 192 },
    { file: 'public/icon-512.png', size: 512 },
    { file: 'public/apple-icon.png', size: 180 },
    { file: 'public/icon-maskable-192.png', size: 192, maskable: true },
    { file: 'public/icon-maskable-512.png', size: 512, maskable: true },
  ]

  for (const t of targets) {
    const out = path.join(ROOT, t.file)
    if (t.maskable) {
      // maskable: иконка с отступом ~10% на фирменном фоне
      const inner = Math.round(t.size * 0.8)
      const resized = await base
        .clone()
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      await sharp({
        create: { width: t.size, height: t.size, channels: 4, background: BRAND },
      })
        .composite([{ input: resized, gravity: 'center' }])
        .png()
        .toFile(out)
    } else {
      await base
        .clone()
        .resize(t.size, t.size, { fit: 'cover' })
        .png()
        .toFile(out)
    }
    console.log(`  ✅ ${t.file} (${t.size}x${t.size})`)
  }

  // Синхронизируем public/favicon.ico с новым app/favicon.ico,
  // чтобы не было двух разных иконок.
  fs.copyFileSync(SRC_ICO, path.join(ROOT, 'public', 'favicon.ico'))
  console.log('  ✅ public/favicon.ico синхронизирован с app/favicon.ico')

  console.log('\n🎉 Все иконки пересозданы из нового favicon.')
}

main().catch((e) => {
  console.error('❌ Ошибка:', e)
  process.exit(1)
})
