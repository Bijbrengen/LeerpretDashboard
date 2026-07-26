$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "dashboard_config.ps1")
$config = Get-DashboardConfig -RepoRoot $repoRoot

$listenerPids = @(Get-NetTCPConnection -LocalPort $config.Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  Where-Object { $_ -and $_ -gt 0 })
foreach ($listenerPid in $listenerPids) {
  Stop-Process -Id $listenerPid -Force -ErrorAction Stop
}

& (Join-Path $PSScriptRoot "start_dashboard.ps1")
