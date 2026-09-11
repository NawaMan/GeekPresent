# GeekPresent — the project's tasks, in one place.  https://just.systems
#
# Everything here runs INSIDE the CodingBooth container. That is not a
# preference: this project assumes no host toolchain, and AGENTS.md forbids
# inventing one (no host pnpm, no host node, no bare vite).
#
# You do not have to remember that. Every recipe checks where it is and, when it
# finds itself on the host, hands itself to the booth:
#
#     just test     on the host      →  ./booth exec --run --quiet -- just test
#     just test     inside a booth   →  runs right here
#
# So the command is the same wherever you type it, and the booth flags — which
# one, which port, which -e — stop being something to get right by hand.
#
# The exception is the handful of recipes that drive the booth instead of running
# in it — `shell`, `status`, `stop`. Those cannot work from inside a container, and
# say so rather than failing obscurely.
#
# The booth already has `just` (CodingBooth ≥ 0.77.0 ships it in every image, which
# is why .booth/tools/codingbooth.lock pins 0.77.0). The host needs its own copy if
# you want to type `just` there: https://just.systems/man/en/packages.html — without
# it, fall back to `./booth exec --run -- just <recipe>`.
#
#     just                list the recipes
#     just test           dom + ssr suites
#     just dev            dev server, with its URL

# Recipe arguments arrive as "$@", so they survive spaces and quoting on the way
# back out to the booth.
set positional-arguments := true

# Two settings every recipe wants, set once here instead of as -e on each booth
# call. CI keeps the tools non-interactive under a TTY-less `booth exec`, and
# without the second one pnpm aborts its dependency check there — which blocks
# `vite build` and `vite dev`, not just the tests.
export CI := "true"
export npm_config_verify_deps_before_run := "false"

# The line every recipe opens with.
#
# /opt/codingbooth exists only inside a booth (it holds the image's setup scripts
# and leads the container PATH), so it is the cheapest honest answer to "am I in
# the container?". On the host this re-invokes the SAME recipe name and arguments
# through the booth and `exec`s away — the rest of the body then only ever runs
# inside the container, and the command's exit code comes straight back to you.
# Each recipe passes its own name in RECIPE, since a recipe body has no built-in
# way to ask what it is called.
#
# The `-x ./booth` half is for the adopters: `adopt-geekpresent.sh --no-booth`
# deletes `booth` and `.booth/` from the copy it leaves behind, because that
# adopter chose their own node + pnpm. With no booth to enter, the recipe simply
# runs where it stands — which is the toolchain they asked for. In THIS repo the
# wrapper is tracked and executable, so that branch never fires and Rule 6 holds.
#
# The inner `just -q` is cosmetic: without it a failure is announced twice, once by
# the copy in the container and once by the copy you typed. The recipe's own output
# — vitest, eslint, prettier — is untouched by it.
booth := 'if [ ! -d /opt/codingbooth ] && [ -x ./booth ]; then exec ./booth exec --run --quiet -- just -q "$RECIPE" "$@"; fi'

# The other half: recipes that DRIVE the booth rather than run in it. There is no
# sensible way to open, list or stop a container from inside that container, so
# these refuse with a sentence instead of failing on a missing `./booth` three
# lines later — a recipe that cannot work where you typed it should say so.
host_only := 'if [ -d /opt/codingbooth ]; then echo "just $RECIPE: host-only — it drives the booth from outside, and you are already inside one. Run it from the host." >&2; exit 2; fi'

# just_executable() rather than bare `just`: the copy that invoked us may not be on
# PATH, and the listing should not be the one recipe that fails.

# List every recipe. This is what a bare `just` does, and it needs no booth.
default:
    @{{ just_executable() }} --list --unsorted

# Both test projects — dom and ssr. Extra arguments go to vitest.
test *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=test; {{ booth }}
    # vitest.workspace.ts runs both projects; `just test Connector` filters by name.
    pnpm exec svelte-kit sync
    pnpm exec vitest run "$@"

# Only the dom project — components under jsdom + testing-library.
test-dom *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=test-dom; {{ booth }}
    pnpm exec svelte-kit sync
    pnpm exec vitest run --project dom "$@"

# Only the ssr project — server-compiled components, the prerender checks.
test-ssr *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=test-ssr; {{ booth }}
    pnpm exec svelte-kit sync
    pnpm exec vitest run --project ssr "$@"

# Type-check the tree with svelte-check.
check *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=check; {{ booth }}
    pnpm exec svelte-kit sync
    pnpm exec svelte-check --tsconfig ./tsconfig.json "$@"

# Report on the tree: prettier --check and eslint. Both run; either can fail it.
lint *PATHS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=lint; {{ booth }}
    if [ "$#" -eq 0 ]; then set -- .; fi
    # Both, always — stopping at the first failure would hide the other tool's
    # report, and the whole point of this recipe is the report.
    rc=0
    pnpm exec prettier --check "$@" || rc=1
    pnpm exec eslint "$@" || rc=1
    exit $rc

# Reformat the paths you name — `just format src/lib/components/Foo.svelte`.
format +PATHS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=format; {{ booth }}
    # --ignore-unknown so naming a folder, or a png that rode along in a diff, is
    # not an error — prettier simply skips what it has no parser for.
    pnpm exec prettier --write --ignore-unknown "$@"

# Reformat only what this branch touched. The incremental way to clean the tree.
format-changed:
    #!/usr/bin/env bash
    set -euo pipefail
    # The list is worked out HERE, before any hop into the booth: a linked worktree's
    # .git lives outside the container's mount, so git is not reachable in there.
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        echo "just format-changed: needs git, which a worktree's booth cannot see. Run it from the host." >&2
        exit 2
    fi
    base="$(git merge-base HEAD main 2>/dev/null || true)"
    changed="$( {
        if [ -n "$base" ]; then git diff --name-only --diff-filter=ACMR "$base" HEAD; fi
        git diff --name-only --diff-filter=ACMR
        git ls-files --others --exclude-standard
    } | sort -u )"
    # Drop anything that is no longer on disk (renamed away, staged then removed).
    mapfile -t files < <(printf '%s\n' "$changed" | while IFS= read -r f; do
        if [ -n "$f" ] && [ -e "$f" ]; then printf '%s\n' "$f"; fi
    done)
    if [ "${#files[@]}" -eq 0 ]; then
        echo "just format-changed: nothing changed against main — nothing to format."
        exit 0
    fi
    # Hand the list to `format`, which does the writing (in the booth, if there is one).
    set -- "${files[@]}"
    RECIPE=format; {{ booth }}
    pnpm exec prettier --write --ignore-unknown "$@"

# Reformat the WHOLE tree — hundreds of files, so give it a commit of its own.
format-all:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=format-all; {{ booth }}
    # Most of the tree has never been formatted. This is the convergence hammer;
    # `format-changed` is the one to reach for day to day.
    pnpm exec prettier --write .

# The dev server, with the URL the host can reach it on.
dev *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=dev; {{ booth }}
    # Printed rather than assumed: a booth takes the next free control port and its
    # slides follow at +173, so the number moves from one booth to the next.
    port="${BOOTH_HOST_PORT:-}"
    if [ -n "$port" ]; then
        echo "▶ slides on http://localhost:$((port + 173))/"
    fi
    pnpm dev --host "$@"

# Build the site into docs/ — the build output CI publishes to GitHub Pages.
build *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=build; {{ booth }}
    pnpm build "$@"

# Build a self-contained static site elsewhere. Defaults to ./dist.
build-static *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=build-static; {{ booth }}
    # Otherwise takes build-static.sh's own arguments, flags included:
    #   just build-static ./out geeklight       one deck into ./out
    #   just build-static -- --zip ./dist       ./dist plus ./dist.zip
    if [ "$#" -eq 0 ]; then set -- ./dist; fi
    ./build-static.sh "$@"

# Install dependencies — for a changed package.json, not for a fresh checkout.
install *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=install; {{ booth }}
    # A booth restores node_modules from the image's pnpm cache when it starts
    # (.booth/startup.sh), so a fresh checkout does not need this first.
    pnpm install "$@"

# Open an interactive shell in this project's booth. Host-only.
shell:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=shell; {{ host_only }}
    # --run, because a bare `booth shell` only attaches to a booth that is ALREADY up
    # and errors out otherwise — which is not what "open me a shell" should mean. The
    # booth it starts is stopped again on disconnect, as with every other recipe here.
    ./booth shell --run --quiet

# What booths are running, and from which checkout. Host-only.
status:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=status; {{ host_only }}
    ./booth list

# Stop this checkout's booth — the folder name is the booth name. Host-only.
stop:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=stop; {{ host_only }}
    # Never a blind `booth stop`: two booths can share one folder (the second gets a
    # suffix), and the other one is likely someone else's dev server. Name the one
    # that matches this checkout, and let `booth` refuse if that is ambiguous.
    name="$(basename "$PWD")"
    # Most booths are --rm and are already gone; "nothing to stop" is the ordinary
    # outcome, not an error worth a stack of red text.
    # STATUS too, not just NAME: a --keep-alive booth stays listed as "Stopped" after
    # it is stopped, and re-stopping that is not a thing to ask booth to do.
    if ! ./booth list 2>/dev/null | awk -v n="$name" 'NR > 1 && $1 == n && $2 == "Running"' | grep -q .; then
        echo "just stop: no booth named '$name' is running — nothing to stop."
        exit 0
    fi
    ./booth stop --name "$name"

# Generate .svelte-kit/, which tsconfig.json extends.
sync:
    #!/usr/bin/env bash
    set -euo pipefail
    RECIPE=sync; {{ booth }}
    # A checkout that has never synced fails type-aware commands with a confusing
    # MODULE_NOT_FOUND for tsconfig.json. The recipes above sync on their own; this
    # is the one to reach for by hand.
    pnpm exec svelte-kit sync
