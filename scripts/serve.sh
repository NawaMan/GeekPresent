#!/usr/bin/env bash
# Serve the LAST build as it is, with no rebuild. Page turns are much faster than
# under dev.sh, so present (or record a video) from this one. Arguments go to vite
# preview. serve-build.sh builds first; use that one when the source changed.
#
# It uses the same container port as dev.sh, so stop that first. --strictPort
# says so if you do not.
source "$(dirname "$0")/_booth.sh"

# vite preview serves what `pnpm build` left in .svelte-kit/output. Without it there
# is nothing to serve, so say which script makes it.
if [ ! -d .svelte-kit/output/client ]; then
    echo "serve.sh: no build yet. Run \`just serve-build\` (or \`just build\`) first." >&2
    exit 1
fi
if [ -n "${BOOTH_HOST_PORT:-}" ]; then
    echo "▶ built slides on http://localhost:$((BOOTH_HOST_PORT + 173))/"
fi
pnpm exec vite preview --host --port 5173 --strictPort "$@"
