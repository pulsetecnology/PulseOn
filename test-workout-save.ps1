# Script para testar salvamento de treino
$loginData = Get-Content 'test-login.json' | ConvertFrom-Json
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -Body ($loginData | ConvertTo-Json) -ContentType 'application/json'
$token = $loginResponse.token
Write-Host "Token obtido: $token"

$workoutData = Get-Content 'test-workout-save.json'
Write-Host "Enviando dados do treino..."

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/workout-sessions' -Method POST -Body $workoutData -ContentType 'application/json' -Headers @{'Authorization' = "Bearer $token"}
    Write-Host "Sucesso!"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}