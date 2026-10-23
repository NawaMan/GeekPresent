#!/usr/bin/env bash
# Reformat the WHOLE tree. That is hundreds of files, so give it a commit of its own.
# For day-to-day use, scripts/format-changed.sh.
source "$(dirname "$0")/_booth.sh"

pnpm exec prettier --write .
