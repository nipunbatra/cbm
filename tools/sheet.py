#!/usr/bin/env python3
"""sheet.py — 2-column contact sheet of stills: sheet.py out.jpg a.jpg b.jpg ..."""
import subprocess, sys
out, files = sys.argv[1], sys.argv[2:]
n = len(files)
args = sum([['-i', f] for f in files], [])
fl = ''.join(f'[{i}]scale=960:540[v{i}];' for i in range(n))
lay = '|'.join(f'{(i % 2) * 960}_{(i // 2) * 540}' for i in range(n))
fl += ''.join(f'[v{i}]' for i in range(n)) + (f'xstack=inputs={n}:layout={lay}' if n > 1 else 'null')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', fl, '-q:v', '4', out], check=True)
