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
#
# Options:
#   --dir <name>        subfolder to create        (default: geekpresent)
#   --mode full|minimal sample handling            (prompted; default: minimal)
#   --keep <deck>       deck to keep in minimal     (prompted; default: slides)
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
MODE=""          # full | minimal   (resolved via prompt if empty)
KEEP_DECK="slides"
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
		--keep)   KEEP_DECK="${2:?--keep needs a value}"; shift 2;;
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

case "$MODE" in ""|full|minimal) ;; *) die "--mode must be 'full' or 'minimal'";; esac

# -----------------------------------------------------------------------------
# Resolve configuration (flags win; otherwise prompt; otherwise default)
# -----------------------------------------------------------------------------
[ -n "$SOURCE" ] || SOURCE="$(ask "GeekPresent source (git URL or local path)" "$SOURCE_DEFAULT")"
DIR="$(ask "Subfolder to create in this project" "$DIR")"
[ -n "$MODE" ] || MODE="$(ask "Sample handling — 'minimal' (1 deck + .samples-ref) or 'full' (keep all)" "minimal")"
case "$MODE" in full|minimal) ;; *) die "mode must be 'full' or 'minimal'";; esac
if [ "$MODE" = "minimal" ]; then
	KEEP_DECK="$(ask "Deck to keep as your starting template" "$KEEP_DECK")"
fi
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
	echo "  samples    : $MODE${MODE:+$( [ "$MODE" = minimal ] && echo " (keep: $KEEP_DECK)" )}"
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
if [ "$MODE" = "minimal" ]; then
	[ -f "$ROUTES/$KEEP_DECK/pages.ts" ] || die "deck '$KEEP_DECK' not found under src/routes — pick one with --keep"
	REF="$TARGET/.samples-ref"
	mkdir -p "$REF"
	info "Minimal mode: keeping '$KEEP_DECK', moving other samples to .samples-ref/ ..."

	MOVED=()
	# Decks = any route dir containing pages.ts (the kept one stays).
	for d in "$ROUTES"/*/; do
		name="$(basename "$d")"
		[ "$name" = "$KEEP_DECK" ] && continue
		[ "$name" = "(home)" ] && continue
		if [ -f "$d/pages.ts" ]; then mv "$d" "$REF/"; MOVED+=("$name"); fi
	done
	# Standalone sample/demo routes (text.html, seo.html) cross-link to the decks
	# above with relative hrefs, so they must go too. Keep robots.txt + sitemap.xml
	# (sitemap auto-tracks the remaining decks via import.meta.glob).
	for r in text.html seo.html; do
		[ -e "$ROUTES/$r" ] && { mv "$ROUTES/$r" "$REF/"; MOVED+=("$r"); }
	done

	# Keep the sitemap's hardcoded standalone-route list in sync with what's left.
	SEO_ROUTES="$TARGET/src/lib/seo/routes.ts"
	if [ -f "$SEO_ROUTES" ] && grep -q 'TEXT_ROUTES' "$SEO_ROUTES"; then
		sed -i "s|^const TEXT_ROUTES =.*|const TEXT_ROUTES = ['/'];|" "$SEO_ROUTES"
		ok "Trimmed sitemap's standalone-route list to just '/'"
	fi

	# The landing page hardcodes links to the sample decks; rewrite it minimally
	# so prerender doesn't crawl into removed routes. Original is preserved.
	HOME_PAGE="$ROUTES/(home)/+page.svelte"
	if [ -f "$HOME_PAGE" ]; then
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
   <a href="{base}/$KEEP_DECK/title.html">here</a>.</p>
EOF
		ok "Rewrote landing page (links to /$KEEP_DECK/title.html)"
	fi

	# Make sure the reference copies don't get committed or built.
	if ! grep -q '^\.samples-ref/' "$TARGET/.gitignore" 2>/dev/null; then
		printf '\n# Local-only reference copies of GeekPresent sample decks\n.samples-ref/\n' >> "$TARGET/.gitignore"
	fi
	ok "Samples relocated to $DIR/.samples-ref/ (gitignored, kept for reference)"

	# Safety net: a kept page may still link (in prose) to a removed route. We
	# can't guess the right replacement, so report it loudly rather than ship a
	# build that fails prerender. (For keep=slides this finds nothing.)
	if [ ${#MOVED[@]} -gt 0 ]; then
		pat="$(printf '%s|' "${MOVED[@]}")"; pat="(${pat%|})"
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
	[ "$MODE" = "minimal" ] && echo "  • Edit your deck:            ${DIM}$DIR/src/routes/$KEEP_DECK/${RST}  (samples: $DIR/.samples-ref/)"
	[ "$DO_CI" = "yes" ] && echo "  • Push, then enable Pages:    Settings -> Pages -> Source: GitHub Actions"
	echo "  • Nothing is committed — ${DIM}git add${RST} what you want to keep."
	echo
} >&2
