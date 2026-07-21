# AGENTS.md — Working on GeekPresent

Guidance for an AI agent (Claude Code or similar) helping a user build a presentation with this
framework. The user will usually ask in plain language ("help me add a YouTube link",
"start me from scratch"); match it to a **playbook** below and follow the steps.

Read the `README.md` first for the user-facing overview. This file is the *operator's manual*.

---

## Quick start for agents (read this first)

Get the environment and git shape right before editing. Wrong port / wrong host / wrong branch
wastes a whole session.

**Two hard stops before any feature edit (Rules 0 and 0b):**

1. **Proposal before code** — post Problem · Diagnostic · Approach, then wait (Rule 0).
2. **Linked worktree** — feature work is **not** edited on `main`. Before the first substantive
   write: either you are already under `worktree/<name>/`, or you create that checkout and work
   **only** there. **"Yes" / "go ahead" / "Let's go" authorises the *work*, not the *checkout*.**
   It is never permission to edit the main clone. Full text: Rule 0b and *Session = linked
   worktree + branch* below.

### Proposal before code — study, discuss, then edit

**Default for any change that is not pure Q&A.** Research is fine (read files, search, run
read-only commands). **Writing is not** — no source edits, no scaffolding, no "I'll start while
I explain" — until you have posted a short proposal and the user has replied.

Post **three headings, a few sentences each**, then **stop and wait**:

1. **Problem** — restate what the user wants in plain language, so a mismatch surfaces before
   code.
2. **Diagnostic** — what you found in the tree: what already exists, what is the outlier, which
   constraint bites. Put 1–2 clarifying questions *here* when something is still ambiguous.
3. **Approach** — how you intend to do it, including deliberate non-goals and open choices the
   user should pick. **When the change will touch source**, Approach **must** name the checkout
   in one explicit line — either:
   - **Worktree:** `worktree/<name>` + branch `<name>` (this is the default for feature work), or
   - **Main / here:** only if the user already opted out ("here", "on main", "no worktree") or
     the change is a pure docs/typo one-liner they want on main.

   A proposal that describes the code change but **omits the checkout** is incomplete — fix it
   before asking for a green light. After green light, if you are still on the main clone and
   Approach said worktree, **create the worktree first**; do not start writing on main.


Proceed only when the user agrees, picks an option, or explicitly green-lights
("do it", "implement", "yes", "go ahead"). One approval covers that plan — not every later
surprise; if the approach has to change, re-propose the delta.

**Skip the gate when:**

- Pure questions / orientation with **no** code change
- The user already approved this approach in the **same thread**
- They explicitly skip it ("just implement", "no plan", "don't discuss")
- Mechanical follow-through of an **already-agreed** plan (the next step of work already green-lit)
- A skill's **own** gate already covers the same wait — but **not every skill menu is enough**.
  - `land-branch`: preflight report *as* Problem · Diagnostic · Approach, then wait (replaces a
    second copy of the form).
  - `pick-todo`: the menu only chooses *which* feature. After the pick you **still** post
    Problem · Diagnostic · Approach and wait — a one-line pitch is not a plan.

This is Rule 0 under *Rules you must follow*. **Rule 0b (worktree isolation) is not skipped by a
green light** — it is a separate pre-edit check. Skills that implement things restate both at the
top so they are hard to miss when a skill is loaded alone.

### CodingBooth — how to run things

This repo ships a **CodingBooth** wrapper (`./booth` + `.booth/`). **Agents run everything
through the booth** — install, test, build, and the **dev server**. Many hosts have no Node or
pnpm; the booth image does. Never assume host `pnpm` / `node` / bare `vite` exist. Details also
live in `dev-run.sh` and `.booth/config.toml` — this section is the agent summary.

| Goal                                              | Command                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Dev server (**booth only** — see Rule 6)          | `./booth exec --run -- ./dev-run.sh`                                                   |
| One-shot in the booth (tests, scripts, …)         | `./booth exec --run -- <command>`                                                      |
| Run the test suite                                | `./booth exec --run -- pnpm test`                                                      |
| Static build (into `docs/` via vite, or a folder) | `./booth exec --run -- pnpm build` or `./booth exec --run -- ./build-static.sh ./dist` |

**A second booth (a worktree, a parallel session) needs no flags at all.** The same command works
from any worktree; `port = "NEXT:31000"` takes the next free slot and the slides follow at +173:

```bash
./booth exec --run -- ./dev-run.sh    # 1st: 31000/31173 · 2nd: 32000/32173 · …
```

**Read the port off `./booth list` — do not assume 31173, and do not hand-pick a port to "avoid"
a collision.** `NEXT` already can't collide; a number you invent can. Use `--port <n>` only when you
need a *predictable* port (reconnecting to a known booth, or giving the user a stable URL) — it sets
control port, slides (`<n>+173`) and container name together. Never edit `.booth/config.toml` to
make room.

**No host pnpm / Node fallback for agents.** Do not run `pnpm …`, `npm …`, or `vite …` on the host
for this project — not for dev, not for tests, not for builds, not “just this once”. If Docker or
booth is broken, stop and tell the user; do not invent a host toolchain path.

**Two different ports (easy to mix up):**

| Port              | What it is                                                                   | How to set it                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Booth control** | Host → container **10000** (CodingBooth's own port; shown in `./booth list`) | `.booth/config.toml` → **`port = "NEXT:31000"`** (shipped). First free port from 31000, chosen when the booth is **created**; override per-run with `--port`. |
| **Vite / slides** | Host → container **5173** (the slide site)                                   | `run-args` in `.booth/config.toml`: `"--publish", "<host>:5173"` (stock default is **+173:5173**)                           |

**Why concurrent booths just work.** Config ships `port = "NEXT:31000"` with a *relative* expose
(`"--publish", "+173:5173"`), so each booth takes the next free control port and its slides track it
at +173 — verified with two worktrees at once (31000/31173 and 32000/32173, no flags). `exec` also
takes `--port` (CodingBooth ≥ 0.62.0) when you want a specific number. There is **no**
`GEEKPRESENT_PORT`; that name is obsolete.

**Booth name = folder name.** CodingBooth names the container after the project directory (e.g.
worktree `…/worktree/view-source` → booth `view-source`). Check with `./booth list`. Still do
**not** kill someone else's booth or the user's running dev to free a port (Rule 6).

**A second booth from the same folder** gets the port appended — `GeekPresent` on 31000, then
`GeekPresent-12000`. A worktree is its own folder, so its booth is just the folder name
(`…/worktree/view-source` → `view-source`), no suffix.

**Once two booths share one folder, `exec` needs `--name`.** It will not guess between them:

```text
Error: multiple booths match code path "/home/nawa/dev/git/GeekPresent"
(GeekPresent, GeekPresent-12000). Use --name.
```

```bash
./booth list                                        # read the exact NAME column
./booth exec --run --name GeekPresent -- pnpm test   # then target one
```

**Pick the booth you started, or ask** — the other one is likely the user's running dev, and Rule 6
says don't disturb it. Working from a worktree sidesteps this entirely: its own folder, its own
booth, no ambiguity.

### Session = linked worktree + branch (GitKraken-visible)

**This is the only setup for isolated agent sessions on this project.** One session folder, one
branch, registered with the main clone so GitKraken lists it.

```bash
# from the main clone root, e.g. ~/dev/git/GeekPresent
mkdir -p worktree
git worktree add worktree/<name> -b <name>    # branch + linked checkout in one step
cd worktree/<name>
claude                                        # or grok / your agent CLI — start it HERE, from inside
```

Start the agent **inside** the folder git already made. Do not use an agent CLI's own worktree
feature to create it (see below).

| Piece | Value | Notes |
| --- | --- | --- |
| Working tree | `<repo>/worktree/<name>/` | Open this in the editor / agent CLI / GitKraken |
| Branch | `<name>` (same as the folder) | Created by `-b <name>`; already checked out |
| Git bookkeeping | `<repo>/.git/worktrees/<name>/` | Auto; **never** open or check out files here |
| Gitignore | `/worktree/` in `.gitignore` | Nested under main → must be ignored (already present) |

**First run in a fresh worktree.** A new worktree has no `node_modules/` and no `.svelte-kit/`, and
`tsconfig.json` extends `./.svelte-kit/tsconfig.json` — so `pnpm test` fails on a confusing
`MODULE_NOT_FOUND` for `tsconfig.json` until SvelteKit has synced. Non-TTY `exec` also makes pnpm
abort its deps check. Both are one-time; this line handles them:

```bash
./booth exec --run -e CI=true -e npm_config_verify_deps_before_run=false \
  -- sh -c 'pnpm exec svelte-kit sync && pnpm test'
```

Neither is a worktree or booth problem — any fresh checkout needs the same. After that, plain
`./booth exec --run -- pnpm test` works. (Verified in a worktree booth: 142 files, 2439 tests, all
passing.)

Check that GitKraken will see it (open the **main** repo, not only the worktree path):

```bash
git worktree list
# …/GeekPresent                      […] [main]
# …/GeekPresent/worktree/<name>      […] [<name>]
```

A healthy linked worktree has a **file** `.git` pointing at the main repo (not a `.git/` directory):

```text
gitdir: /…/GeekPresent/.git/worktrees/<name>
```

**Do not let an agent CLI create the isolation for this project.** Most of them ship a worktree
feature that puts the checkout somewhere *outside* `<repo>/worktree/` — under the tool's own home
directory, or a temp dir:

- **Grok** — `grok --worktree=…` / `grok -w` / Ctrl+W → often a **standalone clone** under
  `~/.grok/worktrees/…` (a full `.git/` directory, not a linked worktree)
- **Claude Code** — `EnterWorktree`, or an agent spawned with `isolation: "worktree"` → a linked
  worktree, but in a scratch location of its choosing

Either way the checkout is **invisible** to GitKraken's worktree list for the main repo, which is
the whole point of the recipe above. Use `git worktree add worktree/<name>` yourself and start the
agent inside it.

If one already exists and the user wants GitKraken: move work aside, `git worktree add
worktree/<name> <branch>` from main, re-apply any uncommitted edits, delete the stray checkout.

Optional: an agent CLI's home-dir bucket can be redirected so accidental paths resolve under the
repo (this does **not** convert a standalone clone into a linked worktree):

```bash
# from main clone — only if you want the path alias
ln -sfn "$(pwd)/worktree" ~/.grok/worktrees/git-geekpresent
```

When the user asks for “a session”, “a worktree”, or a feature checkout: run the recipe above
(or confirm `worktree/<name>` already exists and is linked), then work **inside** that folder.
Keep `/worktree/` in `.gitignore`.

**Default for feature work: use a linked worktree** (`worktree/<name>` + branch `<name>`) — this
is **Rule 0b**, not a soft preference. Unless the user says otherwise ("here", "on main", "no
worktree") or you are **already** inside one, **stop before the first substantive edit** and create
the checkout from the main clone root:

```bash
mkdir -p worktree
git worktree add worktree/<name> -b <name>
cd worktree/<name>
```

Prefer a short name from the task (`mnemonic-underline`). Tell the user the path and branch. Do
**not** use the agent CLI's own worktree feature (see above). `pick-todo` asks, and defaults the
answer to worktree. Do **not** invent a worktree for pure Q&A, docs-only nits the user wants on
main, or a one-line fix they explicitly want in place.

**Pre-edit self-check (feature work) — fail closed:**

- [ ] `pwd` is under `…/worktree/<name>/` **or** the user opted out of isolation
- [ ] `git branch --show-current` is **not** `main` / `master` (unless the user opted out)
- If either box fails: **do not write**. Create or enter the worktree first, then continue.

### Landing a worktree's branch into main

Merging is a deliberate act, same bar as any commit/push (Rule 8) — only when the user asks to
land/merge a worktree's work, never on your own initiative. The procedure:

1. **In the main clone**, stash anything uncommitted so main is clean before the merge:
   `git stash` (skip if main is already clean).
2. **In the worktree**, rebase the feature branch onto main: `git rebase main`. Resolve any
   conflicts as they come up. If the rebase touched code the tests cover, rerun the suite before
   continuing — that worktree's own booth (`./booth list` for its name, then `./booth exec --run
   --name <name> -- pnpm test`), never the host.
3. **From the main clone**, `git merge --no-ff <branch>`. Always a real merge commit — **never
   squash** (`git merge --squash`) and never fast-forward-only — so the worktree's commit history
   is kept, not flattened.
4. If step 1 stashed anything, `git stash apply` (not `pop`) to restore it, confirm the working
   tree looks right, then `git stash drop`. Apply-then-drop leaves the stash recoverable if
   restoring it onto the just-merged main conflicts — `pop` would have already discarded it.

Landing and cleanup are separate asks: only move on to *Cleaning up after a session* below once the
user confirms the merge is done and they want the worktree removed too — don't chain them unasked.

### Cleaning up after a session

**Clean up only what you created, and only when the user says the work is done.** A worktree holds
real work — an unmerged branch and possibly uncommitted edits — so removing one is destructive and
is the user's call, never a tidy-up you do on your own initiative.

Most booths need no teardown: without `--keep-alive` the container is `--rm` and disappears when its
command ends. Only `--keep-alive` / `--daemon` booths persist, and those are the ones that pile up:

```bash
./booth list                        # what is actually running, and from which CODE PATH
./booth stop   --name <booth>       # stop a booth you started (add --force if it will not)
./booth remove --name <booth>       # then remove the container if it lingers
```

Then, **from the main clone** (never from inside the worktree you are deleting):

```bash
git worktree remove worktree/<name>   # refuses if there are uncommitted changes — do NOT --force
git branch -d <name>                  # -d only; refuses to drop unmerged work
git worktree list                     # confirm it is gone
```

`--force` on either command silently discards work. If git refuses, that refusal is the point:
stop and tell the user what is unmerged or uncommitted, and let them decide.

**If you started a booth, say so and leave it running** unless asked to stop it. Once two booths
share a folder it is no longer obvious which is yours — and Rule 6 says never kill the user's dev.

### Already in a worktree → stay on the feature branch

If this checkout is an **isolated line of work** (not the long-lived main clone), the branch
should already match the folder (`git worktree add … -b <name>`). If you are still on `main` /
`master` inside `worktree/<name>/`, fix that **before the first substantive edit**:

How to tell you are in a worktree (any one is enough):

- Path is `…/worktree/<name>/…`, or `.git` is a file with `gitdir: …/.git/worktrees/…`
- `git rev-parse --git-dir` and `--git-common-dir` resolve to different paths
- The user said this is a worktree / feature session

Then:

1. Prefer branch name = folder name (`…/worktree/view-source` → `view-source`). Reuse that
   branch if it exists; otherwise `git checkout -b <name>`.
2. Tell the user the branch name so they can push / open the PR when ready.

Still **do not** `git commit`, `git push`, or open the PR unless the user asks (Rule 8). Creating
or switching the branch is the exception.

If you are on a normal day-to-day clone of `main` (no `worktree/<name>` path) and the change is
**feature work** (new component, multi-file behaviour, anything `pick-todo` would offer), **Rule 0b
applies** — create the worktree recipe above before the first write; opt out only when the user says
so. Skip isolation for pure Q&A, tiny docs/typo fixes, or an explicit "do it here / on main".
**"Go ahead" on a plan is not an opt-out.**

## Skills — the executable half of this file

The recurring jobs are also shipped as **skills** in `.claude/skills/`, each a checklist that ends in a
working, tested artifact. Prefer the skill when one matches; come back here for the prose and the
background. Implementation skills still obey **Proposal before code** (Rule 0) and **feature work
in a linked worktree** (Rule 0b) — restate both at the top when a skill is loaded alone.
`pick-todo`'s menu is only the first gate (which feature); after the pick it still requires the full
form. `land-branch` folds the form into its preflight report.

| skill | use it when |
|---|---|
| `new-slide` | authoring a slide — route folder, `+layout.js`, the `pages.ts` entry, templates |
| `new-component` | adding a component — the `style`/`id`/`class` contract, a pure `*Core.ts`, role tokens |
| `adjust-mode` | placing things at exact canvas pixels, `Connector` diagrams, SAVE, the style guard |
| `deck-tests` | the test contract — the `dom` / `ssr` projects, and why prerender needs `svelte/server` |
| `land-branch` | merging a worktree's branch into main — preflight, rebase, booth test, `--no-ff` |
| `pick-todo` | "what's next?" — shortlist open `TODO.md` items, user picks, then build |
| `todo` | record an idea in `TODO.md` only — never implement |

`tests/skills.test.ts` pins every repo path those skills cite, so a moved file fails the suite rather
than misleading the next agent.

---

## What this project is (orient yourself in 30 seconds)

- A **SvelteKit static site**. `@sveltejs/adapter-static`, every route prerendered, builds to
  `../docs/`, deploys to **GitHub Pages**. There is **no server** — `+server.js`, `+page.server.js`,
  `load()` and form `actions` will *not* work on GitHub Pages. Don't add them.
- **A presentation is just a route folder.** `slides/` is the *default* presentation's path — the
  name isn't special. A presentation lives at `src/routes/<presentation>/` (e.g. `src/routes/slides/`), and the
  design intent is that you can host **multiple presentations** in one project, each under its own
  folder.
- **One slide = one route.** A slide lives at `src/routes/<presentation>/<name>.html/` and contains:
  - `+page.svelte` — the slide content
  - `+layout.js` — exactly `export const prerender = true; export const trailingSlash = "never";`
- **Slide order** is each presentation's own `pages.ts` (an array of `{ path, title }`), e.g.
  `src/routes/slides/pages.ts`. The presentation's `+layout.svelte` publishes it via
  `setPages(pages)` (from `$lib/presentation`); `TitlePage` / `ContentPage` read it via `getPages()`.
  So navigation and the Table of Contents are **scoped per presentation** — multiple presentations coexist,
  each with its own list. (Nothing imports a single global `pages.ts` anymore.)
  A slide can also read **where it sits** with **`getProgress()`** (same module): a reactive store of
  `{ index, position, total, fraction, present }` over the *visible* slides, combining that list with the
  live route — for a page that wants to draw its own progress bar or a "3 / 7" chip. `ProgressBar` (below)
  is the ready-made bar; the pure maths is `$lib/utils/progressCore`.
  An entry may carry **`hidden: true`** to make it an **appendix**: still a real, prerendered,
  linkable slide, but out of the deck's linear order — →/Space step over it and the TOC doesn't
  list it. **Contiguous** hidden entries are ONE appendix (a chapter you page through). You jump
  in with `AppendixLink` and leave by paging off the end of it; see the templates below and
  `slides/appendix-page.html`.
- **Templates** (`src/lib/templates/`): `TitlePage` (named slots `title` / `subtitle` / `subsubtitle`)
  and `ContentPage` (`title` + `subtitle` props + default slot). Both auto-insert the nav bar
  (`ContentPage` takes `nav={false}` to drop it). Third: `AppendixPage` — a slide you jump *into*
  and return *from*, a **function call rather than a destination**. It works like a real book's
  appendix:
  - **A chapter, not a slide.** Contiguous `hidden` entries are one run, and PREV/NEXT page
    through it as through the body of the deck (FIRST/LAST are the run's own ends).
  - **The forward march is the return.** The run's last NEXT — and so → and `Space` — goes back
    to the slide that called the appendix; paging back off the front does too. **RETURN** (or
    `Backspace`) is the shortcut for leaving from the middle, and it rides in the nav bar's slot.
  - The caller is read from `?return=…`, which the calling `AppendixLink` stamps with its *own*
    slide name — so the same appendix returns to whichever slide asked — and every link inside
    re-stamps it. With no usable address (a direct link, a bookmark, or one refused as unsafe by
    `utils/appendixCore.ts`) the way out becomes the first slide and the control reads **DECK**:
    an appendix must never strand you.
  - **`hidden` is optional — it does not make an appendix.** It only decides whether the deck's
    forward march can *find* one. Leave it off and the same component is back matter in the normal
    flow: listed in the TOC, paged into by →/Space, still returning to a caller that jumped in (but
    its NEXT marches on into the deck, since it *is* in the march — only a hidden run has ends that
    lead out). The demo deck ships one of each: `appendix-detail{,-2}.html` (hidden) and
    `appendix-listed.html` (listed).
  - **`transition`** (opt-in, set it on *both* the link and the page) animates the detour: you travel
    **down** to the appendix (the deck rises out of view, the appendix comes up from below) and back
    **up** out of it, whichever control leaves; paging within the appendix stays sideways. On an
    in-flow (non-hidden) appendix it animates only the way *out* — arming the pager there would drag
    the surrounding deck into client-side navigation, and those slides may render Monaco. It
    requires client-side navigation, and **Monaco cannot survive that** — so an animated appendix
    must use `SourceView`/`QuickCode`, never `ViewSource`/`Code`/`CodeBox`. Same rule as a
    View-Transition deck; see `SourceView` below.
- **The slides layout** (`src/routes/slides/+layout.svelte`) auto-adds the Table of Contents, the
  display-mode control, and the Copyright notice, and does all the scaling. Slides are authored on a
  fixed **1920×1080** canvas; FITTED mode transforms it to fit the window, SCALED shows it at an exact
  factor (1:1 and beyond, centered and pannable, with a minimap) and reveals speaker notes below the
  slide when zoomed out. Display mode lives in the `displayMode` store. Text color is `#C0F1FF` on `#181818`.
- **Components** (`src/lib/components/`): `Box`, `Note`, `Hint`, `Label`, `YouTube`,
  `ScrollDiv` (wheel-pannable container, `axis` x/y/both, optional draggable `scrollbar`;
  `WideDiv` is its `axis="x"` alias),
  `Code`, `JavaCode`, `CodeBox`, `JavaCodeBox`, `QuickCode` (small dark monospace box for short
  hand-written snippets; not Monaco), `Terminal` (a fake console — a command types itself out,
  the machine pauses, the output prints; the typing is pure CSS `@keyframes`, so the session
  is seekable: it waits behind a play button, carries a transport with a tick per command, and
  `keys="global"` lets Space run it one command at a time and then page the deck. Don't put an
  `<AnimationBar />` on a Terminal slide — both would drive the same clock; pass
  `controls={false}` if you want the bar to own it),
  `ViewSource` (optional per-slide `?raw` registration for ☰ → **SOURCE** / **EDIT**. In
  **`pnpm dev`**, SOURCE and EDIT are **deck-wide** even without ViewSource: the shell loads
  `+page.svelte` via `/__geekpresent/source-load` and hosts a canvas-space CodeBox or the
  unscaled `/_source-edit` popup. A mounted ViewSource still supplies `?raw` bytes and works on
  a static host. EDIT opens `/_source-edit` for typing (Monaco's caret drifts under the canvas
  CSS scale); **SAVE** / **REFRESH** / **CLOSE** as before — SAVE is NOT ALLOWED on a static
  host. On a Text (no tool bar) ViewSource keeps the classic corner `</> Source` button)
  and `SourceView` (the same control, Shiki instead of Monaco for the in-slide panel — use it
  on any slide reached by a CLIENT-SIDE navigation, i.e. a View-Transition deck or an appendix
  with `transition`, because Monaco's CDN loader renders blank after a `goto`; EDIT still opens
  the same unscaled popup),
  `Block` / `ImageBlock` (absolutely-positioned
  wrappers you place at exact canvas pixels — drag/resize them in **ADJUST mode**,
  see that playbook), `Connector` (an arrow auto-routed between two *named* `Block`s —
  see the diagram playbook), `Video` (a `<video>` with themeable chrome and *time
  bookmarks* — chapter buttons that seek, the current one highlighted; import the
  file as an asset rather than hard-coding a path), `VideoPage` (the same player
  filling the canvas, nav bar included — a complete slide, as `WebPage` is) and
  `Columns` / `Column` (a thin grid for two- and three-column layouts; a media/text
  *split* is the same component with unequal `widths`, not a second one. `resizable`
  lets a viewer drag the gutters, and ADJUST mode always does — with a `widths` chip
  that copies the dragged ratio back into source, since a drag saves nothing),
  `QRCode` (a scannable link, encoded on the slide — the symbol is computed from the
  text, not fetched, and drawn as SVG so it survives the canvas transform. `value` is
  all it needs; an `http`/`mailto`/`tel` value links itself. Prefer it over committing
  a `-QR.png`, and note `YouTube`'s `qr` prop is now optional for exactly that reason),
  `AppendixLink` (the call *into* an appendix — `<AppendixLink to="appendix-gc.html">how the GC
  marks</AppendixLink>`; it stamps the current slide as the return address, so you never type one),
  `ProgressBar` (a thin "how far through the deck" bar that fills as you page — it reads `getProgress()`,
  so it needs no props; drop it in a deck's `+layout.svelte` after `setPages`, tagged `gp-chrome no-print`
  so it bows out of captures and printouts. geeklight wears one deck-wide),
  plus two canvas-level **singletons** `SlideDeck` mounts for you — no slide places them:
  `Spotlight` (dims the canvas and rings a *named* `Block`, driven by a `<Note>` line the
  speaker covers in the console) and `Annotate` (the speaker's **pen** — freehand ink on the
  live slide, persisted per slide; see its playbook, and note the deck must pass `annotate`
  to offer it),
  plus framework-internal `Copyright`, `CtrlBtn`,
  `NavigationBar`, `TableOfContent`,
  `OverviewPage` (the all-slides grid — press **O**, click a slide to jump, Escape closes. `SlideDeck`
  mounts it; no slide places it. Tiles are live `?clean` iframes, lazy-mounted; `hidden` appendices
  are omitted. In **`pnpm dev`**, **EDIT** (or **E**) arms deck-structure editing: **ADD**, between-page
  **+**, and **×** unlist (writes route folder + `pages.ts` via `/__geekpresent/page-add` /
  `page-remove`; production answers NOT ALLOWED). Spec: `specs/DECK-EDIT-1.md`. Core:
  `utils/overviewPageCore.ts` + `deckEdit/pageEditCore.ts`),
  `SizeMode`, `Seo` (renders SEO/social metadata
  into `<svelte:head>` — see the SEO note under *Gotchas*).
- Package manager is **pnpm**, but **only inside the booth** — always
  **`./booth exec --run -- …`** (see *Quick start for agents*). The host may not have pnpm at all.

## Two kinds of artifact: presentations and texts

Everything above describes **presentations**. There is a second artifact type, the
**Text** — *one long page* (fluid width following the window, capped at **1080px**; height grows with the content)
that you author by hand and scroll, built from the same `$lib` components. It is
the read-at-your-own-pace counterpart to a slide deck.

- Both types publish a **mode** via Svelte context (`$lib/presentation` —
  `setMode('presentation' | 'text')` / `getMode()`, default `'presentation'`).
  Reused components read it to adapt — e.g. in a Text the `NavigationBar` collapses
  to a single **TOP** control that scrolls the page up. This is the seam for
  handling slide-oriented components (overlays, slide-anchored hints) in a Text
  later, one at a time.
- A Text is a route folder with a tiny **`+layout.svelte`** that wraps its `<slot/>`
  in **`$lib/components/TextPage.svelte`** — the shared "Text shell": a
  `100vw × 100vh` scroll container holding a fluid column (follows the window,
  capped at 1080px, centered) and `setMode('text')`. Plus the standard `+layout.js`
  and a `+page.svelte` of content. The shell owns its own scroll so the document
  opens at the top and isn't affected by the slide centering — see
  **`src/routes/text.html/`** as the worked example.
- A Text is **not** listed in any `pages.ts` (it isn't a slide). The shell lives in
  one place (`TextPage`); both Text artifacts (`text.html/` and the `(home)/`
  landing) share it, so each `+layout.svelte` is just the `<TextPage>` wrapper.
  `TextPage` applies no typography — authored `h1/p/a` use bare browser defaults,
  styled per-artifact in the Text's own `+page.svelte`.

### The landing page — `src/routes/(home)/`

The site root `/` is itself a Text artifact: the project's **index/home page**,
linking to the sample Text (`/text.html`) and the two presentations.

- `(home)` is a SvelteKit **route group** — the parentheses mean the folder name is
  *not* part of the URL, so `(home)/+page.svelte` is served at `/` (and prerenders
  to `docs/index.html`).
- The group exists so `/` can have its **own** `+layout.svelte` (wrapping the shared
  `TextPage` shell) *without* that layout wrapping the presentations (`slides/`,
  `demo/`) or the other Text (`text.html/`) — each of those brings its own layout. The top-level
  `src/routes/+layout.svelte` / `+layout.js` (global CSS + prerender) still wrap
  everything; the group's layout nests inside them for `/` only.
- Because `/` renders the landing directly, there is **no root redirect** — the old
  `src/routes/+page.svelte` redirect and `redirect-index.html` (copied over
  `docs/index.html`) were removed, and `package.json`'s `build` no longer does that
  copy. (Per-presentation index redirects like `slides/+page.svelte` → first slide
  are unrelated and still in place.)
- To add another standalone Text, copy `src/routes/text.html/` to a new route (e.g.
  `src/routes/my-text/`); the root stays the landing.

### And a third, which nobody authors: the handout

`/_handout/<deck>.html` (`src/routes/_handout/[deck].html/`) is every slide of a deck stacked
into one printable document — `Ctrl+P → Save as PDF` — with `?notes` adding a band of speaker
notes under each. Two compact OVERVIEW layouts share the route: **`?grid`** (a landscape
thumbnail contact-sheet) and **`?grid&notes`** (a portrait list, thumbnail left / `<Note>` right).
All three are **derived**: they glob the real slide components out of the routes
(`$lib/handout/handoutDecks.ts`), so there is nothing to author and they cannot drift from the
deck. The layout is read at `onMount` (not init) so SSR/hydration start on the `pages` layout and
then flip — a query param can't change a prerendered file. The notes grid renders each slide
TWICE (a thumbnail with notes off, and a note-only pass) via `HandoutFrame`, because the `<Note>`
lives inside the slide's scaled canvas and CSS can't lift it out to full size. Four more things
are load-bearing when you touch anything nearby:

- **It renders slides into the prerendered HTML — the only page that does.** `SlideDeck` gates
  its slot on `initialized`, so a built *slide* is an empty shell until the browser arrives; a
  document must not be, so the handout mounts no shell and calls `setPages` itself. This means
  **every slide must survive a server render**. (`AppendixPage` did not, and reaching for
  `url.searchParams` at prerender is exactly the way to break it again.)
- **A deck's SURFACE lives in its `pages.ts`**, not in its `+layout.svelte`:
  `export const deck = { width, height, baseFontSize, deckClass, background, font }` — all of
  them `<SlideDeck>` props. The layout reads it *and so does the handout*, which never mounts
  the layout. A deck that is not a 1920×1080 dark canvas must declare it or it will print as
  one. See `routes/portrait/pages.ts` and `routes/geeklight/pages.ts`.
- **It lives OUTSIDE the decks, and reserves no slide name.** A deck is a folder of slides its
  author owns. It renders them under a **`<base href="…/<deck>/">`** so their relative links
  (`./appendix-detail.html`, `../`) still resolve into the deck — the browser honours it and so
  does SvelteKit's prerender crawler, which is what keeps the crawl off a wall of 404s. Don't
  add relative URLs to that page; the base tag would move them too.
- The printed page's arithmetic is pure and tested (`$lib/handout/handoutCore.ts`) — and
  `SlideDeck`'s own `@media print` block **reuses it**, so `Ctrl+P` on one slide prints it at the
  same size that slide has inside a handout, and `?notes` on a slide prints it with its `<Note>`
  on the one page. A slide that cannot print (a live `<iframe>`) is **named on the sheet**, the
  same bargain CAPTURE makes, reusing `captureCore.findBlockers`.
- Three traps live here, and each was invisible until a PDF was measured:
  - **The `@page` rule cannot live in `<svelte:head>`.** An `{@html}` there is server-rendered and
    then *adopted unchanged* at hydration, so the paper stays whatever the server thought — the
    frame grows its notes band and the note lands on a second page. It is written to the head
    imperatively (`$lib/handout/pageRuleDom.ts`).
  - **Canvas-space chrome anchored with `right`/`bottom` is poison on paper.** Chrome, laying out
    for print, measures an absolutely-positioned element inside a `transform: scale()`d ancestor
    *without applying the transform* — so a right-anchored `Copyright` looked like overflow and
    shrank every sheet to 0.76×. Anchor from the left, or don't print it.
  - **Round the printed box, then derive the scale from it** — never the reverse. A rounded scale
    multiplied back put the canvas a tenth of a pixel outside the paper, which a printer answers by
    shrinking the whole deck.

## Rules you must follow

0. **Proposal before code.** For any change that is not pure Q&A: research read-only, post
   **Problem · Diagnostic · Approach** (a few sentences each), and **wait** for the user before the
   first substantive edit. Full text, skips, and skill exceptions are under *Quick start for
   agents* → *Proposal before code*. Do not treat "the user described a feature" as permission to
   start writing. Approach must name the **checkout** (worktree vs main) when source will change.
0b. **Feature work runs in a linked worktree — never on main by default.** Before the first
   substantive edit of feature work (new/changed behaviour, multi-file work, anything a playbook
   or implementation skill would do):
   1. If path is already `…/worktree/<name>/` (or `.git` is a `gitdir:` file), stay there; ensure
      the branch name matches the folder.
   2. Else if on the main clone: from the **main clone root**,
      `mkdir -p worktree && git worktree add worktree/<name> -b <name>`, then **cd into that
      folder** and only edit there. Prefer a short name from the task. Tell the user the path and
      branch.
   3. Do **not** use the agent CLI's own worktree (`grok -w` / `isolation: "worktree"` / Claude
      EnterWorktree) — those checkouts are invisible to GitKraken for this repo.

   **Skip isolation only when:** pure Q&A; docs/typo one-liners the user wants on main; the user
   said "here" / "on main" / "no worktree"; or you are already inside a linked worktree.

   **"Go ahead" on a plan is not permission to edit main.** It authorises the *work*, not the
   *checkout*. If Approach forgot isolation and you are still on main, stop, create the worktree
   (or ask for a name), and edit only there. Full recipe: *Quick start* → *Session = linked
   worktree + branch*. Pre-edit self-check lives there too — fail closed.
1. **Keep `pages.ts` in sync.** Any time you add, remove, or rename a slide folder, update *that
   presentation's* `pages.ts` (e.g. `src/routes/slides/pages.ts`) to match. A slide folder with no
   `pages.ts` entry is an orphan.
2. **Every slide folder needs both files** — `+page.svelte` *and* `+layout.js` (with the prerender +
   trailingSlash lines). Missing `+layout.js` breaks the static build.
3. **Colocate page assets.** Put a slide's images/media in *its own folder* and `import` them
   (`import img from './pic.png'`). Don't drop page-specific files in `static/`; `static/` is only for
   truly site-wide files (it currently holds just `.nojekyll`).
4. **Reference assets via `import`, not hardcoded paths.** Imported assets are bundled, hashed, and
   respect any base path — hardcoded `/foo.png` breaks under a subpath deploy.
5. **The presentation folder(s) under `src/routes/` are the source of truth** (`slides/` is the
   default one). There is no `example/` folder anymore; don't recreate one.
6. **Dev server runs only via booth — never host pnpm/Node.** When a live dev server is needed
   (user asks you to run it, or you must verify in the browser yourself), start it with
   **`./booth exec --run -- ./dev-run.sh`** (see *Quick start for agents*). Check `./booth list`
   first: if this project's booth already has Vite up, use that URL — do not start a second one,
   and **never** kill someone else's booth or their running dev. Vite is always container
   `:5173`; the host port is the booth's control port **+173** (stock `http://localhost:31173/…`,
   or `<port>+173` if you started it with `--port`). Confirm with `./booth list` and tell the user
   the full URL. Tests and static builds also go
   **only** through the booth (`./booth exec --run -- pnpm test`, `./booth exec --run -- pnpm build`
   / `./build-static.sh …`) — not host `pnpm`. **Worktrees work** (CodingBooth ≥ 0.63.0): run the
   same command from the worktree, no flags — it gets its own booth and its own ports automatically
   (see *Quick start*); read the URL off `./booth list`. Git does **not** work *inside*
   a worktree booth — `git` / `lazygit` / `gh` there report `fatal: not a git repository`, because
   the worktree's `.git` is a pointer into the main repo's `.git`, which the container doesn't
   mount. That is known and harmless: run git on the host, which is where you commit anyway. (Only
   the booth *startup* used to die on this; ≥ 0.63.0 no longer does.)
7. **Verify before declaring done.** Cover the change with a test (`tests/*.test.ts`, or
   `tests/*.ssr.test.ts` for prerender behavior) and/or have the user check the slide in dev. The
   build is static, so also sanity-check it isn't relying on any server feature.
8. **Never commit or push unless the user explicitly says so.** Leave your work in the working
   tree. Don't `git add`, `git commit`, or `git push` on your own initiative — "the change is done"
   is not permission to commit it. When the user asks for a commit message, use `/commit-msg`.
   **Exception — worktrees:** if this checkout is a git worktree, **do** create/switch to a
   feature branch early (Rule 0b / *Session = linked worktree + branch*) so the user can
   push and open a PR; still do not commit or push that branch unless asked. Creating the
   worktree itself is Rule 0b and does **not** require a separate commit request.

---

## Playbooks

> **Proposal before code (Rule 0) + worktree isolation (Rule 0b).** Match the request to a playbook,
> research as needed, then post **Problem · Diagnostic · Approach** (Approach names the checkout)
> and **wait** — do not start the numbered steps until the user green-lights. After green light,
> still create `worktree/<name>` before editing if you are on main (unless they opted out). When
> something is still ambiguous (where the blog lives, which slides to keep, etc.), put **1–2
> clarifying questions inside Diagnostic**, not instead of the three headings.

### "Start me from scratch — keep only a Title page and a Content page"

1. Confirm with the user (this deletes their slides). Offer to do it on a branch.
2. Delete every folder under `src/routes/slides/` **except** `+layout.svelte`, `+layout.js`,
   `+page.svelte` (the layout/index files) and `title.html/`.
3. Create one content slide: `src/routes/slides/content.html/` with a `+layout.js` (the standard two
   lines) and a `+page.svelte` using `ContentPage`.
4. Reset `src/routes/pages.ts` to just:
   ```ts
   export const pages = [
       { path: "title.html",   title: "Title" },
       { path: "content.html", title: "Content" },
   ];
   ```
5. Remove now-orphaned colocated assets from the deleted folders.
6. Ask the user to open both slides in their dev server and confirm they load and nav works.

### "Add a new slide"

1. `mkdir src/routes/slides/<name>.html/`.
2. Add `+layout.js` (`export const prerender = true; export const trailingSlash = "never";`).
3. Add `+page.svelte` — start from `ContentPage` or `TitlePage`.
4. Insert `{ path: "<name>.html", title: "<Title>" }` into `src/routes/pages.ts` at the right spot.
5. Verify at `/slides/<name>.html`.

### "Add a second presentation (a standalone one in the same project)"

Multi-presentation is wired up: navigation is scoped per presentation via Svelte context
(`$lib/presentation` — `setPages` / `getPages`). To add another presentation, mirror `slides/`:

1. Create `src/routes/<talk2>/` with:
   - `pages.ts` — its own `{ path, title }[]` list.
   - `+layout.svelte` — copy `slides/+layout.svelte` (it already does
     `import { pages } from './pages'` + `setPages(pages)` and adds the scaling / ToC / copyright).
   - `+page.svelte` — the index redirect (copy `slides/+page.svelte`; it's presentation-agnostic, it
     just redirects to `<currentpath>/title.html`).
   - `+layout.js` — the standard `prerender` + `trailingSlash` lines.
2. Add the slide folders (`<name>.html/` each with `+page.svelte` + `+layout.js`) and list them in
   *that* presentation's `pages.ts`.
3. Each presentation navigates within its own list automatically; links *between* presentations are plain `<a href>`s.
4. Verify both independently (`/slides/...` and `/<talk2>/...`).

> The templates read the list from context, so a presentation **must** call `setPages()` in its
> `+layout.svelte` — that's what copying `slides/+layout.svelte` gives you. Without it, that presentation's
> nav/ToC will simply be empty (it won't crash).

### "Add a YouTube link properly"

The `YouTube` component shows a thumbnail with a QR overlay that links to the video, using two
**colocated** images.

1. Make sure the slide folder exists (create it if needed).
2. Generate the assets directly into that folder (needs internet — it downloads the thumbnail):
   ```bash
   cd src/routes/slides/<name>.html
   ../../../../utils/prepare-youtube.sh https://youtu.be/<VIDEO_ID> . <basename>
   ```
   This writes `<basename>-TN.png` (thumbnail) and `<basename>-QR.png` (QR) next to the page.
3. In `+page.svelte`:
   ```svelte
   <script>
     import YouTube   from '$lib/components/YouTube.svelte';
     import thumbnail from './<basename>-TN.png';
     import qr        from './<basename>-QR.png';
   </script>
   <YouTube {thumbnail} {qr} alt="My talk" youtubeId="<VIDEO_ID>" width="600px" />
   ```
4. If there's no internet / the script fails, fall back to any thumbnail PNG the user provides + a QR
   PNG (the script uses `qrencode`).

### "Add animations"

Slides are Svelte components, so use Svelte's animation tools for *within-slide* motion (reveals,
build steps, emphasis):

- Reveal on click / build steps with `{#if}` + transitions:
  ```svelte
  <script>
    import { fade, fly } from 'svelte/transition';
    let step = 0;
  </script>
  <button on:click={() => step++}>Next</button>
  {#if step >= 1}<p transition:fade>First point</p>{/if}
  {#if step >= 2}<p in:fly={{ y: 20 }}>Second point</p>{/if}
  ```
- CSS `@keyframes` / `transition:` in a slide's `<style>` work too.
- The `Box` component is already a worked example of CSS-transition choreography.

For **scrubbed, timeline animation** — shapes drawing themselves in, elements flying —
use the Draw family (`$lib/draw`) with one `<AnimationBar />`: every shape's animation
is pure generated CSS, so it prerenders and the bar scrubs them together. A `<Sprite>`
is the flying HTML element. It takes either discrete keyframe `stops`, or — for a
smooth curve — a **`path`**: a literal shape (`path={{ kind: "cubic", from: […],
c1: […], c2: […], to: […] }}`) or **the name of a `Line`/`Curve`/`Arc` in the same
`<Draw>`** (`path="road"`), which it rides with LIVE shared geometry — author the
curve once, drag its handles in ADJUST and the flight re-routes with it. Extras:
`size` (the box riding centred on the path), `orient` (bank to the tangent; default),
`rotate` (glyph offset, e.g. 🚀 ≈ −45), `samples`, `delay` (hold the start pose N
seconds before flying — the sprite counterpart of a shape's `drawDelay`, for
staggering objects on one timeline), `ease` (whole-flight timing function,
default ease-in-out; `"linear"` makes position proportional to time, so staggered
objects hold formation while their windows overlap), and `lock` (hide a sprite
from ADJUST entirely — for generated stops). Flight samples are spaced by arc length
(constant speed), so a sprite riding a shape that also has `draw={same seconds}`
stays glued to the drawing stroke's pen tip. Worked timing example:
`sprite-delay.html` in the `animation/` deck (start late / finish early / both). Off-stage geometry is fine: points may lie
outside the canvas (ADJUST shows them; presentation clips at the slide edge, which is
what makes fly-ins work). See the `animation/` deck — `sprite-curve.html` is the
worked example.

**Worth telling the user:** slide-to-slide navigation is a **full page load**
(`NavigationBar` sets `window.location.href`), not client-side routing. Animations live *within* a
slide — and *cross-slide* transitions (animating one slide into the next) **do** work, via the
platform's cross-document **View Transitions API** (`@view-transition { navigation: auto; }`), which
is possible precisely *because* each slide is its own document. See the `transition/` deck for worked
examples (slide, flip, zoom, cross-fade, and shared-element `view-transition-name` morphs). No library,
no client-side router — just a slide-scoped `<style>` opting navigation transitions in.

### "Place an element visually (ADJUST mode)"

When a slide positions things at exact canvas pixels, you don't have to guess the
numbers. Wrap the element in a **`Block`** (or **`ImageBlock`** for a picture) and
turn on **ADJUST mode** to drag/resize it in the browser, then copy the resulting
tag — with its final `x`/`y`/`width`/`height` — back into the source by hand.

**ADJUST mode is an authoring aid, not a viewer feature.** It is on by default in
`pnpm dev`, where **SAVE** writes moved `Block`s straight back into the slide's
`.svelte` file. **In production it is OFF.** Three things can offer the control,
highest authority first:

1. **`pnpm dev`** — always, and nothing can take it away.
2. **`?adjust`** on any slide URL — the escape hatch on a built/deployed site;
   **`?adjust=off`** disables it again. (Both sticky per browser origin — see the
   Gotcha.) The speaker asked, so this outranks the content.
3. **`adjust: true` on the slide's `pages.ts` entry** — a *per-slide* opt-in, so a
   slide that TEACHES layout can offer the control in the build while the rest of the
   deck ships ADJUST-free. Set it on the slides whose prose says "flip ADJUST and drag
   this box" — the button must be there when the audience is told to look for it. On
   such a slide the button is rendered **featured**: a filled warm pill with a halo that
   pulses until it's used, and the slide's chrome is exempted from `fadeChrome` (which
   would otherwise hold it at `opacity: 0.12` until pointed at — worth knowing, because
   it defeats any amount of restyling). There the button is the subject, not backstage
   machinery. See `adjust-mode.html`, and `adjust` on `<SlideDeck>` for the rare deck
   that is entirely about authoring.

Offered is not active: the mode still starts **off**. Precedence lives in
`src/lib/layout/layoutAccessCore.ts` (pure, unit-tested).

**SAVE cannot follow ADJUST into a build.** It POSTs to `/__geekpresent/adjust-save`,
an endpoint that exists only inside the vite dev server; a static host has no source
tree to rewrite. The button is **not** greyed out there — it looks ordinary and
**refuses on click**: the label flips to `NOT ALLOWED` and a tooltip says *"Save not
allowed in this setup."* That ordering is the point. A button disabled from the start
invites the audience to assume the feature is missing or broken; a button that answers
when pressed teaches them saving is *forbidden here*, and why. **Copy** is the
write-back path that works everywhere.

**SAVE can also land only PARTLY, and says so.** The patcher never guesses (see
`layout/patchSource.ts`): a tag it cannot confidently place comes back as `unmatched`
rather than risking a rewrite of the wrong one. The button therefore has a fourth
outcome beside `SAVED` / `NONE` / `NOT ALLOWED` — it reports the tally, **`1 OF 2`**,
with a tooltip naming what didn't land. This matters more than it sounds: a partial
write that *claimed* `SAVED` would quietly lose the author's drag on the next reload,
with the only evidence in a `console.warn` nobody had reason to open.

There are two distinct causes, and the tooltip tells the one that actually happened
(each unmatched tag carries a `reason` from the patcher):

- **`not-found` — the tag isn't in the source in its literal form.** Draw shapes save
  by a literal old→new tag swap, so a tag whose geometry is *expressions*
  (`from={curve.from}` pointing at a shared const), or one reformatted across lines,
  has no bytes for the patcher to find. Nothing to rewrite — Copy it and paste by
  hand; one paste makes the tag canonical, after which SAVE lands.
- **`ambiguous` — a tag with a twin.** A slide that documents a component often
  shows the tag in a `<QuickCode>` sample living in the *same file*, and the patcher
  scans raw source — so a sample that spells out both `name` and `x/y/width/height` is
  indistinguishable from the real tag, and neither can be placed. **Elide the geometry
  in code samples** (`<Block name="api" …>`), the way every sample in this deck already
  does, and the ambiguity never arises.

1. In the slide's `+page.svelte`, wrap the element:
   ```svelte
   <script>
     import Block from '$lib/components/Block.svelte';
   </script>
   <Block name="logo" x={760} y={420} width={400} height={240}>
     <!-- your content -->
   </Block>
   ```
   For an image, use `ImageBlock` instead (the image fills the panel and reshapes
   with the box; aspect is locked by default, Alt to break it):
   ```svelte
   <ImageBlock src={photo} alt="…" x={760} y={560} width={320} height={320} />
   ```
2. Have the user open the slide in their dev server. The top-centre tool bar
   (`📌 │ PRESENT │ ANNOTATE │ ADJUST │ DISPLAY │ ☰`) now shows an **ADJUST** toggle — turn it on. A dashed
   outline appears around each `Block`.
3. **Drag** the body to move, **drag the bottom-right grip** to resize. Snap to a
   grid with the `grid` prop; hold **Alt** to break an aspect lock; **Esc** cancels
   the in-progress gesture. **Ctrl/Cmd+Z** undoes, **Ctrl/Cmd+Shift+Z** / **Ctrl+Y**
   redoes — globally across every `Block` on the page.
4. Click **Copy** on the block to put its current tag (with the live coordinates) on
   the clipboard, then **paste it over the original tag in the source**. `ImageBlock`
   emits a `src={…}` placeholder — keep your real `import`ed `src`.
5. Turn ADJUST off (or just leave dev) and verify the slide looks right.

> Key props (full list in the component headers): `x`/`y`/`width`/`height` (canvas
> px), `name` (label + snippet comment), `grid` (snap step), `aspect`
> (`true`/number/`false`), `bounds` (`'canvas'` clamps inside, `'none'` lets it
> bleed off-stage), `minSize`. Match `canvasWidth`/`canvasHeight` to the deck if it
> isn't the 1920×1080 default.

### "Let the speaker draw on the slide (ANNOTATE)"

The pen. A canvas-spanning ink surface the speaker arms mid-talk to circle a term,
underline a line of code or cross out the wrong branch — the thing they decide to point at
while answering a question. (`Spotlight` also points, but only at a `Block` the *author*
named in advance; see the diagram playbook.)

Nothing to place: `SlideDeck` mounts `<Annotate>` once, like `Spotlight`. One prop offers it.

```svelte
<SlideDeck {pages} annotate />
```

- **The flag is DECK-wide, and there is deliberately no per-slide `annotate:`** to match
  `adjust: true`. That is the one thing to understand here. ADJUST is an *authoring* aid, so
  the slide being authored has a real opinion about whether you should be dragging on it.
  The pen is a *speaker* tool — the slide you happen to be standing on when someone asks a
  question has no opinion about whether you may circle a word on it, and paging must not take
  the pen out of your hand mid-answer. So the precedence is ADJUST's **minus its slide tier**:
  `pnpm dev` > sticky `?annotate` / `?annotate=off` > the deck's `annotate` prop > off. It
  lives in `src/lib/annotate/annotateAccessCore.ts` (pure, unit-tested). Offered is not
  active — the mode still starts **off**.
- **Ink PERSISTS, per slide, across reloads** (`src/lib/stores/annotation.ts` → `inkBook`,
  keyed by full pathname). Mark a deck up while preparing and it is still marked up on stage.
  Two things follow. It can go **stale**, so a slide whose ink is older than `inkStaleAfter`
  (hours, default 24) says so on arrival and offers to clear it — today's marks never nag,
  last week's always do. And there must be a way out: **RESET** (this slide) / **RESET ALL**
  live on the pen's bar *and* in the presenter console under **✎**.
- **`localStorage` is the cross-window channel.** The ink book is a `persisted(sync: true)`
  store, so the audience window mirrors the speaker's strokes through the `storage` event
  with no relay to keep in step — and the console, which has no canvas of its own, can RESET
  by writing to the same store. Don't add a `publishInk`-style channel to `stores/presenter.ts`;
  there was one, and persisting the ink made it redundant.
- **The pen eats the POINTER, never the KEYBOARD.** ←/→/Space keep paging while armed. A
  speaker who cannot advance is worse off than one with a stray scribble. `Esc` puts the pen
  down *without* navigating, which is what makes it safe for `Esc` to exist here at all.
- **A highlighter is not a pen.** A swipe is *levelled* — pinned to the y you pressed at and
  reduced to its horizontal extent (`levelPoints`), so the band sits on the row you swiped
  instead of sloping with your wrist. Anchored, not averaged: a mean y shifts as samples
  arrive and the band slides around under the cursor mid-swipe. `levelHighlight={false}` opts
  out.
- **Anything clickable must out-rank the ink surface** (z-index 40). While armed it owns every
  pointer on the canvas — which is why the whole top-centre tool bar (the ANNOTATE toggle
  included) and the pen's own bar live *inside* `Annotate` at 42/41, above the surface. Put a
  control under the surface and the speaker can arm the pen but never put it down.

> Other props: `inkColors` (the swatches; `null` is the theme's own colour, so un-picked ink
> follows a re-theme instead of freezing a hex), `penWidth` / `highlighterWidth`. Colours and
> the bar's resting opacity are `--annot-*` role tokens. The bar drags by its `⠿` grip and
> remembers where it was put for as long as the pen stays armed — paging with ANNOTATE on
> keeps it there, since `annotationMode` is itself persisted — but closing the pen (or
> double-clicking the grip) resets it, so the next time it opens, here or on another slide,
> it starts back at its default spot rather than wherever a past session left it.
>
> Demo: `annotate-component.html` → `annotate-persistence.html` → `annotate-setup.html`.

### "Keep a chrome bar visible (PIN)"

The top tool bar (`SlideToolbar`) and bottom control bar (`ControlBar`) both **auto-hide** —
tucked to a peek strip at the window edge, sliding fully open on hover or keyboard focus so they
stay out of the audience's way. A speaker who is actively using one often wants *that* bar to
**stay** open rather than re-tuck every time the pointer leaves. **PIN** is that latch.

- **One pin per bar, independent.** The pushpin icon sits at the **front** of each bar. Pin the
  bottom pager open for a talk while leaving the top tools tucked (or the reverse). There is no
  deck-wide shared flag — `toolBarPinned` and `controlBarPinned` in `src/lib/stores/chromePin.ts`
  are separate `persisted` booleans (`sync: false`, same bargain as `displayMode` / `adjustMode`).
- **Default is auto-hide.** Offered is not active: a first visit still tucks. Click the pin to
  seat the bar fully open (`class="pinned"` forces `translateY(0)`); click again to return to
  auto-hide. The choice survives a slide change and a reload.
- **Opt-out of a whole bar.** `<SlideDeck toolBar={false}>` / `controlBar={false}` (default
  **on**) drop the top authoring cluster or the bottom TOC/pager for a bare canvas. Independent
  of PIN. Hidden either way under `?clean` / `?present`.
- **Alt+. (⌥. on macOS) raises both bars for keyboard.** Temporary arm (~5s, amber halo) — not
  a pin. While armed: **a** ANNOTATE, **j** ADJUST, **z** open DISPLAY zoom menu, **p** PRESENT,
  **m** ☰, **t** TOC. When the letter lives in the word it is underlined (`PRESENT`, `ANNOTATE`,
  `ADJUST`, Table of Contents); when it does not, a trailing chip remains (`FITTED (Z)`,
  `☰ (M)`). **z** opens (toggles) the zoom menu — ↑/↓ / Home/End walk the presets, **c** jumps
  to the CUSTOM % field, Enter applies, Esc closes — it does **not** flip FITTED/SCALED by itself.
  Esc also disarms chrome and closes ☰. Letter mnemonics do not fire while typing in a field.
  Pure core: `chrome/chromeArmCore.ts` + `chrome/sizeModeCore.ts`.
- **☰ menu groups.** Navigate (OVERVIEW **O**, KIOSK) · export (CAPTURE, PRINT with nested flyout
  **cCwWtT**) · source (SOURCE, EDIT). PRINT opens on hover to the left of the row.
- **Not the same as `fadeChrome`.** `fadeChrome` ghosts `.gp-chrome` opacity until pointed at;
  PIN is the tuck/untuck of the two window-edge bars. They compose: a pinned bar is fully seated
  even when fade would otherwise dim other chrome.
- **TOC height.** The bar-hosted Table of Contents flyout opens upward and is capped at roughly
  half the viewport (`min(42vh, calc(100vh - 10em))`) so a long deck scrolls inside the panel
  instead of covering the whole slide when the control bar is pinned open.

### "Save this slide as an image (CAPTURE)"

One prop, and a **CAPTURE** entry appears in the top-centre tool bar's **hamburger (☰) menu** —
hover the ☰ at the bar's right end for OVERVIEW / CAPTURE / PRINT / SOURCE / EDIT (grouped with
separators). It downloads the current slide as a PNG. (The bar itself is
`📌 │ PRESENT │ ANNOTATE │ ADJUST │ FITTED (Z) │ ☰ (M)`: pin and mode toggles sit in
the open (mnemonic letter underlined in-word when it fits; `(Z)` / `(M)` only when it does not);
navigation/output/source tools live behind the hamburger.) **PRINT** opens a nested
flyout on hover — Current slide / + notes, Whole deck / + notes, Thumbnail grid / Notes grid
(mnemonics **cCwWtT**). CAPTURE only appears when the deck offers it (`capture`); the whole bar is
hidden under `?clean` / `?present`.

```svelte
<SlideDeck {pages} capture captureScale={2} />
```

- **It re-renders the canvas; it does not screenshot the window.** That is the whole design.
  A slide has a TRUE size (1920×1080) and is merely *displayed* at whatever scale the window
  allows — so a screen grab yields 1147×645 of somebody's laptop, while re-rendering yields
  exactly the canvas, identical on every machine. `captureScale` multiplies the output and
  stays crisp, because it re-renders rather than upscales.
- **Ink in, chrome out — and the rule is one you already know.** The clone strips
  `.no-print` / `.gp-chrome` (`CHROME_SELECTOR`), which is the same marker that keeps the nav
  bar out of a printout. The pen's bar, toggle and stale prompt wear it; **`.annot-surface`
  does not**, so the annotations survive. That is deliberate: the speaker circled the thing,
  so the circle has to be in the PNG. If you add chrome anywhere, mark it `.no-print` and
  capture gets it right for free.
- **It refuses rather than lying.** An `<iframe>` (`WebSite` / `WebPage` / `YouTube`) is a
  separate document whose pixels we may not read — the same-origin policy working, not a gap
  to patch. So CAPTURE answers **NOT ALLOWED** on click and names the embed, exactly as SAVE
  does. `<canvas>` and `<video>` *look* like the same problem and are not: their pixels are
  readable, so each is snapshotted into an `<img>` and lands in the file.
- **The trap, if you ever touch `capture/captureSlide.ts`:** the SVG we rasterise through is a
  `data:` URL, i.e. **a separate document**. It cannot see this page's stylesheets, fonts or
  images, and anything not physically carried into it is absent — *silently*. A missing font
  does not throw; the text renders in Times New Roman and the layout shifts. So every
  stylesheet is inlined, every `@font-face` payload is fetched to a `data:` URI, and every
  `<img>`'s bytes are embedded (which also stops a cross-origin logo from tainting the canvas
  and killing `toBlob`).
- **And the trap that actually bit:** that inlined CSS is embedded in **XML**, not HTML. The
  deck's compiled CSS carries `@import url("…?family=Amatic+SC:wght@400;700&display=swap")`,
  and a bare `&` opens an entity reference in XML — so the document was malformed, and a
  malformed SVG is not partly drawn, it is rejected *whole*, with an `onerror` that explains
  nothing. `xmlSafeCss()` escapes `&`/`<` and **drops `@import` outright** (an SVG rendered as
  an image may not fetch external resources anyway; the imported sheet's *contents* are pulled
  in separately, since `@import`ed sheets never appear in `document.styleSheets` — they hang
  off their parent as nested `CSSImportRule`s). `tests/captureCore.test.ts` parses the result
  through `DOMParser` as `image/svg+xml` and asserts no `<parsererror>`, which is exactly the
  check the browser was failing.

> Access follows ANNOTATE's precedence (`capture/captureCore.ts`): `pnpm dev` > sticky
> `?capture` / `?capture=off` > the deck's `capture` prop > off. A screenshot is the
> speaker's decision; the slide has no opinion. Demo: `capture-slide.html`.

### "Run this deck unattended (KIOSK / auto-advance)"

A booth screen, lobby loop, or demo that pages itself. Offered like CAPTURE (deck prop /
sticky `?kiosk` / always in `pnpm dev`); **running** is a separate session.

```svelte
<SlideDeck {pages} kiosk kioskStepMs={2000} kioskPageMs={6000} />
```

- **Enter:** ☰ → **KIOSK** opens a dialog (step pace, page pace, optional speaker notes) →
  **Start**. Or open any slide with **`?kiosk`** to auto-start with current paces (unattended
  link). **`?kiosk=off`** stops and revokes the sticky offer.
- **Advance order (Space semantics, not →):** wait for finite CSS animations → reveal any
  `<Steps>` / `activeSteps` build → if notes are on, one `<Note>` **child line at a time** →
  page (and **loop** to the first visible slide at the end). Step dwell is faster than page;
  a long note line holds at least a ~150 wpm read (`noteItemDwellMs`).
- **One floating panel** (`KioskIndicator`): title bar is the transport (grip, pause ring,
  phase, note **n/N**, ⚙ settings, × stop); body is the current note when notes are on.
  Drag by the title bar; the body scrolls. Without notes the panel collapses to a compact pill.
- **Exit is explicit only** — Pause / Stop / settings. Keys and pointer on the slide do not
  break out (a booth must not stop because someone brushed the glass).
- **Pure core:** `src/lib/kiosk/kioskCore.ts`. Session: `stores/kiosk.ts`. Runner:
  `KioskRunner.svelte`. Note lines publish from `<Note>` while kiosk + show-notes is on
  (source node stays visually hidden; the panel is window-fixed so it is not trapped under the
  canvas `transform`).

**Every slide to a PNG, offline** — `utils/capture-slides.sh` (for OG/social images, thumbnails,
a contact sheet). It drives a real headless Chrome, so unlike the in-app button it captures
**everything** — iframes, video, Monaco — because the browser's own rasteriser does the drawing.

```bash
pnpm build && utils/capture-slides.sh            # → captures/slides/*.png
utils/capture-slides.sh --deck portrait --size 1080x1920
```

- **`?shot` is the whole trick.** A URL flag that tells `SlideDeck` to render the canvas at
  exactly 1:1 — no frame border, no letterbox, no chrome (it implies `?clean`) — and to skip
  `adjustSize` entirely. Size the browser window to the canvas and the **viewport IS the
  slide**, so the PNG needs no cropping and no rescaling. It is the one mode that deliberately
  does NOT fit the slide to the window: fitting is what a human wants and exactly what a
  screenshot must not do.
- **It strips the same `.no-print` / `.gp-chrome` as the in-app CAPTURE**, on purpose — if the
  two paths disagreed about what a slide *is*, the PNG from the button and the PNG from the
  build would differ and nobody would know which was right. (The selector is repeated in
  `SlideDeck`'s `.container.shot` CSS; keep it in step with `CHROME_SELECTOR`.)
- **Slides are mounted on hydration, so a screenshot taken too early is a valid, correctly
  sized, entirely BLANK frame.** This is the trap, and it is nasty because it is *silent* — a
  blank slide still yields a plausible ~10KB PNG, and a blank OG image is the sort of thing
  nobody notices until it is on someone else's timeline. Three defences, all needed:
  `--run-all-compositor-stages-before-draw`, a generous `--virtual-time-budget`, and — the one
  that actually saves you — **shoot, check the size, and shoot again**. No single budget is
  right for every machine: what works idle loses when 65 Chromes run back to back, so the
  script verifies rather than guesses, and exits non-zero if a slide never comes out.
- **Serve over http, never `file://`.** SvelteKit's client is an ES module and `file://` blocks
  module scripts, so the deck never hydrates and *every* PNG is blank. This exact symptom was
  once written off as "the deck doesn't render headless". It renders fine; it just needs an
  origin.

**Social cards — `--og`.** Every slide's OG/Twitter card *is that slide*, instead of the site's
one default card. **CI already does this** — you rarely run it by hand.

```bash
pnpm build && utils/capture-slides.sh --og && pnpm build
```

- **The two builds are forced, not wasteful.** The cards are screenshots OF the built deck, and
  each slide's `og:image` is baked into its PRERENDERED HTML. So: build to have something to
  photograph → photograph → build again so the tags and the PNGs are in the output. There is no
  single-pass version. `.github/workflows/deploy-pages.yml` runs exactly this.
- Captures into `static/og/<deck>/` — `static/` is what the build copies to the site root, so
  `static/og/slides/title.png` is served at `/og/slides/title.png`, exactly the site-relative
  form `seo/config.resolveImage` turns into an absolute URL.
- **`/static/og/` is GITIGNORED and regenerated in CI.** The PNGs are build output, not source:
  derived from the slides, and stale the moment a slide changes. Nothing OG-related needs
  committing — CI wires `pages.ts` in its own ephemeral workspace, so a slide added since the
  last run gets a card automatically and there is no wiring to forget. (Commit the `pages.ts`
  edit only if you want it visible in the repo; re-running is idempotent either way.)
- **At FULL canvas resolution.** An earlier version shrank these to ~1200px wide to keep the
  repo small — a reason that evaporated once they were gitignored. Shrinking buys nothing else:
  the aspect ratio is identical either way (so a card crops on a timeline the same), the
  platforms accept far larger, and a smaller file is just blurrier on a high-DPI screen. Use
  `--scale 0.625` if you want them small anyway — via `--force-device-scale-factor`, so the
  canvas keeps laying out at its true CSS px and nothing reflows. Shrinking the *window* would
  CROP rather than scale, because `?shot` is 1:1 by design.
- The `image:` field is **edited into `pages.ts`** (`utils/wire-og.mjs`, tested in
  `tests/wireOg.test.ts`) rather than derived at runtime, because `image` is a field the AUTHOR
  owns. The rules that make that safe: **it never overwrites an `image` an author set by hand**,
  it invents no URL for a PNG that does not exist, it is idempotent, and anything it cannot
  confidently place it *leaves alone and reports* — the same bargain `patchSource.ts` makes for
  ADJUST's SAVE. `--no-wire` writes the PNGs only.
- It **refuses to wire when a slide failed to capture**, and the script exits non-zero so the
  deploy fails with it: a card pointing at a blank PNG is worse than no card at all, and the
  failure is silent (a blank slide still yields a perfectly plausible PNG).

### "Draw a diagram / connect these boxes with arrows"

Don't compute arrow coordinates. Give each box a **`name`** and let **`Connector`** route
between them — then a ADJUST-mode drag moves the box *and* its arrows together.

```svelte
<Block name="api" x={200} y={400} width={280} height={140}>API</Block>
<Block name="db"  x={900} y={400} width={280} height={140}>DB</Block>

<!-- AFTER the Blocks — see the ordering rule below -->
<Connector from="api" to="db" label="query" />
<Connector from="db" to="api" route="curve" fromSide="bottom" toSide="bottom" dash />
```

- **Connectors must come after the Blocks they link.** Names resolve during prerendering,
  and Blocks register in document order — a connector placed first ships an empty diagram.
  An unknown name renders nothing (never a broken arrow), so a missing arrow means either
  a typo in the name or a connector that jumped the queue.
- `route`: `straight` (default), `ortho` (right angles, `radius` rounds the corners), or
  `curve`. Sides auto-pick; override with `fromSide` / `toSide` (`top`/`right`/`bottom`/`left`).
- Either end also takes a raw canvas point (`from={[300, 540]}`) or a literal
  `{ x, y, width, height }` box, for pointing at something that isn't a `Block`.
- `label` is the **visible** text on the shaft (`labelAt` 0–1 along it, `labelOffset` px
  off it); `ariaLabel` is the accessible name, defaulting to `"<from> to <to>"`.
- To build a diagram up arrow by arrow, stagger `drawDelay` across the connectors — they
  share one `AnimationBar` timeline, exactly like the `Draw` shapes' `draw`/`drawDelay`.
- Styling rides the `--draw-*` custom properties (`--draw-stroke`, `--draw-thickness`,
  `--draw-font-size`); `color` / `thickness` / `dash` override per connector.
- Hand-placed shapes and connectors mix: a `Connector` *inside* a `<Draw>` renders into
  that surface's `<svg>` instead of opening its own. Standalone, it is a canvas-spanning
  overlay with `pointer-events: none`, so it never eats a click.

See `src/routes/slides/connector-component.html/` for a five-arrow, zero-coordinate diagram.

### "Host this alongside my existing blog / GitHub Pages site"

This needs facts before code — **ask first**:
- Where does the blog live? Same repo, or a separate repo / `username.github.io`?
- What URL should the presentation sit at? (e.g. `myblog.com/talks/`)

Key levers:
- **Subpath hosting** → set `kit.paths.base` in `svelte.config.js` (e.g. `base: '/talks'`). Because all
  assets here are `import`ed (not hardcoded), they'll pick up the base automatically.
- **Output location** → the build currently writes to `../docs/` and `pnpm deploy` publishes that with
  `gh-pages`. To live beside a blog, either publish into a subfolder of the blog's published output, or
  keep a separate Pages deployment (see next playbook). Coordinate so the presentation doesn't overwrite the
  blog's `index.html`.
- One repo can only have **one** GitHub Pages site. If the blog already occupies this repo's Pages,
  the presentation must go in a *subfolder of the same build* or a *different repo*.

### "Set up a GitHub Action to deploy to GitHub Pages"

Replace the manual `pnpm deploy` with CI. Add `.github/workflows/deploy.yml` that installs pnpm,
builds, and publishes the build output. Two common shapes — pick based on their answer above:
- **Official Pages flow**: `actions/configure-pages` → upload `../docs` as the artifact →
  `actions/deploy-pages`.
- **Branch push**: `peaceiris/actions-gh-pages` pushing `../docs` to the `gh-pages` branch.

Always confirm: the build output dir (`../docs`), the Node/pnpm versions, whether a base path is
needed, and that this won't clobber an existing Pages deployment in the same repo (only one allowed).

### "Change the theme (colors / fonts / background / favicon)"

Theming is **per presentation** — edit that presentation's own `+layout.svelte`. The `slides/` and `demo/`
presentations are themed independently; **`demo/+layout.svelte` is a worked example** of all of the below:

- **Colours / font** — the `.container` / `.content` rules (`color`, `background`, `font-family`).
- **Custom web font** — add a `<link>` in `<svelte:head>` and use it in `font-family`.
- **Background image** — colocate an image in the presentation folder and reference it from the layout CSS as
  `background: url('./bg.png') center / cover` (Vite resolves the relative `url()`).
- **Favicon** — colocate a `favicon.png`, `import` it, and set it with
  `<svelte:head><link rel="icon" href={favicon} /></svelte:head>`.
- **Canvas size** — set per deck via the `width` / `height` props passed to `SlideDeck` in the
  deck's `+layout.svelte` (default **1920×1080**; portrait decks pass `1080×1920`). SlideDeck derives
  `aspectRatio` and all the scaling from them.

Shared base styles are in `src/lib/styles/`. (Note: `src/app.html` still points at a non-existent
`static/favicon.png` as the global default — a per-presentation `<svelte:head>` icon overrides it.)

### "Remember something across a reload (state)"

Three places, and they are not interchangeable: the **URL** (shareable — the only one you can read
aloud to an audience), **`localStorage`** (private to one browser), and a **store** (fast, forgets on
reload). The worked example is the `state-demo.html` slide, which is itself stateful.

- **Persist a value** — `persisted(key, initial, { codec })` from `$lib/stores/persisted`. Do **not**
  hand-roll `localStorage` in a store: the factory already does the `browser` guard, the
  garbage-tolerant parse, the `try/catch` around `setItem` (it **throws** in private mode and on a
  full quota) and the `storage` listener that keeps the presenter window in sync.
- **Read a query param** — `readTextParam` / `readNumberParam` from `$lib/utils/stateCore`, never
  `location.search`. The house form is `$: v = browser && readTextParam($page.url.searchParams, 'name', '')`.
- **Parse anything from outside** — a stored string and a URL param are **untrusted input**: another
  tab, an older deck, a hand-typed URL. `stateCore` is pure and total, so junk yields a usable value
  and never `NaN`. (`parseInt('12px')` is `12` — which is why it uses `Number()` and demands finite.)

**The SSR boundary is the part that bites**, and it fails the *build*, not the runtime: during
prerender there is no `window` and no `localStorage`. Guard every reach for either with `browser`.
The prerendered HTML therefore shows the **default** — correct, since it is built once and served to
everyone — and the remembered value arrives on hydration, one tick after paint.

**Pick the codec, don't write the parse.** `$lib/utils/stateCore` ships `numberCodec(bounds?)`,
`textCodec()`, `booleanCodec()` and `jsonCodec<T>()`. Reach for `booleanCodec` and **not**
`jsonCodec<boolean>` for a flag: `JSON.parse('{"x":1}')` returns a truthy *object*, so a corrupt key
would arm a flag nobody set — a flag has to fail closed. A codec's `read` returns `null` for "this
string is not mine", which is deliberately distinct from a falsy value that *is* mine; conflating the
two is how a persisted `0` or `false` springs back to its default on reload.

**Cross-tab sync is a decision, not a default you inherit.** `persisted()` mirrors other tabs unless
you pass `sync: false`. The presenter console is a second window onto the *same deck*, so sync means
the speaker zooming in to inspect a slide also zooms the **audience's** screen. `displayMode`,
`layoutMode` and `diagramScroll` all opt out for exactly that reason; a genuinely shared value wants
it on. Choose per store.

> "Shared" rarely means *every* tab, though — and the current slide is the cautionary tale. It rides
> its own hand-rolled relay (`stores/presenter.ts`, not `persisted()`), and that relay was a plain
> broadcast: every window of a deck both announced and followed, so two ordinary tabs of one deck
> lock-stepped each other. `deckKey` answered "which deck?"; nothing answered "who may drive whom?".
> It now travels with the sender's ROLE and is followed only when that role differs from your own
> (`utils/relayCore.ts`) — console ↔ audience move together, audience ↔ audience do not. Before you
> sync a value across windows, decide which *pairs* of windows it is for, not just which store.

`displayMode.ts`, `layoutMode.ts` and `diagramScroll.ts` are the worked examples — all three now sit
on the factory. `displayMode` is the one to read if you need to migrate a *legacy* key: its old
`scaleMode` boolean is honoured as the store's **initial value** rather than inside its codec, since
a `Codec` only ever sees its own key's string, and "what should this deck believe when it has no
opinion of its own stored?" is precisely what an initial value answers.

### "Add a reusable component"

Add it to `src/lib/components/`, import with `$lib/components/<Name>.svelte`. Follow the existing
componentization style. If it wraps Monaco (`Code`/`JavaCode`), remember Monaco loads from a CDN.

**Give it `style`, `id` and `class`** — every author-facing component takes all three, and a new one
that doesn't will look broken the first time a slide reaches for one (a Svelte component forwards
*nothing* it hasn't declared, so the attribute is silently dropped — it doesn't error, it just
vanishes). The convention, on the component's root element:

```svelte
<script lang="ts">
	/** Inline style for the root element, applied last so it wins. */
	export let style: string = '';
	/** DOM id for the root element. */
	export let id: string = '';
	/** Extra class(es) for the root element. */
	let klass: string = '';
	export { klass as class };   // `class` is a reserved word, hence the rename
</script>

<div class="thing {klass}" id={id || undefined} style="width: {width}px; {style}">
```

- **`style` goes LAST** in the style attribute. That is the whole point: a plain declaration on the
  element outranks any class selector, so the author's `style` beats the component's own rules
  without an `!important` anywhere.
- **`id={id || undefined}`** so an unset id emits no attribute at all.
- **`class` has a catch worth knowing.** A slide's own `<style>` is *scoped*, so a class you define
  there will **not** match an element inside a child component — Svelte hashes the selector, and the
  child's element doesn't carry the hash (you'll get an "unused CSS selector" warning). `class` is
  for **global** CSS (`global.css`, `roles.css`, a `:global(...)` block) or as a hook for scripts and
  tests. For one-off visual tweaks from a slide, reach for `style`, which has no such catch.
- **On a draggable, the props own the geometry — `style` does not.** The one exception to "style wins".
  A `Block` (and Draw's `Rect`/`Ellipse`) writes its own box, so `left`, `top`, `width`, `height`,
  `inset*` and `position` are **reserved**: a declaration for one of them in `style` is *stripped*
  before the style is applied. Otherwise it would land in the same declaration block as the box's own
  geometry, where the last declaration simply wins — and `style="left: 40px"` would cancel `x={200}`
  outright, leaving ADJUST dragging a box that cannot move. `style` is for **cosmetics** (stroke, dash,
  colour, a decorative `rotate()`); those still pass through and still win, untouched. Reserving
  changes what *renders*, never what you *wrote*: your source `style` is echoed back verbatim by
  Copy/Save, and ADJUST-mode chrome badges the dead declaration so you know to delete it. The rule
  lives in `src/lib/layout/styleGuardCore.ts` (pure, unit-tested); a new draggable reuses `guardStyle()`
  rather than re-deriving the list.

---

## Gotchas

- **Monaco needs internet.** `Code` / `JavaCode` / `CodeBox` / `JavaCodeBox` load the editor from a
  CDN at runtime. Note this whenever you use them.
- **SEO metadata is automatic; absolute URLs need a base URL.** `SlideDeck` and `TextPage` already
  render the `Seo` component, so every slide/text gets `<title>`, `description`, OpenGraph/Twitter
  cards, and `canonical` in its prerendered HTML. Set per-deck defaults with the `description` /
  `image` props in a deck's `+layout.svelte`, and per-slide overrides via `description` / `image`
  in `pages.ts`. The absolute-only tags (`og:url`, `og:image`, `twitter:image`, `canonical`) and the
  emitted `sitemap.xml` / `robots.txt` are built from `GEEKPRESENT_SITE_URL` (default: the GitHub
  Pages URL; set it empty to omit those tags). Keep in-page **assets relative** — only metadata URLs
  are absolute. The base URL is injected via Vite `define` (see `vite.config.ts` → `$lib/seo/config.ts`).
  When you add a presentation, its slides are picked up by the sitemap automatically (it reads every
  `pages.ts`); a brand-new standalone Text route must be added to `TEXT_ROUTES` in
  `src/lib/seo/routes.ts`.
- **`name` ending in `.html` is intentional.** Route folders are literally `title.html/`, so the URL is
  `/slides/title.html`. Don't "fix" it.
- **`.note` is a RESERVED class name — do not use it on a slide.** `src/lib/styles/note.css` is
  **global** (it styles speaker `Note`s), and it reaches into *any* element classed `.note` with
  `.note *:nth-child(even) { background-color: #e8e8e8 }`. So an innocent
  `<p class="note">Press <b>+</b>, then <b>reload</b>.</p>` on a dark slide silently paints a light-grey
  box behind the **second** `<b>` — and only the second, which is what makes it so confusing to
  diagnose. Svelte's scoped styles do **not** protect you: scoping adds a hash class, it does not stop
  a global selector from matching the class you wrote. Pick any other name (`.cue`, `.caption`); the
  `state-demo.html` slide uses `.cue` for exactly this reason.
- **ADJUST mode's `?adjust` opt-in is sticky and global, not per-deck.** Once `?adjust`
  is seen on a built site, it's saved to `localStorage` and the ADJUST control then
  shows on **every deck on that origin** until `?adjust=off`; the on/off toggle state
  is one global flag too. So "I enabled it on one slide and now it's everywhere" is
  expected, not a bug. The flag isn't stripped from the URL, so a shared `?adjust`
  link also enables it for the recipient (harmless — nothing is ever saved). In
  `pnpm dev` it's always available regardless. See `src/lib/stores/layoutMode.ts`.
- **No `pnpm install` purge in CI sandboxes.** If `pnpm install` wants to wipe `node_modules`, prefer
  `pnpm install --lockfile-only` to just sync the lockfile.
- **Static only.** If a user asks for anything server-side (auth, a database, form handling), explain
  it can't run on GitHub Pages as-is, and offer the client-side alternative (`fetch` an external API
  from the browser) or a hosting change.
