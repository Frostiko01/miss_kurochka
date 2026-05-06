/**
 * Утилиты для форматирования телефонных номеров Кыргызстана
 * Формат: +996 XXX XXX XXX
 */

/**
 * Форматирует телефонный номер в международный формат Кыргызстана
 * @param value - введенное значение
 * @returns отформатированный номер
 */
export function formatPhoneNumber(value: string): string {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, "");

  // Если начинается с 996, оставляем как есть
  // Если начинается с 0, заменяем на 996
  // Иначе добавляем 996
  let normalizedDigits = digits;
  if (digits.startsWith("996")) {
    normalizedDigits = digits;
  } else if (digits.startsWith("0")) {
    normalizedDigits = "996" + digits.slice(1);
  } else if (digits.length > 0 && !digits.startsWith("996")) {
    normalizedDigits = "996" + digits;
  }

  // Ограничиваем до 12 цифр (996 + 9 цифр)
  normalizedDigits = normalizedDigits.slice(0, 12);

  // Форматируем: +996 XXX XXX XXX
  let formatted = "";
  if (normalizedDigits.length > 0) {
    formatted = "+";
    
    // Первые 3 цифры (996)
    if (normalizedDigits.length >= 1) {
      formatted += normalizedDigits.slice(0, 3);
    }
    
    // Пробел после кода страны
    if (normalizedDigits.length > 3) {
      formatted += " ";
    }
    
    // Следующие 3 цифры
    if (normalizedDigits.length > 3) {
      formatted += normalizedDigits.slice(3, 6);
    }
    
    // Пробел
    if (normalizedDigits.length > 6) {
      formatted += " ";
    }
    
    // Следующие 3 цифры
    if (normalizedDigits.length > 6) {
      formatted += normalizedDigits.slice(6, 9);
    }
    
    // Пробел
    if (normalizedDigits.length > 9) {
      formatted += " ";
    }
    
    // Последние 3 цифры
    if (normalizedDigits.length > 9) {
      formatted += normalizedDigits.slice(9, 12);
    }
  }

  return formatted;
}

/**
 * Валидирует телефонный номер Кыргызстана
 * @param phone - телефонный номер
 * @returns true если номер валидный
 */
export function validatePhoneNumber(phone: string): boolean {
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, "");
  
  // Должно быть ровно 12 цифр (996 + 9 цифр)
  if (digits.length !== 12) {
    return false;
  }
  
  // Должно начинаться с 996
  if (!digits.startsWith("996")) {
    return false;
  }
  
  return true;
}

/**
 * Получает чистый номер без форматирования (только цифры)
 * @param phone - отформатированный номер
 * @returns номер без форматирования
 */
export function getCleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Получает номер в формате для отображения
 * @param phone - номер из базы данных
 * @returns отформатированный номер
 */
export function displayPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length === 12 && digits.startsWith("996")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  }
  
  return phone;
}
