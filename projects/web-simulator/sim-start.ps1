#Requires -Version 5.1
<#
.SYNOPSIS
    Arduino 웹 시뮬레이터 기동 스크립트
.DESCRIPTION
    pnpm dev 를 실행하고 타임스탬프 로그를 logs/ 에 저장합니다.
    종료: Ctrl+C  또는  .\sim-stop.ps1
#>

param(
    [switch]$SkipInstall   # pnpm install 건너뜀
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── 경로 설정 ──────────────────────────────────────────────────────────────
$SimRoot  = $PSScriptRoot
$LogDir   = Join-Path $SimRoot "logs"
$PidFile  = Join-Path $SimRoot ".sim.pid"
$LogFile  = Join-Path $LogDir ("sim-" + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + ".log")

# ── logs 폴더 생성 ──────────────────────────────────────────────────────────
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# ── 로그 함수 ───────────────────────────────────────────────────────────────
function Write-Log {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoTimestamp
    )
    $line = if ($NoTimestamp) { $Message } else { "$(Get-Date -Format 'HH:mm:ss') | $Message" }
    Write-Host $line -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

# ── 이미 실행 중인지 확인 ───────────────────────────────────────────────────
if (Test-Path $PidFile) {
    $savedPid = [int](Get-Content $PidFile -Raw).Trim()
    if (Get-Process -Id $savedPid -ErrorAction SilentlyContinue) {
        Write-Host ""
        Write-Host "  [!] 이미 실행 중입니다. (PID: $savedPid)" -ForegroundColor Red
        Write-Host "      종료하려면: .\sim-stop.ps1" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    Remove-Item $PidFile -ErrorAction SilentlyContinue
}

# ── 배너 ────────────────────────────────────────────────────────────────────
$banner = @"

========================================
  Arduino Web Simulator
  시작 : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  로그 : $LogFile
========================================
"@
Write-Log $banner -Color Cyan -NoTimestamp

# ── pnpm 존재 확인 ──────────────────────────────────────────────────────────
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Log "[ERROR] pnpm 을 찾을 수 없습니다." -Color Red
    Write-Log "        설치: npm install -g pnpm" -Color Yellow
    exit 1
}

# ── 의존성 설치 ─────────────────────────────────────────────────────────────
Set-Location $SimRoot

if (-not $SkipInstall -and -not (Test-Path "node_modules")) {
    Write-Log "의존성 설치 중 (pnpm install)..." -Color Yellow
    pnpm install
    Write-Log "의존성 설치 완료" -Color Green
}

# ── 시작 안내 ───────────────────────────────────────────────────────────────
Write-Log ""                                   -NoTimestamp
Write-Log "  Frontend : http://localhost:5173" -Color Cyan
Write-Log "  Backend  : http://localhost:3001" -Color Cyan
Write-Log "  Ctrl+C   로 종료"                -Color DarkGray
Write-Log ""                                   -NoTimestamp

# ── 프로세스 실행 ───────────────────────────────────────────────────────────
#   Start-Process + PassThru 로 PID 를 확보하되,
#   출력은 별도 Job 으로 파이프해서 콘솔 + 로그 파일 양쪽에 기록합니다.
$psi = [System.Diagnostics.ProcessStartInfo]@{
    FileName               = "pnpm"
    Arguments              = "dev"
    UseShellExecute        = $false
    RedirectStandardOutput = $true
    RedirectStandardError  = $true
    WorkingDirectory       = $SimRoot
    CreateNoNewWindow      = $true
}

$proc = [System.Diagnostics.Process]::Start($psi)
$proc.Id | Set-Content -Path $PidFile -Encoding UTF8
Write-Log "PID: $($proc.Id)  (.\sim-stop.ps1 으로 종료 가능)" -Color DarkGray

# stdout / stderr 비동기 읽기 → 콘솔 + 로그 동시 출력
$stdoutJob = Start-Job -ScriptBlock {
    param($stream, $logFile)
    while (-not $stream.EndOfStream) {
        $line = $stream.ReadLine()
        $entry = "$(Get-Date -Format 'HH:mm:ss') | $line"
        Write-Output $entry
        Add-Content -Path $logFile -Value $entry -Encoding UTF8
    }
} -ArgumentList $proc.StandardOutput, $LogFile

$stderrJob = Start-Job -ScriptBlock {
    param($stream, $logFile)
    while (-not $stream.EndOfStream) {
        $line = $stream.ReadLine()
        $entry = "$(Get-Date -Format 'HH:mm:ss') | [ERR] $line"
        Write-Output $entry
        Add-Content -Path $logFile -Value $entry -Encoding UTF8
    }
} -ArgumentList $proc.StandardError, $LogFile

# ── 실시간 출력 루프 ────────────────────────────────────────────────────────
try {
    while (-not $proc.HasExited) {
        # Job 출력 -> 현재 콘솔에 flush
        Receive-Job -Job $stdoutJob | ForEach-Object { Write-Host $_ -ForegroundColor White }
        Receive-Job -Job $stderrJob | ForEach-Object { Write-Host $_ -ForegroundColor DarkYellow }
        Start-Sleep -Milliseconds 100
    }
    # 프로세스가 자연 종료된 경우 나머지 출력 flush
    Receive-Job -Job $stdoutJob -Wait | ForEach-Object { Write-Host $_ }
    Receive-Job -Job $stderrJob -Wait | ForEach-Object { Write-Host $_ -ForegroundColor DarkYellow }
}
finally {
    # ── 정리 ─────────────────────────────────────────────────────────────
    Stop-Job  -Job $stdoutJob, $stderrJob -ErrorAction SilentlyContinue
    Remove-Job -Job $stdoutJob, $stderrJob -ErrorAction SilentlyContinue

    if (-not $proc.HasExited) {
        # pnpm 이 spawn 한 자식 프로세스까지 트리 전체 종료
        taskkill /F /T /PID $proc.Id 2>$null | Out-Null
    }

    if (Test-Path $PidFile) { Remove-Item $PidFile -ErrorAction SilentlyContinue }

    $footer = @"

========================================
  종료 : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  로그 : $LogFile
========================================
"@
    Write-Log $footer -Color Yellow -NoTimestamp
}
