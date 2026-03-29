$ErrorActionPreference = "Stop"

$pairs = @(
  @{ Example = "infra/env/mysql.env.example"; Target = "infra/env/mysql.env" },
  @{ Example = "infra/env/api.env.example"; Target = "infra/env/api.env" },
  @{ Example = "infra/env/web.env.example"; Target = "infra/env/web.env" }
)

foreach ($pair in $pairs) {
  if (-not (Test-Path $pair.Example)) {
    throw "Missing template file: $($pair.Example)"
  }

  if (Test-Path $pair.Target) {
    Write-Host "Skip existing $($pair.Target)"
    continue
  }

  Copy-Item $pair.Example $pair.Target
  Write-Host "Created $($pair.Target)"
}

Write-Host "Bootstrap complete. Review infra/env/*.env before running the stack."
