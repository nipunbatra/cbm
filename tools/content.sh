#!/bin/sh
# content.sh: after editing narration/scenes/*.txt, rebuild everything that derives from the content files
# (script.json, docs/lecture.md, the provisional timeline, docs/beats.txt) and check the spoken numbers.
cd "$(dirname "$0")/.." && ~/base/bin/python narration/compile.py && ~/base/bin/python tools/timeline_est.py \
  && ~/base/bin/python tools/beats.py . && ~/base/bin/python -m pytest -q math/test_narration.py 2>&1 | tail -1
