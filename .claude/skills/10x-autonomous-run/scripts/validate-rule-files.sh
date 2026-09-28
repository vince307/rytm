#!/usr/bin/env bash
# Step 0 of every autonomous run: check that the files EVERY agent reads assert
# only paths that actually exist. (Ported from 10xDevs, where CLAUDE.md pointed
# at asset directories that did not exist and ~32 agent steps read it.)
#
# Handles what a naive grep gets wrong: filename prefixes on multi-file grep,
# {a,b} brace patterns, template placeholders and npm scopes. A validator that
# cries wolf on a clean repo teaches you to ignore it.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || { echo "FAIL: not inside a git repo"; exit 1; }

FILES=(CLAUDE.md AGENTS.md context/foundation/design-kit.md)
for extra in context/runs/*/agent-contract.md .claude/skills/10x-autonomous-run/references/agent-contract.md; do
  [ -f "$extra" ] && FILES+=("$extra")
done

# Asserted on purpose although absent — each with the reason. Keep this list
# short; every entry is a path an agent may be told about and not find.
ALLOW=(
  src/components/hooks   # CLAUDE.md convention: where hooks go once one is extracted
  src/lib/services       # CLAUDE.md convention: where extracted business logic goes
  context/runs           # created by the skill at run start (gitignored)
  docs/asset-map.json    # design-kit.md: relative to design/rytm-os/react-kit/
  docs/content.json      #   ditto
  docs/routes.md         #   ditto
)

missing=0; checked=0; skipped=0

expand() { # expand a single {a,b,c} group
  local p="$1"
  if [[ "$p" =~ ^(.*)\{([^}]*)\}(.*)$ ]]; then
    local pre="${BASH_REMATCH[1]}" alts="${BASH_REMATCH[2]}" post="${BASH_REMATCH[3]}"
    local IFS=,; for a in $alts; do echo "${pre}${a}${post}"; done
  else
    echo "$p"
  fi
}

for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "MISSING RULE FILE: $f"; missing=$((missing+1)); continue; }
  while read -r raw; do
    raw="${raw%%[\`,\)\.]}"
    [ -z "$raw" ] && continue
    while read -r p; do
      p="${p%/}"
      case "$p" in
        *-|*\**)                          skipped=$((skipped+1)); continue ;;  # prefixes and globs
        *YYYY*|*HHmm*|*'<'*|*'>'*|*:*)    skipped=$((skipped+1)); continue ;;
      esac
      [[ " ${ALLOW[*]} " == *" $p "* ]] && { skipped=$((skipped+1)); continue; }
      grep -qF "@$p" "$f" && { skipped=$((skipped+1)); continue; }
      checked=$((checked+1))
      [ -e "$p" ] || { echo "MISSING: $p   (asserted in $f)"; missing=$((missing+1)); }
    done < <(expand "$raw")
  # Leading delimiter class is load-bearing: stops `scripts/x` matching inside
  # `.claude/skills/…/scripts/x`.
  done < <(grep -hoE '(^|[ `"(<[])(\.claude|\.github|design|public|src|docs|supabase|context|test|scripts)/[A-Za-z0-9_{},*/.-]+' "$f" \
             | sed -E 's/^[ `"(<[]//' | sort -u)
done

echo "---"
echo "rule files: ${#FILES[@]} · paths checked: $checked · patterns skipped: $skipped · missing: $missing"
if [ "$missing" -gt 0 ]; then
  echo "FAIL — fix and COMMIT these before starting a run. Every agent reads these files."
  exit 1
fi
echo "PASS — every path asserted by the rule files exists."
