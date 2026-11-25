#!/bin/bash
# usage: gen_one.sh SLOT [extra images...]
set -u
SLOT="$1"; shift
BASE=~/workspace/ai-orchestra
PROMPT="$BASE/3-Sync/game/artifacts/gallery-hair-fix/prompts/$SLOT.txt"
ARGS=(
  -i "$BASE/art-src/gallery/refs/ref_luarie_body.jpg"
  -i "$BASE/art-src/gallery/refs/ref_echan_body.jpg"
  -i "$BASE/art-src/gallery/refs/ref_mimi_body.jpg"
  -i "$BASE/art-src/gallery/$SLOT.png"
)
for extra in "$@"; do ARGS+=( -i "$extra" ); done
cd "$BASE" && cat "$PROMPT" | ~/.local/bin/codex exec --skip-git-repo-check --sandbox workspace-write "${ARGS[@]}" - > "/tmp/codex_$SLOT.log" 2>&1
echo "exit=$? slot=$SLOT"
ls -la "$BASE/art-src/gallery/${SLOT}_v2.png" 2>/dev/null || echo "MISSING ${SLOT}_v2.png"
