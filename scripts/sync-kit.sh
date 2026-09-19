#!/usr/bin/env bash
# Copies the design kit's React handoff into the app. Re-run after every kit delivery.
# design/ is read-only; this script only reads from it.
set -euo pipefail
cd "$(dirname "$0")/.."
KIT=design/rytm-os/react-kit
rm -rf public/rytm
mkdir -p public/rytm
cp -R "$KIT/assets/." public/rytm/
find public/rytm -name .DS_Store -delete
# brand.css verbatim, except the font path now points at public/rytm.
sed 's#url("../assets/fonts/Manrope-Variable.ttf")#url("/rytm/fonts/Manrope-Variable.ttf")#' "$KIT/styles/brand.css" > src/styles/brand.css
echo "kit synced: $(find public/rytm -type f | wc -l | tr -d ' ') assets, src/styles/brand.css"
