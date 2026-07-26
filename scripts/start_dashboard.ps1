$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "dashboard_config.ps1")
$config = Get-DashboardConfig -RepoRoot $repoRoot

$listeners = @(Get-NetTCPConnection -LocalPort $config.Port -State Listen -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) {
  $owners = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  throw "Dashboard-poort $($config.Port) is bezet door pid(s): $($owners -join ', '). Gebruik npm run restart."
}

Push-Location $repoRoot
try {
  python scripts/generate_runtime_config.py
  if ($LASTEXITCODE -ne 0) { throw "Runtimeconfiguratie genereren is mislukt." }
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "Dashboard-build is mislukt." }
  Write-Host "LeerpretDashboard: $($config.Url)"
  python scripts/serve_dashboard.py $config.Port --bind $config.Host --directory dist
}
finally {
  Pop-Location
}
