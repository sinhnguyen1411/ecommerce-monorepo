#!/usr/bin/env sh
set -eu

copy_if_missing() {
  example="$1"
  target="$2"

  if [ ! -f "$example" ]; then
    echo "Missing template file: $example" >&2
    exit 1
  fi

  if [ -f "$target" ]; then
    echo "Skip existing $target"
    return
  fi

  cp "$example" "$target"
  echo "Created $target"
}

copy_if_missing "infra/env/mysql.env.example" "infra/env/mysql.env"
copy_if_missing "infra/env/api.env.example" "infra/env/api.env"
copy_if_missing "infra/env/web.env.example" "infra/env/web.env"

echo "Bootstrap complete. Review infra/env/*.env before running the stack."
