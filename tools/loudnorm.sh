#!/bin/bash
# loudnorm.sh — two-pass EBU R128 normalisation of the voice track to -16 LUFS, true peak -1.5 dBTP.
# Reads narration/voice.wav (from tools/timeline.py), writes public/voice.wav (used by the film).
set -euo pipefail
cd "$(dirname "$0")/.."
J=$(ffmpeg -hide_banner -i narration/voice.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i narration/voice.wav -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 -c:a pcm_s16le public/voice.wav
ffmpeg -hide_banner -i public/voice.wav -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
