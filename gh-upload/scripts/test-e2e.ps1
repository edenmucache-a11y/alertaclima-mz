# scripts/test-e2e.ps1
#
# Teste end-to-end do backend.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\test-e2e.ps1
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3001'

function Check {
    param([string]$Name, [scriptblock]$Block)
    Write-Host "`n── $Name ──" -ForegroundColor Cyan
    try {
        & $Block
        Write-Host "✓ $Name" -ForegroundColor Green
    } catch {
        Write-Host "✗ $Name — $($_.Exception.Message)" -ForegroundColor Red
    }
}

Check 'Health check' {
    $r = Invoke-RestMethod "$base/api/health" -TimeoutSec 5
    Write-Host "Resposta: $($r | ConvertTo-Json -Compress)"
    if (-not $r.ok) { throw 'health não está ok' }
}

Check 'Listar alertas' {
    $r = Invoke-RestMethod "$base/api/alerts" -TimeoutSec 10
    Write-Host "Total: $($r.count) alertas"
    $r.alerts | Select-Object -First 3 location, severity, rainfallMm, windKmh | Format-Table | Out-String | Write-Host
}

Check 'Detalhe de Maputo' {
    try {
        $r = Invoke-RestMethod "$base/api/alerts/maputo" -TimeoutSec 5
        Write-Host "Maputo: $($r.severity) — $($r.description)"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 404) { Write-Host 'Maputo ainda não está no cache — execute /api/alerts/refresh primeiro' }
        else { throw }
    }
}

Check 'Refresh do cache' {
    $r = Invoke-RestMethod -Method POST "$base/api/alerts/refresh" -TimeoutSec 30
    Write-Host "Resposta: $($r | ConvertTo-Json -Compress)"
}

Check 'Push de teste (mock se FCM não configurado)' {
    $body = @{
        tokens = @('mock-token-1', 'mock-token-2')
        location = 'Maputo'
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST "$base/api/push/test" `
        -ContentType 'application/json' -Body $body -TimeoutSec 10
    Write-Host "Resposta: $($r | ConvertTo-Json -Compress)"
}

Check 'Stats de subscritores' {
    $r = Invoke-RestMethod "$base/api/push/stats" -TimeoutSec 5
    Write-Host "Resposta: $($r | ConvertTo-Json -Compress)"
}

Write-Host "`n✓ Teste end-to-end concluído." -ForegroundColor Green
