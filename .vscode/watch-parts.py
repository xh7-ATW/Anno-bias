"""Re-render annotation-bias.qmd whenever one of its Part include files is saved.

The Quarto extension only renders on save of the main file, not of the files it
includes, so this watches annotation-bias/*.qmd and runs `quarto render`.
Saving annotation-bias.qmd itself is still handled by the extension.
"""
import glob
import os
import shutil
import socket
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAIN = "annotation-bias.qmd"
PATTERN = os.path.join(ROOT, "annotation-bias", "*.qmd")
LOCK_PORT = 8766  # held while running, so only one watcher is active

try:
    lock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    lock.bind(("127.0.0.1", LOCK_PORT))
except OSError:
    print("Another Part watcher is already running; exiting.")
    sys.exit(0)

quarto = shutil.which("quarto") or os.path.expandvars(r"%LOCALAPPDATA%\Programs\Quarto\bin\quarto.exe")


def snapshot():
    state = {}
    for path in glob.glob(PATTERN):
        try:
            state[path] = os.path.getmtime(path)
        except OSError:
            pass
    return state


seen = snapshot()
print(f"Watching {len(seen)} Part files in {os.path.dirname(PATTERN)}", flush=True)
while True:
    time.sleep(1)
    now = snapshot()
    if now == seen:
        continue
    # Let a save finish writing before rendering.
    time.sleep(0.5)
    now = snapshot()
    changed = [os.path.basename(p) for p in now if now[p] != seen.get(p)]
    seen = now
    print(time.strftime("%H:%M:%S"), "changed:", ", ".join(changed) or "(file removed)", "-> rendering", flush=True)
    result = subprocess.run([quarto, "render", MAIN], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    lines = (result.stdout + result.stderr).strip().splitlines()
    problems = [l for l in lines if "WARN" in l or "ERROR" in l]
    status = "done" if result.returncode == 0 else f"FAILED (exit {result.returncode})"
    print(time.strftime("%H:%M:%S"), status, flush=True)
    for line in problems or ([] if result.returncode == 0 else lines[-15:]):
        print("   ", line, flush=True)
    # Changes saved during the render are picked up on the next pass.
