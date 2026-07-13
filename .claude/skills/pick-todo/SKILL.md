---
name: pick-todo
description: Study the project and TODO.md, propose a few open features worth building next — each with a one-sentence approach — let the user choose, then build the one they pick. Use when the user asks "what should I work on / build next", "pick a feature", "what's next in the TODO", or otherwise wants options rather than a specific task.
---

# Pick a feature to implement

Propose a short menu of open `TODO.md` features, each with a credible one-sentence approach, let the
user pick, and then **build the one they picked** — all in this one invocation.

**The menu comes first, and nothing precedes it.** Until the user has chosen, do not edit source, do
not scaffold, do not mark anything `[x]` — even if one candidate looks trivial and even if you are
confident which one they will take. Research and read all you like; just don't write. The point of
the skill is that the user chooses what gets built, so choosing must come before building.

Once they choose, the ambiguity is gone: go implement it. Don't stop to ask for confirmation, don't
hand back a plan, don't wait for a fresh request.

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
landed since, and the entry may understate what exists (e.g. LAYOUT's `?layout` flag already works in
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
  LAYOUT-mode drags. Anything that points *at* a component reuses this rather than reading the DOM.
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
make that the question instead — deciding it is more valuable than a vague yes.

## 5. Build the pick

The answer to that question is the go-ahead. Implement the chosen item now, in this same turn, to the
definition of done in step 3 — component, demo slide, DOM test, SSR test — following the approach you
pitched. If the pitch named a default for an open design question, that default is what the user
agreed to; build it that way rather than re-opening the question.

Two things the menu phase deliberately withheld, now due:
- **Check the box.** Mark the item `[x]` in `TODO.md` and rewrite its entry into the house style of a
  completed entry — a `Done:` bullet naming the files that landed — the way every other finished item
  reads.
- **Verify.** Build and run the tests; a feature is not done because the diff exists.

If the user picked *Other* and typed something outside the menu, that is still a pick — build it,
scouting further first if the item was one you had not researched.
