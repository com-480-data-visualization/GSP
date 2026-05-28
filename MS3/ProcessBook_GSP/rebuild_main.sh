#!/usr/bin/env bash
set -euo pipefail
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_MAIN="$BASE_DIR/main.html"

cat \
  "$BASE_DIR/head.html" \
  "$BASE_DIR/sections/01-cover/section.html" \
  "$BASE_DIR/sections/02-introduction/section.html" \
  "$BASE_DIR/sections/03-visualizations/section.html" \
  "$BASE_DIR/sections/04-implementation-details/section.html" \
  "$BASE_DIR/sections/05-explaining-viz-part-1/section.html" \
  "$BASE_DIR/sections/06-explaining-viz-part-2/section.html" \
  "$BASE_DIR/sections/07-efficiency-over-time/section.html" \
  "$BASE_DIR/sections/08-challenges-peer-assessment/section.html" \
  > "$OUT_MAIN"

printf '\n</body></html>\n' >> "$OUT_MAIN"

echo "Built: $OUT_MAIN"
