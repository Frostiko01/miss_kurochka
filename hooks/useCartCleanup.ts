/**
 * Хук для автоматической очистки корзины при выходе пользователя
 * Используется на клиенте для очистки корзины когда пользователь выходит из системы
 */
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useCartCleanup() {
  const { data: session, status } = useSession();
  const previousStatusRef = useRef<string | null>(null);

  useEffect(() => {
    // Если пользователь был авторизован, но теперь вышел
    if (previousStatusRef.current === 'authenticated' && status === 'unauthenticated') {
      // Очищаем корзину через API
      fetch('/api/cart', {
        method: 'DELETE',
        credentials: 'include',
      }).catch((error) => {
        console.error('Ошибка очистки корзины:', error);
      });
    }

    // Сохраняем текущий статус для следующей проверки
    previousStatusRef.current = status;
  }, [status]);
}
