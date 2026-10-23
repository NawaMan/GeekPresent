#!/usr/bin/env bash
# Build, then serve the built site (serve.sh). Arguments go to vite preview.
source "$(dirname "$0")/_booth.sh"

pnpm build
exec scripts/serve.sh "$@"
