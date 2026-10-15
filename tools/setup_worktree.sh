#!/bin/sh
# setup_worktree.sh: make a fresh checkout or worktree of this repo runnable (Codex, Claude Code, or a second clone).
# Links the shared node_modules and the large media kept outside git (audio, renders, QA stills on the SSD).
#   sh tools/setup_worktree.sh
set -e
cd "$(dirname "$0")/.."
HOME_REPO="$HOME/git/dl-summaries"   # node_modules is shared with the DETR film there
SSD="/Volumes/Extreme SSD/cbm-film"
[ -e node_modules ] || ln -s "$HOME_REPO/detr/node_modules" node_modules
[ -e qa ] || ln -s "$SSD/cbm-qa" qa
[ -e out ] || ln -s "$SSD/cbm-out" out
[ -e narration/seg ] || ln -s "$SSD/audio/seg" narration/seg
for f in voice mix; do [ -e "public/$f.wav" ] || ln -s "$SSD/audio/public_$f.wav" "public/$f.wav"; done
echo "ready: node_modules -> $(readlink node_modules)"
[ -d "$SSD" ] || echo "note: the SSD is not mounted; slides still build, audio and renders need it"
