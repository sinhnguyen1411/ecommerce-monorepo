#!/usr/bin/env sh
set -eu

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

git config core.hooksPath .githooks
git config core.autocrlf false
chmod +x .githooks/pre-commit ./scripts/setup-git-hooks.sh 2>/dev/null || true

echo "Configured core.hooksPath=.githooks"
echo "Configured core.autocrlf=false (repo local)"
echo "Pre-commit will run:"
echo "  - node scripts/check-mojibake-repo.mjs"
echo "  - cd apps/web && npm run check:mojibake"
echo "  - cd apps/web && npm run lint:errors"
