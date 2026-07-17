---
name: deck-tests
description: The GeekPresent test contract — the dom and ssr vitest projects, why prerender must be proven through svelte/server, and the *Host.svelte / *Core.test.ts / *Ssr.ssr.test.ts naming. Use when adding or changing a component, a slide, or a store, or when a test won't run, renders blank, or throws a bare ReferenceError.
---

# The test contract

Two vitest **projects**, joined by `vitest.workspace.ts`. `pnpm test` runs both.

| | `dom` (`vitest.config.ts`) | `ssr` (`vitest.ssr.config.ts`) |
|---|---|---|
| environment | `jsdom` | `node` |
| plugins | `svelte()` + `svelteTesting()` | `svelte()` **only** |
| includes | `tests/**/*.test.ts` | `tests/**/*.ssr.test.ts` |
| excludes | `tests/**/*.ssr.test.ts` | — |
| renders via | `@testing-library/svelte` | `svelte/server`'s `render()` |

The `ssr` project deliberately omits `svelteTesting()`: that plugin prepends the `browser` resolve
condition, which would pull in Svelte's **client** runtime and defeat the whole point. Without it,
components compile in **server mode**, so a test can render them exactly as prerendering does.

## Why the SSR tests exist at all

**Built deck HTML never contains slide markup** — `SlideDeck` gates SSR, so you cannot prove a component
prerenders by grepping `docs/`. And you cannot prove it with a headless browser either: the deck's
`initialized` flag never flips in headless Chrome, so the page renders **blank**. Screenshots are not
evidence here.

The only way to assert prerendered output is to render the component through `svelte/server` yourself.
That is what `tests/*.ssr.test.ts` is for, and it is why an SSR test is part of the definition of done for
every component — not a nice-to-have.

## Naming

| file | what it is |
|---|---|
| `tests/<Name>.test.ts` | DOM test — the **live** half |
| `tests/<Name>Ssr.ssr.test.ts` | SSR test — the **static** half |
| `tests/<Name>Host.svelte` | a harness wrapper, when you need to drive props/context/slots |
| `tests/<name>Core.test.ts` | pure unit test of the matching `src/lib/utils/<name>Core.ts` |

Also: `tests/fixtures/`, and `tests/stubs/` (the `$app/*` stubs — see below).

## What each half asserts

Split by what the other one *cannot* see. Don't write the same assertions twice.

- **SSR = markup from props alone.** No `onMount`, no browser APIs — a purely declarative component's full
  markup must come from props, which is what prerendering a slide does. Assert the tokens, labels and
  mappings land in the string. Start the file with the environment pragma:

  ```ts
  // @vitest-environment node
  import { render } from 'svelte/server';
  import { describe, expect, it } from 'vitest';
  import Callout from '../src/lib/components/Callout.svelte';

  describe('Callout (SSR)', () => {
  	it('defaults to info: accent token, "Info" label, "i" glyph', () => {
  		const { body } = render(Callout, { props: {} });
  		expect(body).toContain('var(--callout-info-accent, #2980B9)');
  		expect(body).toContain('>Info</div>');
  	});
  });
  ```

  Asserting the **`var(--token, #fallback)` string** is doing double duty: it pins the role token *and* its
  dark fallback, which is the deck's actual unthemed theme.

- **DOM = the thing a server render never sees.** Stores re-flowing, a prop change re-clamping, an event
  handler, a `browser`-guarded reach for `localStorage`. Reach for a `*Host.svelte` when you need to
  `rerender` with new props or supply context:

  ```ts
  import { render } from '@testing-library/svelte';
  const { container, rerender } = render(ColumnsHost, { props: { span: 3, columns: 2 } });
  await rerender({ span: 3, columns: 3 });
  ```

  jsdom has **no layout engine** — it will not measure a grid, a flex box or a canvas. Assert the
  *inputs* the component computed (an inline custom property, a class, an attribute), never a pixel it
  would have laid out.

- **Core = the bad inputs.** `tests/<name>Core.test.ts` hits the pure module directly, and the interesting
  cases are the garbage ones: a lone `+`, a chord of separators, a key with no alias. Every core function
  is **total** — bad input yields an empty list or the token as typed, never a throw and never `NaNpx`.

## Two things both configs do for you

- **`define: { __GEEKPRESENT_SITE_URL__ }`** — anything that renders `<SlideDeck>` pulls in `<Seo>`, which
  hits a bare `ReferenceError` without this global. If a test dies on an unexplained `ReferenceError`, this
  is why; the value is irrelevant, its presence is not.
- **`$app/*` aliased to `tests/stubs/`** — `$app/environment`, `$app/stores`, `$app/navigation`. There is no
  Kit runtime under vitest.

## Running

```bash
pnpm test                                                       # both projects
npm_config_verify_deps_before_run=false pnpm exec vite build    # static build
```

There are no `test:dom` / `test:ssr` scripts; select a project with vitest's own flags if you need one.
Note the hardened pnpm setup blocks a bare `pnpm dev` — use `./booth exec --run -- ./dev-run.sh` if you
need to start one, and **the dev server is usually already up anyway** (see AGENTS.md Rule 6).
`prettier --check` does **not** pass at baseline; never `--write` the tree to "fix" it.
