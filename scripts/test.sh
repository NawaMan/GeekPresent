#!/usr/bin/env bash
# Run the tests: both vitest projects, or only one.
#
#     scripts/test.sh                  dom + ssr
#     scripts/test.sh dom              only the dom project (jsdom + testing-library)
#     scripts/test.sh ssr Connector    only the ssr project, files that match "Connector"
#
# Other arguments go to vitest.
source "$(dirname "$0")/_booth.sh"

project=()
case "${1:-}" in
    dom|ssr) project=(--project "$1"); shift ;;
esac

# tsconfig.json extends .svelte-kit/tsconfig.json. A fresh checkout does not have it.
pnpm exec svelte-kit sync
pnpm exec vitest run "${project[@]}" "$@"
