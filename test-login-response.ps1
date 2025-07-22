# Script para verificar resposta de login
$loginData = Get-Content 'test-login.json' | ConvertFrom-Json
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -Body ($loginData | ConvertTo-Json) -ContentType 'application/json'
Write-Host "Resposta completa:"
$loginResponse | ConvertTo-Json -Depth 5
Write-Host "\nToken encontrado:"
Write-Host $loginResponse.token