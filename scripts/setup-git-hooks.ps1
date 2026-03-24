$ErrorActionPreference = "Stop"

$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
  throw "Unable to resolve repository root."
}

Set-Location $repoRoot
git config core.hooksPath .githooks
git config core.autocrlf false

if ($IsLinux -or $IsMacOS) {
  try {
    chmod +x .githooks/pre-commit ./scripts/setup-git-hooks.sh | Out-Null
  } catch {
    # Ignore chmod failures in constrained environments.
  }
}

Write-Host "Configured core.hooksPath=.githooks"
Write-Host "Configured core.autocrlf=false (repo local)"
Write-Host "Pre-commit will run:"
Write-Host "  - node scripts/check-mojibake-repo.mjs"
Write-Host "  - cd apps/web && npm run check:mojibake"
Write-Host "  - cd apps/web && npm run lint:errors"
