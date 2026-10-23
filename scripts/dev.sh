#!/usr/bin/env bash
# The dev server, with hot reload. Prints the URL that the host can open.
# Arguments go to vite dev.
source "$(dirname "$0")/_booth.sh"

# The booth takes the next free control port, and the slides are at +173.
if [ -n "${BOOTH_HOST_PORT:-}" ]; then
    echo "▶ slides on http://localhost:$((BOOTH_HOST_PORT + 173))/"
fi
pnpm dev --host "$@"
