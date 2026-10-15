#!/bin/bash
# check_env.sh — verify the machine-specific prerequisites of a rebuild before spending hours on it.
#   tools/check_env.sh            exits non-zero and lists every missing piece
# Override paths with: CBM_PY (python), CBM_OUT (render output), CBM_TMP (scratch), REMOTION_CHROME (browser).
cd "$(dirname "$0")/.."
PY="${CBM_PY:-$HOME/base/bin/python}"
OUT="${CBM_OUT:-/Volumes/Extreme SSD/cbm-film}"
TMP="${CBM_TMP:-/Volumes/Extreme SSD/cbm-film/tmp}"
CHROME="${REMOTION_CHROME:-$HOME/.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell}"
fail=0
ok() { echo "ok    $1"; }
bad() { echo "MISSING $1"; fail=1; }

[ -x "$PY" ] && ok "python: $PY" || bad "python at $PY (set CBM_PY)"
if [ -x "$PY" ]; then
  while read -r req; do
    pkg="${req%%==*}"; want="${req##*==}"
    have=$("$PY" -c "import importlib.metadata as m; print(m.version('$pkg'))" 2>/dev/null)
    [ "$have" = "$want" ] && ok "$pkg $have" || bad "$pkg==$want (have: ${have:-none}); pip install -r requirements.txt"
  done < requirements.txt
fi
command -v node >/dev/null && ok "node $(node --version)" || bad "node"
command -v ffmpeg >/dev/null && ok "ffmpeg" || bad "ffmpeg"
command -v tesseract >/dev/null && ok "tesseract" || bad "tesseract (frame OCR QA only)"
[ -d node_modules/remotion ] && ok "node_modules" || bad "node_modules (npm ci)"
[ -x "$CHROME" ] && ok "chrome-headless-shell" || bad "chrome-headless-shell at $CHROME (npx remotion browser ensure; set REMOTION_CHROME)"
for f in "Avenir Next" "JetBrains Mono"; do
  system_profiler SPFontsDataType 2>/dev/null | grep -q "Family: $f" && ok "font: $f" || bad "font: $f (layout depends on it)"
done
[ -d "$OUT" ] && ok "render output dir: $OUT" || bad "render output dir $OUT (set CBM_OUT)"
mkdir -p "$TMP" 2>/dev/null && ok "scratch dir: $TMP" || bad "scratch dir $TMP (set CBM_TMP)"
[ -n "$GEMINI_API_KEY" ] || source ~/.zsh_secrets >/dev/null 2>&1
[ -n "$GEMINI_API_KEY" ] && ok "GEMINI_API_KEY (TTS, ASR)" || bad "GEMINI_API_KEY (TTS, ASR)"
for f in public/mix.wav public/voice.wav; do
  [ -e "$f" ] && ok "$f" || echo "note  $f not built yet (tools/build.sh makes it)"
done
free=$(df -k "$TMP" 2>/dev/null | awk 'NR==2 {print int($4/1048576)}')
[ "${free:-0}" -ge 20 ] && ok "scratch free space ${free} GB" || bad "scratch free space ${free:-?} GB (renders need about 20 GB)"
exit $fail
