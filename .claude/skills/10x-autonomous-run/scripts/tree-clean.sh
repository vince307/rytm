#!/usr/bin/env bash
# The ONE definition of "clean working tree" for an autonomous run.
#
# Clean = `git status --porcelain` is empty apart from the maintainer's own
# uncommitted entries in ALLOW (carried across branches on purpose, never staged).
# Every gate calls this script — v1 had two definitions (the contract allowed the
# maintainer's files, a gate did not) and failed a finished slice on it.
#
# Exit 0 + "CLEAN" when clean; exit 1 + the offending lines otherwise.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# The maintainer adds entries here when a run must start with their own work uncommitted
# (e.g. ' M .gitignore'), and removes them once committed. Empty = strictly clean.
ALLOW=()

dirty=0
while IFS= read -r line; do
  [ -z "$line" ] && continue
  ok=0
  for a in ${ALLOW[@]+"${ALLOW[@]}"}; do   # bash 3.2 (macOS) + set -u chokes on an empty "${ALLOW[@]}"
    [ "$line" = "$a" ] && ok=1 && break
  done
  if [ "$ok" -eq 0 ]; then
    echo "DIRTY: $line"
    dirty=1
  fi
done < <(git status --porcelain)

if [ "$dirty" -eq 0 ]; then
  echo CLEAN
else
  exit 1
fi
