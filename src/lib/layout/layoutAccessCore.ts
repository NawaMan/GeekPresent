/*
  LAYOUT access — the pure decision layer behind the authoring stores (see
  stores/layoutMode.ts). Three inputs decide whether a slide offers the LAYOUT
  control, and they disagree often enough (a dev server, a sticky `?layout` a
  speaker typed three slides ago, a deck that ships the control on purpose) that
  the precedence deserves to be stated once, in one readable place, rather than
  inferred from a chain of `||`s inside a store initializer.

  Side-effect free and total, in the drawCore/connectorCore tradition: every
  input may be junk — a localStorage key another tab corrupted, a URL with no
  query at all — and the answer is still a plain boolean.
*/

/** A recorded explicit choice, or `null` for "nothing was said". The distinction
    matters: "nothing was said" must fall through to the next authority, whereas
    a recorded `false` is a decision that outranks it. */
export type Choice = boolean | null;

/** Interpret the sticky `canLayout` flag held in localStorage.

    Only the two exact strings the store writes count as a choice. Anything else
    — absent, empty, garbage from an older version or a half-finished write — is
    `null`, i.e. "no choice recorded". Mapping garbage to `false` instead would
    let one corrupt byte silently veto a deck's own demo default, and the author
    would have no way to see why their LAYOUT button never appeared. */
export function readSticky(raw: string | null | undefined): Choice {
	if (raw === 'true') return true;
	if (raw === 'false') return false;
	return null;
}

/** Interpret a slide URL's `?layout` flag.

    `?layout`, `?layout=on`, `?layout=1` enable; `?layout=off`, `?layout=false`,
    `?layout=0` disable. An absent flag is `null`, NOT `false` — a URL that says
    nothing about LAYOUT must not overwrite what the speaker chose earlier, which
    is precisely what happens when they click through to the next slide (the nav
    links carry no query). */
export function readLayoutParam(search: URLSearchParams | null | undefined): Choice {
	if (!search || !search.has('layout')) return null;
	const v = (search.get('layout') ?? '').trim().toLowerCase();
	return v !== 'off' && v !== 'false' && v !== '0';
}

/** Is the LAYOUT control OFFERED here? (Offered, not active — the mode itself always
    starts off. This only decides whether the button is in the chrome at all.)

    Highest authority first:

      1. `vite dev` — the authoring environment always offers it, and nothing can take
         it away. Turning LAYOUT off on the machine where you author is never what
         anyone means.
      2. The speaker's own explicit choice (`?layout` / `?layout=off`), sticky across
         slides. They asked; they outrank the content.
      3. What the SLIDE declares — `layout: true` in its pages.ts entry (or, deck-wide,
         SlideDeck's `layout` prop). This is the piece that lets a BUILT deck offer
         LAYOUT on the slides that actually demonstrate it, without a URL flag the
         speaker has to remember on stage, and without arming the authoring chrome on
         every other slide in the deck.
      4. Off. That is the default a published slide gets. */
export function resolveCanLayout(dev: boolean, sticky: Choice, declared: boolean): boolean {
	if (dev === true) return true;
	if (sticky !== null) return sticky;
	return declared === true;
}
