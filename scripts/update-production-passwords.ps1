# Скрипт для обновления паролей филиалов на production (Windows PowerShell)
# Использование: .\scripts\update-production-passwords.ps1 -ProductionUrl "postgresql://..."

param(
    [Parameter(Mandatory=$false)]
    [string]$ProductionUrl = $env:PRODUCTION_DATABASE_URL
)

Write-Host "🔐 Обновление паролей филиалов на Production" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Проверка наличия production DATABASE_URL
if ([string]::IsNullOrEmpty($ProductionUrl)) {
    Write-Host "⚠️  PRODUCTION_DATABASE_URL не установлен!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Установите переменную окружения:" -ForegroundColor White
    Write-Host "`$env:PRODUCTION_DATABASE_URL='postgresql://...'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Или запустите скрипт с параметром:" -ForegroundColor White
    Write-Host ".\scripts\update-production-passwords.ps1 -ProductionUrl 'postgresql://...'" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Сохранить текущий DATABASE_URL
$originalUrl = $env:DATABASE_URL

try {
    # Временно использовать production URL
    $env:DATABASE_URL = $ProductionUrl
    
    Write-Host "✅ Используется production база данных" -ForegroundColor Green
    Write-Host ""
    
    # Запустить скрипт обновления
    npx tsx scripts/set-branch-password.ts
    
    Write-Host ""
    Write-Host "✅ Готово! Пароли обновлены на production" -ForegroundColor Green
    Write-Host ""
    Write-Host "Проверьте вход на:" -ForegroundColor Cyan
    Write-Host "https://miss-kurochka.com/branch/signin" -ForegroundColor White
    Write-Host ""
    Write-Host "Логины: branch1@gmail.com, branch2@gmail.com, branch3@gmail.com" -ForegroundColor White
    Write-Host "Пароль: 123123" -ForegroundColor Yellow
    
} finally {
    # Вернуть оригинальный DATABASE_URL
    $env:DATABASE_URL = $originalUrl
}
