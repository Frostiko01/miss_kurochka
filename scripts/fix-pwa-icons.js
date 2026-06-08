const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIconWithPadding() {
  try {
    const logoPath = path.join(__dirname, '../public/logo.png');
    
    // Проверяем существование файла
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Файл logo.png не найден!');
      return;
    }

    console.log('🔧 Обработка логотипа...');
    
    // Читаем информацию о текущем логотипе
    const metadata = await sharp(logoPath).metadata();
    console.log(`📐 Размеры оригинала: ${metadata.width}x${metadata.height}`);

    // Создаём иконку 512x512 с белым фоном и padding 15%
    const size512 = 512;
    const padding512 = Math.floor(size512 * 0.15); // 15% отступ
    const logoSize512 = size512 - (padding512 * 2);

    await sharp(logoPath)
      .resize(logoSize512, logoSize512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: padding512,
        bottom: padding512,
        left: padding512,
        right: padding512,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, '../public/icon-512.png'));

    console.log('✅ icon-512.png создан с белым фоном и padding 15%');

    // Создаём иконку 192x192 с белым фоном и padding 15%
    const size192 = 192;
    const padding192 = Math.floor(size192 * 0.15);
    const logoSize192 = size192 - (padding192 * 2);

    await sharp(logoPath)
      .resize(logoSize192, logoSize192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: padding192,
        bottom: padding192,
        left: padding192,
        right: padding192,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, '../public/icon-192.png'));

    console.log('✅ icon-192.png создан с белым фоном и padding 15%');

    // Создаём Apple Touch Icon 180x180 с белым фоном и padding 15%
    const size180 = 180;
    const padding180 = Math.floor(size180 * 0.15);
    const logoSize180 = size180 - (padding180 * 2);

    await sharp(logoPath)
      .resize(logoSize180, logoSize180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: padding180,
        bottom: padding180,
        left: padding180,
        right: padding180,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, '../public/apple-icon.png'));

    console.log('✅ apple-icon.png создан с белым фоном и padding 15%');

    // Создаём maskable иконки (для Android adaptive icons)
    // Maskable требует больше padding (20%) чтобы безопасно обрезаться
    const maskablePadding512 = Math.floor(size512 * 0.20);
    const maskableLogoSize512 = size512 - (maskablePadding512 * 2);

    await sharp(logoPath)
      .resize(maskableLogoSize512, maskableLogoSize512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: maskablePadding512,
        bottom: maskablePadding512,
        left: maskablePadding512,
        right: maskablePadding512,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, '../public/icon-maskable-512.png'));

    console.log('✅ icon-maskable-512.png создан с белым фоном и padding 20%');

    const maskablePadding192 = Math.floor(size192 * 0.20);
    const maskableLogoSize192 = size192 - (maskablePadding192 * 2);

    await sharp(logoPath)
      .resize(maskableLogoSize192, maskableLogoSize192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: maskablePadding192,
        bottom: maskablePadding192,
        left: maskablePadding192,
        right: maskablePadding192,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, '../public/icon-maskable-192.png'));

    console.log('✅ icon-maskable-192.png создан с белым фоном и padding 20%');

    console.log('\n✨ Все иконки успешно созданы!');
    console.log('📱 Теперь логотип будет корректно отображаться на главных экранах Android и iOS');
    
  } catch (error) {
    console.error('❌ Ошибка при создании иконок:', error);
    process.exit(1);
  }
}

createIconWithPadding();
