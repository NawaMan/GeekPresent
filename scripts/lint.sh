#!/usr/bin/env bash
# Report on the tree (or the paths you name): prettier --check and eslint.
# Both run, and either can fail it. Red at baseline: see AGENTS.md.
source "$(dirname "$0")/_booth.sh"

if [ "$#" -eq 0 ]; then set -- .; fi
# Run both always. If the first fails, the second still gives its report.
rc=0
pnpm exec prettier --check "$@" || rc=1
pnpm exec eslint "$@" || rc=1
exit $rc
