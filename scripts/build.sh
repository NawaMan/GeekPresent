#!/usr/bin/env bash
# Build the site into docs/ (the output that CI publishes to GitHub Pages).
# Arguments go to vite build.
source "$(dirname "$0")/_booth.sh"

pnpm build "$@"
