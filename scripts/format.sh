#!/usr/bin/env bash
# Reformat the paths you name: scripts/format.sh src/lib/components/Foo.svelte
source "$(dirname "$0")/_booth.sh"

if [ "$#" -eq 0 ]; then
    echo "format.sh: name the paths to format (scripts/format-all.sh does the whole tree)." >&2
    exit 2
fi
# --ignore-unknown: a folder, or a png in the list, is not an error.
pnpm exec prettier --write --ignore-unknown "$@"
