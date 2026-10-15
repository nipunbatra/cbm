#!/bin/bash
# build.sh — the whole pipeline, in order. Any failing check stops the build.
#   tools/build.sh                 data, tests, narration, timeline, captions (no render)
#   tools/build.sh animatic|1080|4k|4k-cc   ...then render that master to $CBM_OUT (default /Volumes/Extreme SSD/cbm-film)
set -euo pipefail
cd "$(dirname "$0")/.."
tools/check_env.sh >/dev/null || { tools/check_env.sh | grep MISSING; exit 1; }
source ~/.zsh_secrets >/dev/null 2>&1 || true
PY="${CBM_PY:-$HOME/base/bin/python}"   # pinned in requirements.txt
export TMPDIR="${CBM_TMP:-/Volumes/Extreme SSD/cbm-film/tmp}"   # the internal disk is nearly full
echo "== numbers";    $PY math/data.py >/dev/null
echo "== narration";  $PY narration/compile.py          # before the tests: test_narration reads script.json
echo "== tests";      $PY -m pytest -q -W ignore math/numerical_validation.py math/test_narration.py
python3 tools/tts.py . --jobs 6 | tail -1          # only beats without audio
echo "== timeline";   $PY tools/timeline.py . --tempo 1.12 | head -1
tools/loudnorm.sh
python3 tools/asr_beats.py                   # every beat as heard in the final voice track; fails on unreviewed suspects
$PY tools/music.py                          # light ambient bed, ducked under the voice -> public/mix.wav
$PY tools/captions.py
$PY tools/narration_md.py >/dev/null; $PY tools/beats.py
echo "== types";      npx tsc --noEmit -p .
if [ $# -gt 0 ]; then node tools/render.mjs "$1"; fi
