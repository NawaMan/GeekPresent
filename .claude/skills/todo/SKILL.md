---
name: todo
description: Add an item to this project's TODO.md, in the house style. Use when the user says "add to TODO", "/todo <thing>", "note this for later", or otherwise wants an idea recorded rather than built. Records only — never implements.
---

# Add a TODO item

`$ARGUMENTS` is the thing to record. Write it into **`TODO.md` at the repo root**. Record only:
no source edits, no marking anything `[x]`.

## 1. Check it isn't already done

`TODO.md` is 1300+ lines and mostly *completed* entries — and it lags the code. Before writing:

```bash
grep -n "^## \|^- \[ \] \*\*" TODO.md     # sections + open items, one screen
grep -rn "<keyword>" TODO.md src/lib      # is it already built, or already listed?
```

If it exists, **update that entry instead of adding a duplicate**. If it's already built, say so and
stop. If it's *partly* built, say which half is missing and write only that (e.g. ADJUST's `?adjust`
flag already works in a build; only the default-on half was open).

## 2. Place it

Pick the section by kind, not by excitement: **Tier 1** (closes a clear gap) · **Tier 2** (polish) ·
**Tier 3** (nice to have) · **Authoring / ADJUST mode** · **Adoption / distribution** ·
**Chrome & legibility** · **Page templates**. Put new items next to related ones.

## 3. Write it in the house shape

```markdown
- [ ] **Name** — one-line summary of what it is.
  - Why it's worth doing / the use case it unblocks.
  - Approach: name the real mechanism it would reuse.
  - Open questions: what must be decided before line one.
```

Keep the approach **grounded in this repo**, not generic: geometry goes in a pure, NaN-safe `*Core`
module (`draw/drawCore.ts`, `connectorCore.ts`, `spotlightCore.ts`); anything pointing *at* a
component resolves through `stores/blockAnchors.ts` (as `Connector` and `Spotlight` do); reveals are
opt-in and SSR-inert; colours/metrics are `--thing-*` role tokens in `src/lib/themes/roles.css`;
**no new dependencies**; done = component + a demo slide that *is* the docs + a DOM test + an SSR
test. A proposal reading "pull in library Y" is the wrong proposal.

## 4. Record decisions with their reason

When the user settles a question (a label, a name, a tradeoff), write **the decision and why**, plus
what it costs. That's what stops it being re-litigated later, and it's the part a bare checkbox loses.

Prefer the user's own framing; if you think it's wrong, say so once and defer. Then confirm what you
wrote in a sentence or two — don't paste the entry back.
