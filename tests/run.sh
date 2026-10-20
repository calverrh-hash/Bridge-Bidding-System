#!/usr/bin/env bash
# Run the tests in a headless browser and exit non-zero if any fail.
# Works in Git Bash on Windows (Edge or Chrome) and on Linux/macOS (Chrome or Chromium).
# Without a terminal, just open tests/index.html in a browser instead.
set -u
cd "$(dirname "$0")"

browser=""
for b in \
  "${BROWSER:-}" \
  google-chrome chromium chromium-browser \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
  if [ -n "$b" ] && { command -v "$b" >/dev/null 2>&1 || [ -x "$b" ]; }; then browser="$b"; break; fi
done
[ -n "$browser" ] || { echo "No Chrome, Chromium or Edge found. Set BROWSER=/path/to/browser."; exit 2; }

page="$(pwd)/index.html"
command -v cygpath >/dev/null 2>&1 && page="$(cygpath -m "$page")"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

out="$("$browser" --headless=new --disable-gpu --no-sandbox --no-first-run \
  --allow-file-access-from-files --user-data-dir="$profile" \
  --dump-dom "file:///${page#/}" 2>/dev/null)"

# Print the results block, decoding the few HTML entities it can contain.
echo "$out" | awk '/<pre id="o"/{f=1} f{print} /<\/pre>/{if(f)exit}' \
  | sed -e 's/<[^>]*>//g' -e 's/&gt;/>/g' -e 's/&lt;/</g' -e 's/&quot;/"/g' -e 's/&amp;/\&/g'

echo "$out" | grep -q '<title>PASS' || { echo "TESTS FAILED"; exit 1; }
echo "ALL TESTS PASSED"
