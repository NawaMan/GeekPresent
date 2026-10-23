#!/usr/bin/env bash
# Reformat only what this branch changed against main (committed, modified and
# untracked files).
#
# This script does NOT go into the booth: git does not work in a worktree's booth.
# It makes the list here, then gives it to format.sh, which goes into the booth.
set -euo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "format-changed.sh: needs git, which a worktree's booth cannot see. Run it from the host." >&2
    exit 2
fi
base="$(git merge-base HEAD main 2>/dev/null || true)"
changed="$( {
    if [ -n "$base" ]; then git diff --name-only --diff-filter=ACMR "$base" HEAD; fi
    git diff --name-only --diff-filter=ACMR
    git ls-files --others --exclude-standard
} | sort -u )"
# Keep only the files that are still on disk.
mapfile -t files < <(printf '%s\n' "$changed" | while IFS= read -r f; do
    if [ -n "$f" ] && [ -e "$f" ]; then printf '%s\n' "$f"; fi
done)
if [ "${#files[@]}" -eq 0 ]; then
    echo "format-changed.sh: nothing changed against main, nothing to format."
    exit 0
fi
exec "$(dirname "$0")/format.sh" "${files[@]}"
