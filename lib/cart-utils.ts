/**
 * Утилиты для управления корзиной
 */

/**
 * Очищает корзину пользователя на сервере
 */
export async function clearUserCart(): Promise<void> {
  try {
    const response = await fetch('/api/cart', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Не удалось очистить корзину:', response.statusText);
    }
  } catch (error) {
    console.error('Ошибка при очистке корзины:', error);
  }
}

/**
 * Выход пользователя с автоматической очисткой корзины
 */
export async function signOutWithCartCleanup(signOut: any, callbackUrl = '/'): Promise<void> {
  // Сначала очищаем корзину
  await clearUserCart();

  // Затем выходим
  await signOut({ callbackUrl });
}
