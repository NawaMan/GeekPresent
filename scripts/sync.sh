#!/usr/bin/env bash
# Generate .svelte-kit/, which tsconfig.json extends. Without it, type-aware
# commands fail with a confusing MODULE_NOT_FOUND for tsconfig.json.
# test.sh and check.sh do this on their own.
source "$(dirname "$0")/_booth.sh"

pnpm exec svelte-kit sync
