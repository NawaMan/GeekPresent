---
name: pick-todo
description: Study the project and TODO.md, propose a few open features worth building next — each with a one-sentence approach — let the user choose, then build the one they pick. Use when the user asks "what should I work on / build next", "pick a feature", "what's next in the TODO", or otherwise wants options rather than a specific task.
---

# Pick a feature to implement

Propose a short menu of open `TODO.md` features, each with a credible one-sentence approach, let the
user pick, **discuss the pick** (full Proposal before code), then build — never jump from a menu
click straight into edits.

**Two gates, in order — both wait for the user:**

1. **Menu** — until the user has chosen, do not edit source, scaffold, or mark anything `[x]`.
   Research and read all you like; just don't write. Each candidate gets a grounded one-sentence
   approach (not a design doc — the menu is a shortlist, not the plan).
2. **Proposal before code** (see `AGENTS.md` / Rule 0; **Rule 0b** — feature work in a linked worktree, not on main) — a menu pitch is **not** detailed enough
   to build from. After the pick, re-research the chosen item against the real code, then post
   **Problem · Diagnostic · Approach** (a few sentences each) and **wait**. The TODO line and the
   one-sentence pitch often lag the tree or hide open questions; discussion is the rule, not the
   exception. Do **not** treat the pick as a blank check to implement.

Only after the user green-lights that proposal do you enter step 6 (build).

## 1. Orient (skip what you already know)

`TODO.md` is long (1000+ lines) and mostly *completed* entries with detailed writeups. Don't read it
top to bottom — the open items are the `- [ ]` boxes:

```bash
grep -n "^## \|^- \[ \] \*\*" TODO.md
```

That gives every section header and every open item's title in one screen. Read the full body of only
the handful you're actually considering.

For project conventions, `AGENTS.md` is the operator's manual (start there if unfamiliar); `README.md`
is the user-facing overview. Skim, don't recite.

Delegate the scouting to an `Explore` agent when the shortlist needs code context — "does X already
exist, and what would it reuse?" is exactly the question that agent answers well, and it keeps file
dumps out of the conversation.

## 2. Shortlist

Pick **3–4** open items. Aim for a spread the user can actually choose *between* — vary the size and
the kind of work (a component, an authoring affordance, an infra/docs gap), rather than four
variations of the same thing.

Prefer items that are:
- **Ready** — no unanswered design question blocking the first line of code. Several entries carry an
  explicit "Open questions" bullet; if a question must be settled before anyone can start, either
  drop the item or surface the question *as the choice* the user is making.
- **Self-contained** — one component plus its demo and tests, not a refactor spanning the deck shell.
- **Unblocked** — an item whose entry says it depends on another open item goes after that one, not
  before it.

Actively check whether a candidate is **already partly built**. Several TODO entries predate work that
landed since, and the entry may understate what exists (e.g. ADJUST's `?adjust` flag already works in
production; the TODO for it only needs the *default-on* half). Verify against the code before you
pitch — a proposal that misdescribes the starting point wastes the user's pick. If you find this,
say so: "half of this already exists; the remaining work is X."

## 3. Ground each approach in how this repo actually builds things

The one-sentence approach must name the real mechanism it would reuse, not generic advice. The house
patterns worth pointing at:

- **Geometry lives in a pure core module.** `draw/drawCore.ts`, `draw/connectorCore.ts`,
  `draw/spotlightCore.ts` — pure, total, NaN-safe: garbage input yields a drawable result, never
  `NaNpx`. New geometry follows suit and gets unit tests directly against the core.
- **Named `Block`s are the anchor system.** `stores/blockAnchors.ts` publishes each named Block's live
  box; `Connector` and `Spotlight` both resolve against it, which is why they track boxes through
  ADJUST-mode drags. Anything that points *at* a component reuses this rather than reading the DOM.
- **Reveals/animations are opt-in and SSR-inert.** They render nothing at prerender and light up on
  the client; `Canvas` and the chart `animate` prop ride the `AnimationBar`'s CSS-keyframe clock.
- **Colours and metrics are role tokens** in `src/lib/themes/roles.css`. A new visual gets `--thing-*`
  tokens whose `var()` fallbacks are the main deck's actual (dark) theme — the fallbacks *are* the
  theme, since the `slides` deck sets no theme class.
- **No new dependencies.** Charts and diagrams are own-math Svelte, deliberately. A proposal whose
  approach is "pull in library Y" is the wrong proposal.
- **The definition of done** is component + a demo slide that *is* the documentation + a DOM test +
  an SSR test (`tests/*.ssr.test.ts`, since built deck HTML never contains slide markup, so prerender
  has to be proven through `svelte/server`). Mention what the demo would show.

## 4. Present the menu

Write the shortlist as prose the user can skim — for each: **the feature**, one sentence of *why it's
worth doing now*, and one sentence of *how you'd approach it* naming the mechanism it reuses. Add a
rough size (an afternoon / a day / multi-session). Keep the whole thing short; this is a menu, not a
design doc.

Then call `AskUserQuestion` with the candidates as options so the pick is one click, and include the
size in each option's description. If a candidate's real choice is a *design question* (per step 2),
make that the question instead — deciding it is more valuable than a vague yes. Add a second, short
question in the same call: **isolated worktree** (new branch, own booth/ports — see `AGENTS.md`'s
"Session = linked worktree + branch"), or build directly here? **Default to worktree** unless the
user is already inside one, or they explicitly want the main clone ("here", "on main", "no
worktree"). Feature work on this project is isolated by default; main is the opt-out.

## 5. Discuss the pick (Proposal before code — wait)

A pick is only "which feature", not "how". Re-read the TODO entry and the code it will touch, then
post the full **Problem · Diagnostic · Approach** form from `AGENTS.md` Rule 0 (and Rule 0b for isolation) — not the menu's
one-liners recycled. Approach **must** name the checkout (worktree default, or main if they opted
out). Surface open questions, what already exists, and deliberate non-goals. **Stop and wait** for
agreement (or a revised approach). Do not create a worktree, edit source, or mark `TODO.md` until
that green light. Green light still means **create the worktree first** when isolation was chosen
(Rule 0b) — it is not permission to edit main.

If the user picked *Other* and typed something outside the menu, that is still only a pick — scout
it, then the same Problem · Diagnostic · Approach wait applies.

## 6. Build the pick

Only after step 5 is green-lit. Before the first edit, if a worktree was chosen (the default),
**set it up first and make sure a branch is created with it** —
`git worktree add worktree/<name> -b <name>` from the main clone (per `AGENTS.md`) does both in one
call; a worktree without a matching branch is a mistake, not a shortcut. Then do the rest of this
step from inside it.

Implement the agreed approach to the definition of done in step 3 — component, demo slide, DOM
test, SSR test. Defaults the user accepted in step 5 are binding; do not re-open settled questions
mid-build without re-proposing the delta.

Two things the menu/discuss phases withheld, now due:
- **Check the box.** Mark the item `[x]` in `TODO.md` and rewrite its entry into the house style of a
  completed entry — a `Done:` bullet naming the files that landed — the way every other finished item
  reads.
- **Verify.** Build and run the tests; a feature is not done because the diff exists.
