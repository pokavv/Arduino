#Requires -Version 5.1
<#
.SYNOPSIS
    Arduino 웹 시뮬레이터 기동 스크립트
    창 닫기 또는 Ctrl+C 로 서버 전체 종료됩니다.
#>

$SimRoot = $PSScriptRoot
$LogDir  = Join-Path $SimRoot "logs"
$LogFile = Join-Path $LogDir ("sim-" + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + ".log")

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

function Log {
    param([string]$msg, [string]$fg = "White")
    $line = "$(Get-Date -Format 'HH:mm:ss') | $msg"
    Write-Host $line -ForegroundColor $fg
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

$banner = @"
========================================
  Arduino Web Simulator
  시작 : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  로그 : $LogFile
========================================
"@
Write-Host $banner -ForegroundColor Cyan
Add-Content -Path $LogFile -Value $banner -Encoding UTF8

# pnpm 확인
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "  [오류] pnpm 을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "         설치: npm install -g pnpm" -ForegroundColor Yellow
    Read-Host "`n  엔터 키로 닫기"
    exit 1
}

Set-Location $SimRoot

# 최초 실행 시 의존성 설치
if (-not (Test-Path "node_modules")) {
    Log "pnpm install 중..." Yellow
    pnpm install
    Log "설치 완료" Green
}

Log "Frontend : http://localhost:5173" Cyan
Log "Backend  : http://localhost:3001" Cyan
Log "창 닫기 또는 Ctrl+C 로 종료" DarkGray
Add-Content -Path $LogFile -Value "" -Encoding UTF8

# pnpm dev 실행
# 같은 콘솔에 붙어 실행되므로 창 닫으면 하위 프로세스 전체 종료됨
try {
    & pnpm dev 2>&1 | ForEach-Object {
        $line = "$(Get-Date -Format 'HH:mm:ss') | $_"
        Write-Host $line
        Add-Content -Path $LogFile -Value $line -Encoding UTF8
    }
} finally {
    $footer = @"

========================================
  종료 : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
========================================
"@
    Write-Host $footer -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value $footer -Encoding UTF8
}
