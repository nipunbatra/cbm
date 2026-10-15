#!/bin/sh
# Compile review content without touching the film's saved timing or audio.
# The deck previews changed narration in memory; docs/beats.txt remains the last film timing.
set -eu
cd "$(dirname "$0")/.."
~/base/bin/python narration/compile.py
~/base/bin/python -m pytest -q math/test_narration.py
