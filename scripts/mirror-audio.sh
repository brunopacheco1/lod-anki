#!/usr/bin/env bash
# Mirrors the lod.lu pronunciations of all extracted words as mp3 files, for decks with online audio
# (Anki cannot play lod.lu's m4a files in a card's audio player). Files already in the mirror are kept,
# so after the first run only new pronunciations are fetched from lod.lu.
# Usage: scripts/mirror-audio.sh <lod data folder> <mirror folder>
# MIRROR_LIMIT=<n> fetches at most n new files (for test runs).
set -euo pipefail

DATA="$1"
MIRROR="$2"
AUDIO="$MIRROR/audio"
mkdir -p "$AUDIO"

node -e '
  const fs = require("fs"), path = require("path");
  const words = path.join(process.argv[1], "words");
  const audios = new Set();
  for (const file of fs.readdirSync(words)) {
    for (const type of JSON.parse(fs.readFileSync(path.join(words, file))).types) {
      if (type.details.audio) audios.add(type.details.audio);
    }
  }
  console.log([...audios].sort().join("\n"));
' "$DATA" > audio-list.txt

: > audio-missing.txt
while read -r audio; do
  [ -f "$AUDIO/${audio%.m4a}.mp3" ] || echo "$audio" >> audio-missing.txt
done < audio-list.txt
if [ -n "${MIRROR_LIMIT:-}" ]; then
  head -n "$MIRROR_LIMIT" audio-missing.txt > audio-todo.txt
else
  cp audio-missing.txt audio-todo.txt
fi
echo "Audio: $(wc -l < audio-list.txt) referenced, $(wc -l < audio-missing.txt) not mirrored yet, fetching $(wc -l < audio-todo.txt)"

mirror_one() {
  local audio="$1" tmp
  tmp="$(mktemp --suffix=.m4a)"
  if curl -sSf --retry 2 -A "lod-anki (https://github.com/brunopacheco1/lod-anki)" -o "$tmp" "https://lod.lu/uploads/AAC/$audio" 2>/dev/null \
    && ffmpeg -loglevel error -nostdin -y -i "$tmp" -ac 1 -b:a 48k "$AUDIO/${audio%.m4a}.mp3"; then
    :
  else
    echo "Not mirrored: $audio"
  fi
  rm -f "$tmp"
}
export -f mirror_one
export AUDIO
xargs -P 8 -I{} bash -c 'mirror_one "$@"' _ {} < audio-todo.txt

touch "$MIRROR/.nojekyll"
cat > "$MIRROR/index.html" <<'HTML'
<!doctype html><meta charset="utf-8"><title>lod-anki audio</title>
<p>mp3 copies of the <a href="https://lod.lu">lod.lu</a> pronunciations, played by <a href="https://github.com/brunopacheco1/lod-anki">lod-anki</a> decks with online audio.</p>
HTML
echo "Mirror: $(find "$AUDIO" -name '*.mp3' | wc -l) files, $(du -sh "$AUDIO" | cut -f1)"
