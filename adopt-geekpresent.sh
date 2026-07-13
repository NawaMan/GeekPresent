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
#   4. Build environment: GeekPresent ships a CodingBooth (a container that builds it
#      with no host deps — see codingbooth.io), and the clone brings it along.
#        booth — keep it: `cd <dir> && ./booth` builds/runs, host needs only Docker.
#        host  — remove it: you build with your own node + pnpm.
#   5. Optional GitHub-Pages base path (for project sites served at /<repo>/).
#   6. Scaffold a GitHub Actions workflow that builds the subfolder and deploys.
#   7. Optional verification build (in the booth if kept, else on the host).
#
# Interactive by default: missing options are PROMPTED, with the default in
# brackets. A multiple-choice question takes one letter — "[Msf]" means minimal,
# skeleton or full, and the capital is what Enter gives you (the whole word works
# too). Answer '?' at ANY prompt to see what the question means, then answer it.
# Pass flags to skip prompts; pass --yes (or run without a TTY, e.g. piped) to
# take every default non-interactively. Destructive steps still ask unless --yes
# is given.
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
#   --dist <path>       build output folder, relative to <dir>  (prompted; default: dist)
#                       e.g. ../site to publish into a site/ at your repo root
#   --env <env>         booth | host               (prompted; default: booth)
#   --booth             keep the CodingBooth       (same as --env booth)
#   --no-booth          remove it; build on the host (same as --env host)
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
# Where builds run. GeekPresent ships a CodingBooth (the `booth` wrapper + .booth/), and a
# clone carries it along — so this is not "install a container", it is "keep the one that
# came with it, or throw it away". The wrapper resolves .booth next to ITSELF, so the copy
# in the subfolder is self-contained and cannot collide with a booth the host repo may
# already have at its root.
ENV_KIND=""      # booth | host     (resolved via prompt if empty)
# Where the built site lands, relative to the subfolder. Feeds GEEKPRESENT_OUT, which is what
# svelte.config.js hands adapter-static — so this one answer settles the local build, the
# verification build AND what CI uploads, which until now disagreed (CI hardcoded docs/).
DIST="dist"
DO_CI=""         # yes | no         (resolved via prompt if empty)
DO_BUILD=""      # yes | no
ASSUME_YES=0

# Prompts read from the terminal, NOT stdin — stdin is the script itself when you run
# this through `curl | bash`. Opened ONCE, on fd 3: a fresh `< "$TTY_IN"` per prompt
# re-opens at offset 0, which is invisible on a character device but hands back line 1
# forever on a regular file. It is a variable, not a hardcoded /dev/tty, so a test can
# stand a file of keystrokes in the terminal's place — and opening it here rather than
# probing with -e also answers the only question that matters: does it actually open?
TTY_IN="${GP_TTY:-/dev/tty}"
TTY_OK=0
if { exec 3<"$TTY_IN"; } 2>/dev/null; then
	TTY_OK=1
elif [ -t 0 ]; then
	exec 3<&0 # no /dev/tty, but someone is at the keyboard
	TTY_OK=1
fi

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
interactive() { [ "$TTY_OK" = "1" ]; }

# Every prompt takes '?' (or 'help'). This is the whole point of asking rather than
# flag-only: a question you don't understand is worse than no question, and the answer
# to "what IS a base path?" should be one keystroke away, not a trip to the README.
# Only '?' and the whole word 'help' — deliberately NOT a bare 'h', which is a real answer
# to the build-environment question ([h]ost). A letter that means two things is a trap.
is_help() { case "${1,,}" in '?'|help) return 0;; *) return 1;; esac; }

# Print a help blurb: blank line, indented body, blank line. Keeps it visually distinct
# from the prompt it interrupts, so the re-asked question doesn't look like a repeat bug.
show_help() {
	local line
	printf '\n' >&2
	while IFS= read -r line; do printf '  %s%s%s\n' "$DIM" "$line" "$RST" >&2; done <<< "$1"
	printf '\n' >&2
}

# ask <prompt> <default> [help] -> echoes the answer on stdout
ask() {
	local prompt="$1" default="${2:-}" help="${3:-}" reply=""
	if [ "$ASSUME_YES" = "1" ] || ! interactive; then
		printf '%s\n' "$default"; return
	fi
	while :; do
		if [ -n "$default" ]; then
			printf '%s [%s]: ' "$prompt" "$default" >&2
		else
			printf '%s: ' "$prompt" >&2
		fi
		IFS= read -r reply <&3 || true
		if [ -n "$help" ] && is_help "$reply"; then show_help "$help"; continue; fi
		printf '%s\n' "${reply:-$default}"; return
	done
}

# pick <prompt> <default> <choice>...  -> echoes the chosen word on stdout.
#
# A <choice> is "<letters>:<word>" — "se:skeleton" means s (and, quietly, e for
# "empty") both mean skeleton. Only the FIRST letter is advertised; the hint is
# those letters with the default's capitalised, so "[Msf]" says minimal/skeleton/
# full AND says minimal is what Enter gives you. One keystroke beats typing
# "skeleton", and the full word still works, so the prompt's vocabulary and the
# flag's can't drift apart. An answer that matches nothing re-asks rather than
# dying — a typo at prompt 3 of 6 shouldn't cost you the other five.
pick() {
	local prompt="$1" default="$2" help="$3"; shift 3
	local hint="" reply="" match="" choice letters word first
	for choice in "$@"; do
		letters="${choice%%:*}"; first="${letters:0:1}"
		[ "${choice#*:}" = "$default" ] && first="${first^^}"
		hint="$hint$first"
	done
	if [ "$ASSUME_YES" = "1" ] || ! interactive; then
		printf '%s\n' "$default"; return
	fi
	while :; do
		printf '%s [%s]: ' "$prompt" "$hint" >&2
		IFS= read -r reply <&3 || true
		reply="${reply,,}"
		[ -n "$reply" ] || { printf '%s\n' "$default"; return; }
		if [ -n "$help" ] && is_help "$reply"; then show_help "$help"; continue; fi
		match=""
		for choice in "$@"; do
			letters="${choice%%:*}"; word="${choice#*:}"
			if [ "$reply" = "$word" ]; then match="$word"; break; fi
			case "$reply" in
				[a-z]) case "$letters" in *"$reply"*) match="$word"; break;; esac;;
			esac
		done
		[ -z "$match" ] || { printf '%s\n' "$match"; return; }
		warn "'$reply' is not one of [$hint]${help:+ — type ? for help}. Try again."
	done
}

# confirm <prompt> [help]  -> returns 0 (yes) / 1 (no). Defaults to YES.
confirm() {
	local prompt="$1" help="${2:-}" reply=""
	if [ "$ASSUME_YES" = "1" ] || ! interactive; then return 0; fi
	while :; do
		printf '%s [Y/n]: ' "$prompt" >&2
		IFS= read -r reply <&3 || true
		if [ -n "$help" ] && is_help "$reply"; then show_help "$help"; continue; fi
		case "${reply:-y}" in [Nn]*) return 1;; *) return 0;; esac
	done
}

usage() { sed -n '2,/^set -euo/p' "$0" | sed 's/^# \{0,1\}//; s/^#$//' | sed '$d'; }

# Collapse a/b/../c to a/c, textually — the path may not exist yet, so realpath is out.
# Needed because the output folder is given relative to the SUBFOLDER ("../site"), while
# the CI workflow has to name it relative to the REPO ROOT ("site").
norm_path() {
	local seg out=()
	local IFS='/'
	for seg in $1; do
		case "$seg" in
			''|.) ;;
			..)   [ ${#out[@]} -gt 0 ] && unset 'out[-1]' ;;
			*)    out+=("$seg") ;;
		esac
	done
	printf '%s\n' "${out[*]}"
}

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
		--dist)   DIST="${2:?--dist needs a value}"; shift 2;;
		--env)    ENV_KIND="${2:?--env needs a value}"; shift 2;;
		--booth)    ENV_KIND="booth"; shift;;
		--no-booth) ENV_KIND="host"; shift;;
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
case "$ENV_KIND" in ""|booth|host) ;; *) die "--env must be 'booth' or 'host'";; esac

# -----------------------------------------------------------------------------
# Resolve configuration (flags win; otherwise prompt; otherwise default)
# -----------------------------------------------------------------------------
interactive && [ "$ASSUME_YES" != "1" ] && info "Type ${B}?${RST} at any prompt for help."

[ -n "$SOURCE" ] || SOURCE="$(ask "GeekPresent source (git URL or local path)" "$SOURCE_DEFAULT" \
"Where to copy GeekPresent FROM. The default fetches the latest from GitHub.
A local path works too (handy offline, or to adopt a version you have already
vetted) — it is cloned if it is a git repo, plain-copied if it is not.")"

DIR="$(ask "Subfolder to create in this project" "$DIR" \
"GeekPresent is adopted INTO a subfolder of the repo you are standing in, so it
sits alongside your code rather than taking over the root. Everything it owns —
sources, build scripts, its own package.json — lives under this one folder, and
deleting the folder undoes the adoption completely.")"

[ -n "$MODE" ] || MODE="$(pick "Samples — [m]inimal (1 deck), [s]keleton (empty), [f]ull (keep all)" \
	"minimal" \
"GeekPresent ships ~60 demo slides showing off every component. They are great
reference and terrible boilerplate, so pick how much of them you keep:

  minimal   keep ONE deck as your starting template, move the rest aside.
  skeleton  keep NONE: start from an empty deck (or page) and write your own.
            The clean slate — you begin by writing, not by deleting.
  full      keep everything; trim it yourself later.

minimal and skeleton MOVE the samples to .samples-ref/ rather than deleting them:
gitignored, still on disk, so you (and your coding agent) can read every demo." \
	"m:minimal" "se:skeleton" "f:full")"
case "$MODE" in full|minimal|skeleton) ;; *) die "mode must be 'full', 'minimal' or 'skeleton'";; esac

if [ "$MODE" = "minimal" ]; then
	[ -n "$NAME" ] || NAME="$(ask "Deck to keep as your starting template" "slides" \
"The name of the sample deck to keep — it stays exactly as it is, and you edit it
into your own talk. 'slides' is the general tour. Every other sample deck moves to
.samples-ref/, where you can still read it.")"
elif [ "$MODE" = "skeleton" ]; then
	# What to start from. 'none' is for someone who wants the framework and an empty
	# tree — it builds (the site is just the landing page), but they then hand-write
	# the six files 'deck' would have written for them, so it is not the default.
	[ -n "$KIND" ] || KIND="$(pick "Scaffold — [d]eck (slides), [t]ext (one long page), [n]one" \
		"deck" \
"GeekPresent builds two kinds of thing, so say which you are here for:

  deck  a slide deck — many small pages you arrow through. You get one title
        slide, ready to present, and add the rest.
  text  a Text — ONE long page that scrolls, for docs, an essay, a README site.
  none  nothing at all. The framework and an empty tree; the landing page tells
        you which files to write by hand. For shaping it entirely yourself.

Whichever you pick, the samples still move to .samples-ref/ for reference." \
		"d:deck" "t:text" "n:none")"
	case "$KIND" in deck|text|none) ;; *) die "kind must be 'deck', 'text' or 'none'";; esac
	case "$KIND" in
		deck) [ -n "$NAME" ] || NAME="$(ask "Name for your new (empty) deck" "slides" \
"The folder your deck lives in, and the URL it is served at: 'slides' gives you
src/routes/slides/ and /slides/title.html. Lower-case, no spaces.")";;
		text) [ -n "$NAME" ] || NAME="$(ask "Name for your new Text page (a route, so .html)" "guide.html" \
"A Text is a single page, so its name IS its URL and ends in .html: 'guide.html'
gives you src/routes/guide.html/ served at /guide.html. Lower-case, no spaces.")";;
	esac
fi
[ -n "$NAME" ] || NAME="slides"

BASE="$(ask "GitHub Pages base path for a project site, e.g. /my-repo (blank = domain root)" "$BASE" \
"Only for a PROJECT site, served under a sub-path: https://you.github.io/my-repo/
needs a base path of /my-repo, because the site does not live at the root.

Leave it BLANK for a user/org site (you.github.io) or a custom domain — which is
what GeekPresent is built for, and the path that actually works today: a base path
currently breaks prerender, because the SEO wiring emits a root-absolute
/sitemap.xml. The script will warn you again if you set one.")"

# Where the built site lands. One answer, three consumers (local build, verification build,
# CI upload) — before this they disagreed, with CI quietly writing somewhere else.
DIST="$(ask "Build output folder (relative to $DIR)" "$DIST" \
"Where the built static site is written. Relative to the $DIR folder, so:

  dist      -> $DIR/dist          (default; already gitignored)
  ../site   -> site/ at your repo ROOT, next to $DIR — for when the built site is
              what you publish and commit, e.g. an existing hand-written site/
              that you are adding a deck to.

This drives the local build, the verification build, and what CI uploads, so they
all agree. Nothing is clobbered: the build refuses to overwrite a non-empty folder
it did not create, so pointing it at an existing site/ is safe — it will stop and
tell you rather than delete your files.")"

# Booth is the default because it is the environment GeekPresent is itself developed in —
# the Boothfile pins the Node it wants and pre-installs the deck's dependencies into the
# image, so it is the best-tested route to a green build, and it asks nothing of the host
# but Docker or Podman. 'host' is for someone who already has node+pnpm and would rather
# not run a container; it DELETES the booth rather than leaving it lying around unused.
[ -n "$ENV_KIND" ] || ENV_KIND="$(pick "Build environment — [b]ooth (container, no host deps), [h]ost (your own node/pnpm)" \
	"booth" \
"GeekPresent develops itself inside a CodingBooth (codingbooth.io) — a container
carrying the whole toolchain — and the copy you just cloned brings a working one
along. So this is not 'install a container', it is 'keep the one that came with it':

  booth  keep it. 'cd $DIR && ./booth -- ./build-static.sh ./$DIST' builds with
         NOTHING installed on this machine but Docker or Podman. No Node, no pnpm,
         no version drift. './booth' alone opens VS Code in the browser.
  host   remove it — deletes $DIR/booth and $DIR/.booth/ — and build with your
         own node + pnpm.

The booth is used exactly as it comes; nothing here reconfigures or re-pins it." \
	"b:booth" "hn:host")"
case "$ENV_KIND" in booth|host) ;; *) die "environment must be 'booth' or 'host'";; esac

[ -n "$DO_CI" ] || { confirm "Scaffold a GitHub Actions deploy workflow?" \
"Writes .github/workflows/deploy-$DIR.yml at your repo root: on every push to main
that touches $DIR/, it builds the site and deploys it to GitHub Pages.

Safe to say yes — it only ever writes that one file, it will ask before overwriting
an existing one, and nothing runs until you enable Pages in the repo settings
(Settings -> Pages -> Source: 'GitHub Actions')." \
	&& DO_CI="yes" || DO_CI="no"; }

[ -n "$DO_BUILD" ] || { confirm "Run a verification build at the end? (slower; needs deps)" \
"Builds the site once, right now, so you find out here rather than three commits
later that something is wrong. Costs a few minutes: it installs dependencies and
runs a full prerender.

Say no if you are offline, or in a hurry, or just want to look at the files first —
you can always run the build yourself afterwards; the last thing this script prints
is the command." \
	&& DO_BUILD="yes" || DO_BUILD="no"; }

TARGET="$PWD/$DIR"

# The same folder, said two ways. DIST is relative to the SUBFOLDER — that is what
# build-static.sh takes and what GEEKPRESENT_OUT means, since CI runs with working-directory
# $DIR. CI_PATH is the same place relative to the REPO ROOT, which is what upload-pages-artifact
# needs. They differ the moment someone answers '../site', which is the whole reason to ask.
CI_OUT="$DIST"
case "$DIST" in
	/*)
		# Fine locally; GitHub can only upload from inside the checkout.
		CI_OUT="dist"; CI_PATH="$DIR/dist"
		warn "Output '$DIST' is absolute — CI cannot upload from outside the checkout,"
		warn "  so the workflow will build to $DIR/dist instead."
		;;
	*)
		CI_PATH="$(norm_path "$DIR/$DIST")"
		[ -n "$CI_PATH" ] || die "output folder '$DIST' resolves to the repo root — pick a folder, not '..'"
		;;
esac

# Does the output land OUTSIDE the subfolder ('../site')? That is a legitimate answer — it is
# how you publish into an existing hand-written site at the repo root — but the booth mounts
# ONLY the subfolder, so a build inside the container cannot write there: the path simply does
# not exist in it. CI is unaffected (it is not a container with one mount). Catch it here
# rather than let the booth build "succeed" and write the site into thin air.
DIST_ESCAPES=0
case "$DIST" in
	/*) DIST_ESCAPES=1;;
	*)  case "$(norm_path "$DIR/$DIST")/" in "$DIR"/*) ;; *) DIST_ESCAPES=1;; esac;;
esac
if [ "$DIST_ESCAPES" = "1" ] && [ "$ENV_KIND" = "booth" ]; then
	warn "The booth only sees $DIR/, so it cannot write to '$DIST' (outside it)."
	warn "  Builds to $CI_PATH/ will run on the host; the booth still works for everything else."
fi

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
	echo "  output     : $CI_PATH/  ${DIM}(built site; '$DIST' relative to $DIR)${RST}"
	case "$ENV_KIND" in
		booth) echo "  build env  : CodingBooth — keep $DIR/booth + $DIR/.booth/ (container; no host deps)";;
		host)  echo "  build env  : host toolchain — REMOVE $DIR/booth + $DIR/.booth/ (you supply node + pnpm)";;
	esac
	echo "  workflow   : $DO_CI"
	echo "  test build : $DO_BUILD"
	echo
} >&2
confirm "Proceed?" \
"Everything above, in one go. Nothing is committed — the script only writes files, and
you review them afterwards with 'git status' and stage what you want to keep.

The only things it touches outside $DIR/ are the deploy workflow (if you asked for one)
and the output folder shown above. Say no to walk away with nothing changed." \
	|| die "aborted."

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
	if confirm "Remove $DIR/.git so it becomes part of this project (not an embedded clone)?" \
"GeekPresent was just cloned, so $DIR/ is currently its own git repository sitting inside
yours. Git will not track its contents — it sees a nested repo and records nothing but a
stray gitlink, so your deck would never actually be committed.

Removing $DIR/.git turns it into plain files that your repo tracks normally. That is what
you want: this is copy-and-own, not a dependency. Say no only if you deliberately want a
submodule (and are prepared to wire it up yourself)."; then
		rm -rf "$TARGET/.git"
		ok "Removed $DIR/.git — it's now plain files in your repo"
	else
		warn "Kept $DIR/.git — git will treat $DIR as an embedded repo/submodule"
	fi
fi

# -----------------------------------------------------------------------------
# Step 2b — build environment (CodingBooth, or the host's own toolchain)
# -----------------------------------------------------------------------------
# GeekPresent develops itself inside a CodingBooth, and `booth` + `.booth/` are tracked, so
# the clone hands the adopter a working container environment whether they asked for one or
# not. That is a gift to most people and clutter to the rest — so it is a decision now,
# rather than an unexplained binary they find later and are afraid to delete.
#
# The booth that arrives is used AS IS — nothing here reconfigures, re-pins or re-downloads
# it; the whole value of the thing is that it is the same environment GeekPresent is built
# in. So there are exactly two outcomes: keep it, or delete the two paths it occupies.
if [ "$ENV_KIND" = "host" ]; then
	if [ -e "$TARGET/booth" ] || [ -d "$TARGET/.booth" ]; then
		rm -rf "$TARGET/booth" "$TARGET/.booth"
		ok "Removed $DIR/booth and $DIR/.booth/ — builds use your own node + pnpm"
	fi
elif [ -x "$TARGET/booth" ]; then
	ok "Kept the CodingBooth — ${DIM}cd $DIR && ./booth${RST} builds with no host deps"
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
        env:
          GEEKPRESENT_OUT: "$CI_OUT"
$( [ -n "$BASE" ] && printf '          BASE_PATH: "%s"\n' "$BASE" )
      # One-time: repo Settings -> Pages -> Source: GitHub Actions
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: $CI_PATH
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
build_on_host() {
	( cd "$TARGET" && pnpm install && ./build-static.sh "$DIST" ) \
		&& ok "Built $CI_PATH/" || warn "Build failed — check node + pnpm are installed"
}

if [ "$DO_BUILD" = "yes" ]; then
	info "Verification build ..."
	if [ "$ENV_KIND" = "booth" ] && [ -x "$TARGET/booth" ] && [ "$DIST_ESCAPES" = "0" ]; then
		# The booth needs Docker or Podman running, which is exactly the host assumption it
		# exists to avoid making. If it can't start, say so and use the toolchain we already
		# know how to drive — a failed verification build shouldn't look like a failed adopt.
		if ( cd "$TARGET" && ./booth -- bash -lc "pnpm install && ./build-static.sh '$DIST'" ); then
			ok "Built $CI_PATH/ via CodingBooth"
		else
			warn "Booth build failed (is Docker/Podman running?) — falling back to the host toolchain"
			build_on_host
		fi
	else
		build_on_host
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
	if [ "$ENV_KIND" = "booth" ] && [ "$DIST_ESCAPES" = "0" ]; then
		echo "  • Local build (no host deps): ${DIM}cd $DIR && ./booth -- ./build-static.sh $DIST --zip${RST}"
		echo "  • Or work inside it:          ${DIM}cd $DIR && ./booth${RST}  (VS Code in the browser, Node preinstalled)"
		echo "  • Or native:                  ${DIM}cd $DIR && pnpm install && ./build-static.sh $DIST${RST}"
	elif [ "$ENV_KIND" = "booth" ]; then
		# The booth is still there and still useful — it just can't reach $DIST from inside.
		echo "  • Build (on the host — the booth cannot write outside $DIR/):"
		echo "                                ${DIM}cd $DIR && pnpm install && ./build-static.sh $DIST${RST}"
		echo "  • Work inside the booth:      ${DIM}cd $DIR && ./booth${RST}  (VS Code in the browser, Node preinstalled)"
	else
		echo "  • Build:                      ${DIM}cd $DIR && pnpm install && ./build-static.sh $DIST${RST}"
	fi
	echo "  • Built site lands in:        ${DIM}$CI_PATH/${RST}"
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
