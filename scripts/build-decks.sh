#!/usr/bin/env bash
# Builds the ready-made decks from their definitions.
# Usage: scripts/build-decks.sh <lod data folder> <output folder>
set -euo pipefail

DATA="$1"
OUTPUT="$2"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

DECKS=(
  schwatzt_dir_letzebuergesh/per_book/schwatzt_dir_letzebuergesh.json
  schwatzt_dir_letzebuergesh/per_book/a1.json
  schwatzt_dir_letzebuergesh/per_book/a2.json
  schwatzt_dir_letzebuergesh/per_book/b1.json
  schwatzt_dir_letzebuergesh/per_word_type/nouns.json
  schwatzt_dir_letzebuergesh/per_word_type/verbs.json
  schwatzt_dir_letzebuergesh/per_word_type/adjectives.json
  schwatzt_dir_letzebuergesh/per_word_type/adverbs.json
)

mkdir -p "$OUTPUT"
: > "$OUTPUT/build.log"
for deck in "${DECKS[@]}"; do
  target="$OUTPUT/$(dirname "$deck")"
  mkdir -p "$target"
  echo "::group::$deck"
  node "$ROOT/lib/index.js" export "$ROOT/decks/definitions/$deck" --data "$DATA" -o "$target" 2>&1 \
    | { grep -v -E '^ *[ _|/\\]+' || true; } | tee -a "$OUTPUT/build.log"
  echo "::endgroup::"
done

echo "Words not found in the LOD data:"
grep ' not found!' "$OUTPUT/build.log" | sort | uniq -c | sort -rn || echo "  none"
