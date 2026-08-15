param(
  [switch]$Check
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot
$port = 47112
$url = "http://127.0.0.1:$port/"

foreach ($command in @("python", "npm.cmd")) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "$command is niet gevonden. Installeer eerst de vereiste lokale tooling."
  }
}

if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
  throw "Node-modules ontbreken. Voer eenmalig 'npm install' uit in $repoRoot."
}

$listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) {
  $owners = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  if ($Check) {
    Write-Host "LeerpretDashboard is al actief op $url (pid(s): $($owners -join ', '))"
    return
  }
  throw "Dashboard-poort $port is al bezet door pid(s): $($owners -join ', ')."
}

if ($Check) {
  Write-Host "LeerpretDashboard is startklaar op $url"
  return
}

& (Join-Path $repoRoot "scripts\start_dashboard.ps1")
