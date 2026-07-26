$ErrorActionPreference = "Stop"

function Read-DashboardDotEnv {
  param([string] $Path)

  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) { return $values }
  foreach ($rawLine in Get-Content -LiteralPath $Path) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { continue }
    $name, $value = $line.Split("=", 2)
    $values[$name.Trim()] = $value.Trim().Trim('"').Trim("'")
  }
  return $values
}

function Get-DashboardConfig {
  param([string] $RepoRoot)

  $defaults = Read-DashboardDotEnv (Join-Path $RepoRoot ".env.example")
  $local = Read-DashboardDotEnv (Join-Path $RepoRoot ".env")
  $urlText = [Environment]::GetEnvironmentVariable("LEERPRET_DASHBOARD_URL")
  if (-not $urlText) { $urlText = $local["LEERPRET_DASHBOARD_URL"] }
  if (-not $urlText) { $urlText = $defaults["LEERPRET_DASHBOARD_URL"] }
  if (-not $urlText) { throw "LEERPRET_DASHBOARD_URL ontbreekt in .env." }

  try { $url = [Uri] $urlText } catch { throw "Ongeldige LEERPRET_DASHBOARD_URL: '$urlText'." }
  if ($url.Scheme -notin @("http", "https") -or -not $url.Host -or $url.IsDefaultPort) {
    throw "LEERPRET_DASHBOARD_URL moet een absolute URL met expliciete poort zijn."
  }

  return [PSCustomObject]@{
    Url = $urlText.TrimEnd("/") + "/"
    Host = $url.Host
    Port = $url.Port
  }
}

