#!/bin/sh
# render_watch.sh: live progress of a render log (percent, frames, elapsed, estimated time left), one line every 10 s.
#   tools/render_watch.sh "/Volumes/Extreme SSD/cbm-film/render_4k_v4.log"
LOG="${1:-/Volumes/Extreme SSD/cbm-film/render_4k_v4.log}"
echo "CBM film render: $LOG"
while true; do
  L=$(/usr/bin/grep -E 'frames|wrote' "$LOG" | /usr/bin/tail -1)
  case "$L" in *wrote*) echo "DONE: $L"; break;; esac
  echo "$L" | /usr/bin/awk -v now="$(/bin/date +%H:%M:%S)" '{ split($4, f, "/"); d=f[1]; tot=f[2]; el=$5;
    if (d > 0) printf "%s  %s done  %d of %d frames  elapsed %d min  about %d min left\n", now, $2, d, tot, el/60, el*(tot-d)/d/60;
    else printf "%s  starting...\n", now }'
  sleep 10
done
