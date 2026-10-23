# Sourced by every script in scripts/ as its first line:
#
#     source "$(dirname "$0")/_booth.sh"
#
# Rule 6 says the toolchain runs only in the booth. This file makes that
# automatic: from the host, the script runs itself again in the booth, with the
# same arguments, and exits with the booth's exit code. Inside a booth (where
# /opt/codingbooth exists), the script continues here.
#
# A checkout without ./booth (an adopter who chose their own node + pnpm) runs
# where it is. So does a script started with NO_BOOTH=1: for a build that must
# write outside the repo, which the booth cannot see.

set -euo pipefail

# CI keeps the tools non-interactive under a TTY-less `booth exec`. Without the
# second variable, pnpm stops at its dependency check, which blocks vite and vitest.
export CI=true
export npm_config_verify_deps_before_run=false

_root="$(cd "$(dirname "$0")/.." && pwd)"

# Paths in the arguments are relative to the repo root, and the booth mounts the
# repo root. A script run from somewhere else would also not find ./booth, and
# would run on the host. So refuse.
if [ "$PWD" != "$_root" ]; then
    echo "$(basename "$0"): run it from the repo root ($_root)." >&2
    exit 2
fi

if [ ! -d /opt/codingbooth ] && [ -x ./booth ] && [ -z "${NO_BOOTH:-}" ]; then
    exec ./booth exec --run --quiet -- "scripts/$(basename "$0")" "$@"
fi
