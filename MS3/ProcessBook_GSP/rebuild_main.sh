#!/usr/bin/env bash
set -euo pipefail
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_MAIN="$BASE_DIR/main.html"
OUT_ROOT="$BASE_DIR/../ProcessBook_GSP_source.html"

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
  "$BASE_DIR/tail.html" \
  > "$OUT_MAIN"

cp "$OUT_MAIN" "$OUT_ROOT"
echo "Built: $OUT_MAIN"
echo "Synced: $OUT_ROOT"
