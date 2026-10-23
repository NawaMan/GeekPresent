#!/usr/bin/env bash
# Type-check the tree with svelte-check. Arguments go to svelte-check.
source "$(dirname "$0")/_booth.sh"

pnpm exec svelte-kit sync
pnpm exec svelte-check --tsconfig ./tsconfig.json "$@"
