#!/usr/bin/env bash
# Measure the baseline on the current checkout and print one line the orchestrator
# pastes into the run's agent-contract.md (and a table row for run-log.md).
#
# Run it at preflight on main, and AGAIN on main after every ship — agents measure
# deltas against the latest shipped main, never a run-start snapshot (the 2026-09-27
# run found an agent reasoning against a baseline one slice old).
#
# Needs: local Supabase up, sandbox DISABLED (Docker, 127.0.0.1:54321), ports 4398 free.
# Never touches :4321 (the maintainer's astro dev). ~4 min.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
PORT=4398
LOG="${TMPDIR:-/tmp}/rytm-baseline.$$"
mkdir -p "$LOG"

sha=$(git rev-parse --short HEAD)
lint=$(npm run lint >"$LOG/lint" 2>&1 && echo "0 errors" || echo "FAIL")
check=$(npx astro check 2>&1 | tee "$LOG/check" | grep -Eo 'Result \([0-9]+ files\)' | grep -Eo '[0-9]+')
check_err=$(grep -Eo '^- [0-9]+ errors' "$LOG/check" | grep -Eo '[0-9]+' | head -1)
fixture=$(npm run fixture:check >"$LOG/fixture" 2>&1 && echo OK || echo FAIL)
vitest=$(npm test 2>&1 | tee "$LOG/vitest" | grep -E '^ +Tests ' | grep -Eo '[0-9]+ passed' | head -1)
vfiles=$(grep -E '^ +Test Files ' "$LOG/vitest" | grep -Eo '[0-9]+ passed' | head -1)
build=$(npm run build >"$LOG/build" 2>&1 && echo OK || echo FAIL)
npx supabase db reset >"$LOG/reset" 2>&1
pgtap=$(npx supabase test db 2>&1 | tee "$LOG/pgtap" | grep -Eo 'Files=[0-9]+, Tests=[0-9]+')
pgres=$(grep -Eo 'Result: [A-Z]+' "$LOG/pgtap")

ASTRO_DEV_BACKGROUND=1 npx astro dev --port "$PORT" --ignore-lock >"$LOG/dev" 2>&1 &
for _ in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$PORT" && break; sleep 1; done
BASE_URL="http://localhost:$PORT" npm run smoke >"$LOG/smoke" 2>&1
smoke_pass=$(grep -c 'PASS' "$LOG/smoke" || true)
smoke_fail=$(grep -c 'FAIL' "$LOG/smoke" || true)
lsof -ti :"$PORT" | xargs kill 2>/dev/null || true

echo "Baseline on \`$(git branch --show-current)\` at $sha: lint $lint; astro check ${check_err:-?} errors (${check:-?} files); fixture:check $fixture; vitest ${vitest:-?} (${vfiles:-?} files); build $build; pgTAP $pgtap $pgres; smoke $smoke_pass PASS / $smoke_fail FAIL"
echo "(logs: $LOG)"
