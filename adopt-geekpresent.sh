#!/usr/bin/env bash
#
# adopt-geekpresent.sh — bootstrap GeekPresent into an existing project so you
# can author docs / slides / promo material that build into a static site.
#
# What it does (each step is optional and confirmed before anything destructive):
#   1. Acquire GeekPresent into a subfolder of your project (git clone or copy).
#   2. Strip its .git so it becomes part of YOUR repo (not an embedded clone).
#   3. Samples:
#        full     — keep every sample deck verbatim (it builds; you trim later).
#        minimal  — keep ONE deck as your starting template, move the rest to a
#                   gitignored .samples-ref/ (kept locally for AI/agent reference),
#                   and rewrite the landing page so the build stays green.
#        skeleton — keep NO sample deck: move them all to .samples-ref/ and
#                   scaffold an EMPTY starting point in their place (--kind):
#                   an empty deck, a long-form Text page, or nothing at all.
#                   The clean slate — you start by writing, not by deleting.
#      All three keep the framework itself (src/lib, themes, build scripts, tests).
#   4. Optional GitHub-Pages base path (for project sites served at /<repo>/).
#   5. Scaffold a GitHub Actions workflow that builds the subfolder and deploys.
#   6. Optional verification build (via CodingBooth if present, else pnpm).
#
# Interactive by default: missing options are PROMPTED (with defaults in
# brackets). Pass flags to skip prompts; pass --yes (or run without a TTY, e.g.
# piped) to take every default non-interactively. Destructive steps still ask
# unless --yes is given.
#
# Usage:
#   adopt-geekpresent.sh [SOURCE] [options]
#
#   SOURCE   git URL or local path to GeekPresent.
#            Default: https://github.com/NawaMan/GeekPresent.git
#
# Run straight from GitHub, in the root of the project you want to add it to:
#   # interactive (prompts read from your terminal even through the pipe):
#   curl -fsSL https://raw.githubusercontent.com/NawaMan/GeekPresent/main/adopt-geekpresent.sh | bash
#   # non-interactive (pass flags after `bash -s --`):
#   curl -fsSL https://raw.githubusercontent.com/NawaMan/GeekPresent/main/adopt-geekpresent.sh | bash -s -- --dir docs-site --mode minimal --keep slides --yes
#   # start from a clean slate instead (empty deck, no demo slides to delete):
#   curl -fsSL https://raw.githubusercontent.com/NawaMan/GeekPresent/main/adopt-geekpresent.sh | bash -s -- --mode skeleton --kind deck --name slides --yes
#   # a docs site, not a talk — scaffold a long-form Text page instead of a deck:
#   curl -fsSL https://raw.githubusercontent.com/NawaMan/GeekPresent/main/adopt-geekpresent.sh | bash -s -- --mode skeleton --kind text --name guide.html --yes
#
# Options:
#   --dir <name>        subfolder to create        (default: geekpresent)
#   --mode <mode>       full | minimal | skeleton  (prompted; default: minimal)
#   --keep <deck>       deck to keep in minimal    (prompted; default: slides)
#   --kind <kind>       what skeleton scaffolds    (prompted; default: deck)
#                         deck — an empty slide deck (one title slide)
#                         text — a long-form Text page (one page that scrolls)
#                         none — nothing at all; the framework and an empty tree
#   --name <name>       name of the deck/page scaffolded in skeleton mode
#                       (prompted; default: slides for a deck, guide.html for a text)
#   --base </path>      GitHub Pages base path      (prompted; default: none)
#   --ci / --no-ci      scaffold the Actions workflow
#   --build / --no-build  run a verification build at the end
#   --yes, -y           accept all defaults, skip confirmations (non-interactive)
#   -h, --help          show this help and exit
#
# Nothing is committed. Review the result, then `git add` what you want.

set -euo pipefail

# -----------------------------------------------------------------------------
# Defaults
# -----------------------------------------------------------------------------
SOURCE_DEFAULT="https://github.com/NawaMan/GeekPresent.git"
SOURCE=""
DIR="geekpresent"
MODE=""          # full | minimal | skeleton   (resolved via prompt if empty)
KIND=""          # deck | text | none          (skeleton only; prompted if empty)
# What you end up editing. In minimal it names the sample deck KEPT; in skeleton it
# names the deck or Text page SCAFFOLDED. Empty until resolved, because the default
# depends on --kind (a deck is 'slides'; a Text is 'guide.html').
NAME=""
BASE=""          # e.g. /my-repo    (empty = served at domain root)
DO_CI=""         # yes | no         (resolved via prompt if empty)
DO_BUILD=""      # yes | no
ASSUME_YES=0

# -----------------------------------------------------------------------------
# Pretty output (all status goes to stderr so stdout stays clean for piping)
# -----------------------------------------------------------------------------
if [ -t 2 ]; then
	B=$'\033[1m'; DIM=$'\033[2m'; GRN=$'\033[32m'; YLW=$'\033[33m'; RED=$'\033[31m'; RST=$'\033[0m'
else
	B=""; DIM=""; GRN=""; YLW=""; RED=""; RST=""
fi
info() { printf '%s\n' "${B}::${RST} $*" >&2; }
ok()   { printf '%s\n' "${GRN}✓${RST} $*" >&2; }
warn() { printf '%s\n' "${YLW}!${RST} $*" >&2; }
die()  { printf '%s\n' "${RED}✗ $*${RST}" >&2; exit 1; }

# Is there a human at the keyboard? (piped/CI -> no)
interactive() { [ -t 0 ] || [ -e /dev/tty ]; }

# ask <prompt> <default> -> echoes the answer on stdout
ask() {
	local prompt="$1" default="${2:-}" reply=""
	if [ "$ASSUME_YES" = "1" ] || ! interactive; then
		printf '%s\n' "$default"; return
	fi
	if [ -n "$default" ]; then
		printf '%s [%s]: ' "$prompt" "$default" >&2
	else
		printf '%s: ' "$prompt" >&2
	fi
	IFS= read -r reply </dev/tty || true
	printf '%s\n' "${reply:-$default}"
}

# confirm <prompt>  -> returns 0 (yes) / 1 (no). Defaults to YES.
confirm() {
	local prompt="$1" reply=""
	if [ "$ASSUME_YES" = "1" ] || ! interactive; then return 0; fi
	printf '%s [Y/n]: ' "$prompt" >&2
	IFS= read -r reply </dev/tty || true
	case "${reply:-y}" in [Nn]*) return 1;; *) return 0;; esac
}

usage() { sed -n '2,/^set -euo/p' "$0" | sed 's/^# \{0,1\}//; s/^#$//' | sed '$d'; }

# -----------------------------------------------------------------------------
# Parse arguments
# -----------------------------------------------------------------------------
while [ $# -gt 0 ]; do
	case "$1" in
		--dir)    DIR="${2:?--dir needs a value}"; shift 2;;
		--mode)   MODE="${2:?--mode needs a value}"; shift 2;;
		--keep)   NAME="${2:?--keep needs a value}"; shift 2;;
		--name)   NAME="${2:?--name needs a value}"; shift 2;;
		--deck)   NAME="${2:?--deck needs a value}"; KIND="deck"; shift 2;;
		--kind)   KIND="${2:?--kind needs a value}"; shift 2;;
		--base)   BASE="${2:?--base needs a value}"; shift 2;;
		--ci)     DO_CI="yes"; shift;;
		--no-ci)  DO_CI="no"; shift;;
		--build)    DO_BUILD="yes"; shift;;
		--no-build) DO_BUILD="no"; shift;;
		-y|--yes) ASSUME_YES=1; shift;;
		-h|--help) usage; exit 0;;
		-*) die "unknown option: $1 (try --help)";;
		*)  if [ -z "$SOURCE" ]; then SOURCE="$1"; shift; else die "unexpected arg: $1"; fi;;
	esac
done

case "$MODE" in ""|full|minimal|skeleton) ;; *) die "--mode must be 'full', 'minimal' or 'skeleton'";; esac
case "$KIND" in ""|deck|text|none) ;; *) die "--kind must be 'deck', 'text' or 'none'";; esac

# -----------------------------------------------------------------------------
# Resolve configuration (flags win; otherwise prompt; otherwise default)
# -----------------------------------------------------------------------------
[ -n "$SOURCE" ] || SOURCE="$(ask "GeekPresent source (git URL or local path)" "$SOURCE_DEFAULT")"
DIR="$(ask "Subfolder to create in this project" "$DIR")"
[ -n "$MODE" ] || MODE="$(ask "Samples — 'minimal' (1 deck), 'skeleton' (empty deck) or 'full' (keep all)" "minimal")"
case "$MODE" in full|minimal|skeleton) ;; *) die "mode must be 'full', 'minimal' or 'skeleton'";; esac
if [ "$MODE" = "minimal" ]; then
	[ -n "$NAME" ] || NAME="$(ask "Deck to keep as your starting template" "slides")"
elif [ "$MODE" = "skeleton" ]; then
	# What to start from. 'none' is for someone who wants the framework and an empty
	# tree — it builds (the site is just the landing page), but they then hand-write
	# the six files 'deck' would have written for them, so it is not the default.
	[ -n "$KIND" ] || KIND="$(ask "Scaffold what — 'deck' (slides), 'text' (one long page) or 'none'" "deck")"
	case "$KIND" in deck|text|none) ;; *) die "kind must be 'deck', 'text' or 'none'";; esac
	case "$KIND" in
		deck) [ -n "$NAME" ] || NAME="$(ask "Name for your new (empty) deck" "slides")";;
		text) [ -n "$NAME" ] || NAME="$(ask "Name for your new Text page (a route, so .html)" "guide.html")";;
	esac
fi
[ -n "$NAME" ] || NAME="slides"
BASE="$(ask "GitHub Pages base path for a project site, e.g. /my-repo (blank = domain root)" "$BASE")"
[ -n "$DO_CI" ]    || { confirm "Scaffold a GitHub Actions deploy workflow?" && DO_CI="yes" || DO_CI="no"; }
[ -n "$DO_BUILD" ] || { confirm "Run a verification build at the end? (slower; needs deps)" && DO_BUILD="yes" || DO_BUILD="no"; }

TARGET="$PWD/$DIR"

# -----------------------------------------------------------------------------
# Plan summary + go/no-go
# -----------------------------------------------------------------------------
{
	echo
	echo "${B}Plan${RST}"
	echo "  source     : $SOURCE"
	echo "  into       : $TARGET"
	case "$MODE" in
		minimal)  echo "  samples    : minimal (keep: $NAME)";;
		skeleton)
			case "$KIND" in
				deck) echo "  samples    : skeleton — no samples kept; empty deck '$NAME'";;
				text) echo "  samples    : skeleton — no samples kept; Text page '$NAME'";;
				none) echo "  samples    : skeleton — no samples kept; NOTHING scaffolded";;
			esac;;
		*)        echo "  samples    : full";;
	esac
	echo "  base path  : ${BASE:-<none>}"
	echo "  workflow   : $DO_CI"
	echo "  test build : $DO_BUILD"
	echo
} >&2
confirm "Proceed?" || die "aborted."

# -----------------------------------------------------------------------------
# Step 1 — acquire into TARGET
# -----------------------------------------------------------------------------
if [ -e "$TARGET" ]; then
	confirm "$DIR already exists — overwrite it?" || die "aborted (target exists)."
	rm -rf "$TARGET"
fi
info "Acquiring GeekPresent into $DIR ..."
if [ -d "$SOURCE/.git" ] || [ -d "$SOURCE" ]; then
	# local path: clone so we get a clean tree (respects .gitignore), shallow
	git clone --depth 1 "file://$(cd "$SOURCE" && pwd)" "$TARGET" 2>/dev/null \
		|| cp -a "$SOURCE" "$TARGET"
else
	git clone --depth 1 "$SOURCE" "$TARGET"
fi
ok "Cloned into $DIR"

# -----------------------------------------------------------------------------
# Step 2 — strip .git (make it part of YOUR repo)
# -----------------------------------------------------------------------------
if [ -d "$TARGET/.git" ]; then
	if confirm "Remove $DIR/.git so it becomes part of this project (not an embedded clone)?"; then
		rm -rf "$TARGET/.git"
		ok "Removed $DIR/.git — it's now plain files in your repo"
	else
		warn "Kept $DIR/.git — git will treat $DIR as an embedded repo/submodule"
	fi
fi

ROUTES="$TARGET/src/routes"

# -----------------------------------------------------------------------------
# Step 3 — samples
# -----------------------------------------------------------------------------
if [ "$MODE" = "minimal" ] || [ "$MODE" = "skeleton" ]; then
	[ "$MODE" != "minimal" ] || [ -f "$ROUTES/$NAME/pages.ts" ] \
		|| die "deck '$NAME' not found under src/routes — pick one with --keep"
	REF="$TARGET/.samples-ref"
	mkdir -p "$REF"
	if [ "$MODE" = "minimal" ]; then
		info "Minimal mode: keeping '$NAME', moving other samples to .samples-ref/ ..."
	else
		info "Skeleton mode: moving every sample to .samples-ref/ ..."
	fi

	MOVED=()
	# Decks = any route dir containing pages.ts. minimal keeps one as the starting
	# template; skeleton keeps NONE (it scaffolds a fresh start below instead).
	for d in "$ROUTES"/*/; do
		name="$(basename "$d")"
		[ "$name" = "(home)" ] && continue
		if [ "$MODE" = "minimal" ] && [ "$name" = "$NAME" ]; then continue; fi
		if [ -f "$d/pages.ts" ]; then mv "$d" "$REF/"; MOVED+=("$name"); fi
	done
	# Standalone sample/demo routes (text.html, seo.html) cross-link to the decks
	# above with relative hrefs, so they must go too. Keep robots.txt + sitemap.xml
	# (sitemap auto-tracks the remaining decks via import.meta.glob).
	for r in text.html seo.html; do
		[ -e "$ROUTES/$r" ] && { mv "$ROUTES/$r" "$REF/"; MOVED+=("$r"); }
	done

	# One shipped test is about the SAMPLE SLIDES, not the framework: it reads the
	# <Path> demos out of src/routes/{slides,animation} to prove their tags stay on
	# one line so LAYOUT's Save can patch them. Both modes move at least one of those
	# decks, so the test would fail on `pnpm test` in a freshly adopted project.
	# It travels with the samples it guards.
	DEMO_TEST="tests/PathDemoSource.ssr.test.ts"
	if [ -f "$TARGET/$DEMO_TEST" ]; then
		mkdir -p "$REF/tests"
		mv "$TARGET/$DEMO_TEST" "$REF/tests/"
		ok "Moved $DEMO_TEST to .samples-ref/ (it asserts things about the demo slides)"
	fi

	# Skeleton: nothing is left to edit, so write the clean slate. The templates ship as
	# real files (utils/skeleton/{deck,text}), not heredocs here, so they are type-checked
	# and SSR-tested like any other source. 'none' scaffolds nothing — the site is then
	# just the landing page, which builds fine (the sitemap's pages.ts glob matches
	# nothing) but leaves the six deck files to write by hand.
	if [ "$MODE" = "skeleton" ] && [ "$KIND" != "none" ]; then
		SKEL="$TARGET/utils/skeleton/$KIND"
		[ -d "$SKEL" ] || die "skeleton template missing at utils/skeleton/$KIND — is $SOURCE really GeekPresent?"
		mkdir -p "$ROUTES/$NAME"
		cp -a "$SKEL/." "$ROUTES/$NAME/"
		if [ "$KIND" = "deck" ]; then
			ok "Scaffolded an empty deck at src/routes/$NAME/ (one title slide)"
		else
			ok "Scaffolded a Text page at src/routes/$NAME/ (one long page that scrolls)"
		fi
	elif [ "$MODE" = "skeleton" ]; then
		ok "Scaffolded nothing (--kind none) — src/routes holds only the landing page"
	fi

	# Keep the sitemap's hardcoded standalone-route list in sync with what's left. Decks
	# are globbed from their pages.ts, but a Text is NOT discovered — it reaches the
	# sitemap only by being listed here, so a scaffolded Text has to be registered or it
	# builds and is never indexed.
	SEO_ROUTES="$TARGET/src/lib/seo/routes.ts"
	TEXT_LIST="['/']"
	[ "$MODE" = "skeleton" ] && [ "$KIND" = "text" ] && TEXT_LIST="['/', '/$NAME']"
	if [ -f "$SEO_ROUTES" ] && grep -q 'TEXT_ROUTES' "$SEO_ROUTES"; then
		sed -i "s|^const TEXT_ROUTES =.*|const TEXT_ROUTES = $TEXT_LIST;|" "$SEO_ROUTES"
		ok "Set sitemap's standalone-route list to $TEXT_LIST"
	fi

	# The landing page hardcodes links to the sample decks; rewrite it so prerender
	# doesn't crawl into removed routes. Original is preserved either way.
	#
	# Skeleton gets a REAL getting-started page rather than the stub: everything the
	# "next steps" below say is true only until the terminal scrolls, and the landing
	# page is the one surface a new adopter is certain to open. It is scaffolding that
	# explains itself and is then deleted — which is exactly what the stub is too, so
	# this costs nothing and is read a week later, when the terminal is long gone.
	# There is one landing page per --kind, because the getting-started text has to match
	# what was actually scaffolded: 'none' has no deck to link to and must instead spell
	# out the files to write, and 'text' points at a page, not a slide.
	HOME_PAGE="$ROUTES/(home)/+page.svelte"
	HOME_SKEL="$TARGET/utils/skeleton/home/$KIND/+page.svelte"
	if [ -f "$HOME_PAGE" ] && [ "$MODE" = "skeleton" ] && [ -f "$HOME_SKEL" ]; then
		cp "$HOME_PAGE" "$REF/home-+page.svelte.orig"
		sed "s|__NAME__|$NAME|g" "$HOME_SKEL" > "$HOME_PAGE"
		ok "Wrote a getting-started landing page (--kind $KIND)"
	elif [ -f "$HOME_PAGE" ]; then
		cp "$HOME_PAGE" "$REF/home-+page.svelte.orig"
		cat > "$HOME_PAGE" <<EOF
<!-- Minimal landing page generated by adopt-geekpresent.sh.
     Original preserved at .samples-ref/home-+page.svelte.orig -->
<script lang="ts">
	// base is '' with no paths.base, or '/<repo>' when a base path is set, so
	// this link is correct whether or not the site is served from a sub-path.
	import { base } from '\$app/paths';
</script>

<h1>Documentation</h1>
<p>Replace this page with your own. Your starting deck is
   <a href="{base}/$NAME/title.html">here</a>.</p>
EOF
		ok "Rewrote landing page (links to /$NAME/title.html)"
	fi

	# Make sure the reference copies don't get committed or built.
	if ! grep -q '^\.samples-ref/' "$TARGET/.gitignore" 2>/dev/null; then
		printf '\n# Local-only reference copies of GeekPresent sample decks\n.samples-ref/\n' >> "$TARGET/.gitignore"
	fi
	ok "Samples relocated to $DIR/.samples-ref/ (gitignored, kept for reference)"

	# Safety net: a kept page may still link (in prose) to a removed route. We
	# can't guess the right replacement, so report it loudly rather than ship a
	# build that fails prerender. (For keep=slides this finds nothing.)
	#
	# Skeleton usually REUSES the moved deck's name for what it scaffolds ('slides'),
	# so /$NAME/* resolves again — those links are live, not dangling, and must not be
	# flagged (the landing page we just wrote is itself one). With --kind none nothing
	# is scaffolded, so that reprieve does NOT apply: a link to /$NAME/ really is dead.
	GONE=()
	for name in ${MOVED[@]+"${MOVED[@]}"}; do
		[ "$MODE" = "skeleton" ] && [ "$KIND" != "none" ] && [ "$name" = "$NAME" ] && continue
		GONE+=("$name")
	done
	if [ ${#GONE[@]} -gt 0 ]; then
		pat="$(printf '%s|' "${GONE[@]}")"; pat="(${pat%|})"
		DANG="$(grep -rnE "href=\"[^\"#]*${pat}" "$ROUTES" --include='*.svelte' 2>/dev/null || true)"
		if [ -n "$DANG" ]; then
			warn "Kept pages still link to removed samples — fix these, or use --mode full:"
			printf '%s\n' "$DANG" | sed "s|$TARGET/|    |" >&2
		fi
	fi
else
	ok "Full mode: all sample decks kept verbatim (build works out of the box)"
fi

# -----------------------------------------------------------------------------
# Step 4 — base path (project GitHub Pages served at /<repo>/)
# -----------------------------------------------------------------------------
if [ -n "$BASE" ]; then
	CFG="$TARGET/svelte.config.js"
	if grep -q 'paths:' "$CFG"; then
		warn "svelte.config.js already defines kit.paths — set base manually to '$BASE'"
	else
		# Insert a paths block that reads BASE_PATH (so CI can override per-repo).
		awk -v base="$BASE" '
			/kit: \{/ && !done {
				print
				print "\t\tpaths: { base: process.env.BASE_PATH || \x27" base "\x27 },"
				done=1; next
			}
			{ print }
		' "$CFG" > "$CFG.tmp" && mv "$CFG.tmp" "$CFG"
		ok "Patched svelte.config.js: kit.paths.base = '$BASE' (override via BASE_PATH)"
		warn "Heads up: stock GeekPresent assumes a DOMAIN-ROOT deploy. Its SEO wiring"
		warn "emits a root-absolute /sitemap.xml, so prerender FAILS under a base path"
		warn "until that (and any '/...'-absolute links you author) is made base-aware."
		warn "For project-subpath Pages, prefer a custom domain or user/org root site."
	fi
fi

# -----------------------------------------------------------------------------
# Step 5 — GitHub Actions workflow (lives at the REPO root, builds the subfolder)
# -----------------------------------------------------------------------------
if [ "$DO_CI" = "yes" ]; then
	WF_DIR="$PWD/.github/workflows"
	WF="$WF_DIR/deploy-$DIR.yml"
	mkdir -p "$WF_DIR"
	if [ -e "$WF" ] && ! confirm "$WF exists — overwrite?"; then
		warn "Kept existing $WF"
	else
		cat > "$WF" <<EOF
name: Deploy $DIR (GeekPresent) to GitHub Pages

on:
  push:
    branches: ["main"]
    paths: ["$DIR/**", ".github/workflows/deploy-$DIR.yml"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages-$DIR"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: $DIR
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: $DIR/pnpm-lock.yaml
      - name: Build
        run: pnpm install && pnpm build
$( [ -n "$BASE" ] && printf '        env:\n          BASE_PATH: "%s"\n' "$BASE" )
      # One-time: repo Settings -> Pages -> Source: GitHub Actions
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: $DIR/docs
      - id: deployment
        uses: actions/deploy-pages@v4
EOF
		ok "Wrote .github/workflows/deploy-$DIR.yml"
		warn "Enable once: repo Settings -> Pages -> Source: 'GitHub Actions'"
	fi
fi

# -----------------------------------------------------------------------------
# Step 6 — verification build
# -----------------------------------------------------------------------------
if [ "$DO_BUILD" = "yes" ]; then
	info "Verification build ..."
	if [ -x "$TARGET/booth" ]; then
		( cd "$TARGET" && ./booth -- bash -lc 'pnpm install && ./build-static.sh ./dist' ) \
			&& ok "Built $DIR/dist via CodingBooth" || warn "Booth build failed — try locally"
	else
		( cd "$TARGET" && pnpm install && ./build-static.sh ./dist ) \
			&& ok "Built $DIR/dist" || warn "Build failed — check pnpm/node are installed"
	fi
fi

# -----------------------------------------------------------------------------
# Done — next steps
# -----------------------------------------------------------------------------
{
	echo
	echo "${GRN}${B}GeekPresent adopted into $DIR/${RST}"
	echo
	echo "${B}Next steps${RST}"
	echo "  • Local build (no host deps): ${DIM}cd $DIR && ./booth -- ./build-static.sh ./dist --zip${RST}"
	echo "  • Or native:                  ${DIM}cd $DIR && pnpm install && ./build-static.sh ./dist${RST}"
	[ "$MODE" = "minimal" ] && echo "  • Edit your deck:            ${DIM}$DIR/src/routes/$NAME/${RST}  (samples: $DIR/.samples-ref/)"
	if [ "$MODE" = "skeleton" ]; then
		case "$KIND" in
			deck)
				echo "  • Write your first slide:    ${DIM}$DIR/src/routes/$NAME/title.html/+page.svelte${RST}"
				echo "  • Add slide 2:               new dir + ${DIM}+layout.js${RST}, then a line in ${DIM}$NAME/pages.ts${RST}"
				;;
			text)
				echo "  • Write your page:           ${DIM}$DIR/src/routes/$NAME/+page.svelte${RST}"
				echo "  • Add another Text:          copy that folder, then list it in ${DIM}src/lib/seo/routes.ts${RST}"
				;;
			none)
				echo "  • Nothing was scaffolded.    The landing page tells you what to write."
				echo "  • Or re-run with            ${DIM}--mode skeleton --kind deck${RST} (or ${DIM}--kind text${RST}) to have it written for you"
				;;
		esac
		echo "  • Every component, by example: ${DIM}$DIR/.samples-ref/${RST} (gitignored, yours to crib from)"
	fi
	[ "$DO_CI" = "yes" ] && echo "  • Push, then enable Pages:    Settings -> Pages -> Source: GitHub Actions"
	echo "  • Nothing is committed — ${DIM}git add${RST} what you want to keep."
	echo
} >&2
