param(
  [string]$AuthBaseUrl = "http://localhost:8080",
  [string]$KebunBaseUrl = "http://localhost:8081",
  [string]$HasilPanenBaseUrl = "http://localhost:8082",
  [string]$AdminEmail = "admin@mysawit.com",
  [string]$AdminPassword = "admin123"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/4] Sign in to Auth: $AuthBaseUrl/api/auth/signin"
$signinBody = @{ email = $AdminEmail; password = $AdminPassword } | ConvertTo-Json
$signin = Invoke-RestMethod -Method Post -Uri "$AuthBaseUrl/api/auth/signin" -ContentType "application/json" -Body $signinBody
if (-not $signin.token) {
  throw "Failed to get token from signin response"
}
$token = $signin.token

Write-Host "[2/4] Call protected Auth endpoint: $AuthBaseUrl/api/users/me"
$me = Invoke-RestMethod -Method Get -Uri "$AuthBaseUrl/api/users/me" -Headers @{ Authorization = "Bearer $token" }
$me | ConvertTo-Json -Depth 10

Write-Host "[3/4] Call Kebun endpoint: $KebunBaseUrl/kebun"
$kebun = Invoke-RestMethod -Method Get -Uri "$KebunBaseUrl/kebun"
$kebun | ConvertTo-Json -Depth 10

Write-Host "[4/4] Call Hasil Panen endpoint: $HasilPanenBaseUrl/health"
$health = Invoke-RestMethod -Method Get -Uri "$HasilPanenBaseUrl/health"
$health | ConvertTo-Json -Depth 10

Write-Host "Smoke test passed"
