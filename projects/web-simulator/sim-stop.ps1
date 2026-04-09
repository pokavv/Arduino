#Requires -Version 5.1
<#
.SYNOPSIS
    Arduino 웹 시뮬레이터 종료 스크립트
.DESCRIPTION
    .sim.pid 파일로 프로세스 트리를 종료하고,
    5173 / 3001 포트 점유 프로세스도 추가로 정리합니다.
#>

$SimRoot = $PSScriptRoot
$PidFile = Join-Path $SimRoot ".sim.pid"

Write-Host ""
Write-Host "  [시뮬레이터 종료 중...]" -ForegroundColor Yellow

$killed = $false

# ── 1. PID 파일로 프로세스 트리 종료 ───────────────────────────────────────
if (Test-Path $PidFile) {
    $savedPid = [int](Get-Content $PidFile -Raw).Trim()
    if (Get-Process -Id $savedPid -ErrorAction SilentlyContinue) {
        Write-Host "  PID $savedPid 프로세스 트리 종료..." -ForegroundColor Gray
        taskkill /F /T /PID $savedPid 2>$null | Out-Null
        $killed = $true
    }
    Remove-Item $PidFile -ErrorAction SilentlyContinue
}

# ── 2. 포트 5173 / 3001 점유 프로세스 정리 ─────────────────────────────────
$ports = @(5173, 3001)
foreach ($port in $ports) {
    $result = netstat -ano 2>$null |
        Select-String ":$port\s" |
        Where-Object { $_ -match 'LISTENING' }

    foreach ($line in $result) {
        if ($line -match '\s+(\d+)\s*$') {
            $portPid = [int]$Matches[1]
            if ($portPid -gt 0 -and (Get-Process -Id $portPid -ErrorAction SilentlyContinue)) {
                Write-Host "  포트 $port 점유 PID $portPid 종료..." -ForegroundColor Gray
                Stop-Process -Id $portPid -Force -ErrorAction SilentlyContinue
                $killed = $true
            }
        }
    }
}

# ── 결과 ────────────────────────────────────────────────────────────────────
Write-Host ""
if ($killed) {
    Write-Host "  [완료] 시뮬레이터가 종료되었습니다." -ForegroundColor Green
} else {
    Write-Host "  [알림] 실행 중인 시뮬레이터를 찾지 못했습니다." -ForegroundColor DarkGray
}
Write-Host ""
