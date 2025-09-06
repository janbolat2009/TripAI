# Установка переменных
$apiKey = "b2e1d394bf3c59ccb73839832a02e9c1"
$secret = "6803403309"
$timestamp = [Math]::Floor([datetime]::UtcNow.Subtract([datetime]::new(1970, 1, 1)).TotalSeconds)
$signature = (Get-FileHash -InputStream ([IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes("$apiKey$secret$timestamp"))) -Algorithm SHA256).Hash.ToLower()

# Выполнение запроса
try {
    $response = Invoke-RestMethod -Uri "https://api.test.hotelbeds.com/hotel-api/1.0/status" `
        -Method Get `
        -Headers @{
            "Accept" = "application/json"
            "Api-key" = $apiKey
            "X-Signature" = $signature
        } `
        -ErrorAction Stop
    # Форматированный вывод
    $response | ConvertTo-Json -Depth 4
} catch {
    Write-Host "Ошибка: $_"
}