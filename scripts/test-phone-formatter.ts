/**
 * Тестовый скрипт для проверки форматирования телефонных номеров
 * Запуск: npx tsx scripts/test-phone-formatter.ts
 */

import {
  formatPhoneNumber,
  validatePhoneNumber,
  displayPhoneNumber,
  getCleanPhoneNumber,
} from "../lib/phone-formatter";

console.log("🧪 Тестирование утилит форматирования телефонных номеров\n");

// Тестовые случаи
const testCases = [
  { input: "555123456", expected: "+996 555 123 456" },
  { input: "0555123456", expected: "+996 555 123 456" },
  { input: "996555123456", expected: "+996 555 123 456" },
  { input: "+996555123456", expected: "+996 555 123 456" },
  { input: "700123456", expected: "+996 700 123 456" },
  { input: "312123456", expected: "+996 312 123 456" },
  { input: "123", expected: "+996 123" },
  { input: "", expected: "" },
];

console.log("📝 Тест formatPhoneNumber():");
console.log("─".repeat(60));

testCases.forEach(({ input, expected }) => {
  const result = formatPhoneNumber(input);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} Ввод: "${input}"`);
  console.log(`   Ожидается: "${expected}"`);
  console.log(`   Результат: "${result}"`);
  console.log();
});

// Тест валидации
console.log("\n✓ Тест validatePhoneNumber():");
console.log("─".repeat(60));

const validationTests = [
  { phone: "+996 555 123 456", expected: true },
  { phone: "996555123456", expected: true },
  { phone: "+996 700 123 456", expected: true },
  { phone: "+996 555 123", expected: false },
  { phone: "+7 555 123 456", expected: false },
  { phone: "555 123 456", expected: false },
  { phone: "", expected: false },
];

validationTests.forEach(({ phone, expected }) => {
  const result = validatePhoneNumber(phone);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} Номер: "${phone}"`);
  console.log(`   Ожидается: ${expected}`);
  console.log(`   Результат: ${result}`);
  console.log();
});

// Тест displayPhoneNumber
console.log("\n📱 Тест displayPhoneNumber():");
console.log("─".repeat(60));

const displayTests = [
  { input: "996555123456", expected: "+996 555 123 456" },
  { input: "+996555123456", expected: "+996 555 123 456" },
  { input: "invalid", expected: "invalid" },
];

displayTests.forEach(({ input, expected }) => {
  const result = displayPhoneNumber(input);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} Ввод: "${input}"`);
  console.log(`   Ожидается: "${expected}"`);
  console.log(`   Результат: "${result}"`);
  console.log();
});

// Тест getCleanPhoneNumber
console.log("\n🧹 Тест getCleanPhoneNumber():");
console.log("─".repeat(60));

const cleanTests = [
  { input: "+996 555 123 456", expected: "996555123456" },
  { input: "996-555-123-456", expected: "996555123456" },
  { input: "(996) 555 123 456", expected: "996555123456" },
];

cleanTests.forEach(({ input, expected }) => {
  const result = getCleanPhoneNumber(input);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} Ввод: "${input}"`);
  console.log(`   Ожидается: "${expected}"`);
  console.log(`   Результат: "${result}"`);
  console.log();
});

console.log("\n✨ Тестирование завершено!");
