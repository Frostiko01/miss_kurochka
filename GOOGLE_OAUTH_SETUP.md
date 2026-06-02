# Настройка Google OAuth для Docker

## Проблема
Ошибка: `redirect_uri_mismatch` - Google не может перенаправить пользователя обратно в приложение.

## Решение

### 1. Настройка Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

2. Найдите ваш OAuth 2.0 Client ID:
   - Client ID: `73122433874-r39hduh02r7mi35mkr7e0g6p9p2odgft.apps.googleusercontent.com`

3. Нажмите на него для редактирования

4. В разделе **"Authorized redirect URIs"** добавьте:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

5. Если будете использовать на продакшене, добавьте также:
   ```
   https://ваш-домен.com/api/auth/callback/google
   ```

6. Нажмите **"Save"** (Сохранить)

### 2. Перезапуск Docker контейнера

После настройки Google Console, перезапустите контейнер:

```powershell
# Остановить и удалить старый контейнер
docker stop miss-kurochka-app
docker rm miss-kurochka-app

# Запустить новый контейнер
.\docker-run.ps1
```

### 3. Проверка

1. Откройте http://localhost:3000
2. Нажмите "Вход через Google"
3. Выберите аккаунт Google
4. Должно успешно войти в систему

## Важные моменты

- **Callback URL** должен точно совпадать: `http://localhost:3000/api/auth/callback/google`
- Если используете другой порт, измените URL соответственно
- Для продакшена используйте HTTPS: `https://домен.com/api/auth/callback/google`
- После изменений в Google Console может потребоваться несколько минут для применения

## Проверка текущих настроек

Проверьте, что в Google Console указаны правильные URI:

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
```

## Если проблема сохраняется

1. Очистите кэш браузера
2. Попробуйте в режиме инкогнито
3. Проверьте логи контейнера:
   ```powershell
   docker logs miss-kurochka-app
   ```
4. Убедитесь, что переменные окружения правильно установлены:
   ```powershell
   docker exec miss-kurochka-app env | Select-String "NEXTAUTH"
   ```
