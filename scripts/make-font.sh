#!/bin/sh
# Subsets Noto Serif CJK JP (SIL OFL 1.1) to the kana + every character used in the UI and curated data,
# so headings and the kana chart render in a real Mincho everywhere (offline, in the APK) for ~100 KB.
# Kanji in the large word lists fall back to the system serif per glyph.
set -eu
PY=${PY:-python3}
SRC_R=${SRC_R:-/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc}
SRC_B=${SRC_B:-/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc}
mkdir -p src/assets/fonts
cat src/*.tsx src/pages/*.tsx src/components/*.tsx src/data/kana.ts src/lib/*.ts data/legacy/curated.json index.html > /tmp/kotonoha-chars.txt
for f in R; do
  eval src=\$SRC_$f
  out=src/assets/fonts/mincho-$([ $f = R ] && echo 400 || echo 700).woff2
  # font-number 0 = JP in the Noto CJK collection
  $PY -m fontTools.subset "$src" --font-number=0 --text-file=/tmp/kotonoha-chars.txt \
    --unicodes="U+3000-30FF,U+FF01-FF5E,U+0020-007E" --layout-features='kern,palt,ccmp,locl' --no-hinting --desubroutinize --flavor=woff2 --output-file="$out"
done
ls -la src/assets/fonts
