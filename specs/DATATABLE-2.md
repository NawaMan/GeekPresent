# DataTable — Phase 2: Custom Cell Rendering + Controlled Mode

> Part 2 of 3. Builds on [DATATABLE-1.md](./DATATABLE-1.md) (core MVP). See also [DATATABLE-3.md](./DATATABLE-3.md) (selection, filters, visibility, CSV).
>
> **Read DATATABLE-1.md first** — the Hard Constraints, Architectural Decisions, File Structure, Public API types, Accessibility, Styling, and Testing & Quality Gates sections there apply to every phase and are not repeated in full here.

## Prerequisites

Phase 1 complete: pure `tableCore.ts` pipeline, semantic table with type-aware sorting, debounced global search, pagination with readout, empty/loading states, demo route with the ~200-row mixed-type dataset.

## Recap of Relevant Architecture

**Snippets for cell rendering.** Custom cells use Svelte 5 snippets passed per column, receiving `(row, value, rowIndex)`. Fall back to a `format` function (value → string), and raw value rendering as the default. **Precedence: snippet > format > raw.**

Per-column snippets: accept a `snippets` prop mapping column key → Snippet, OR named snippets with a `cell_` prefix convention — **pick the `snippets` prop approach (explicit map)** since dynamic snippet names aren't resolvable; document this clearly.

**Hybrid controlled/uncontrolled design.** All processing state lives in a single `TableState` object that can be bound (`$bindable`) or driven externally. Processing can be disabled entirely via a `mode: 'client' | 'server'` prop. In server mode the component renders `rows` as-is and only emits state changes.

## Usage Target (this phase enables the snippet + bind:state surface)

```svelte
<DataTable
  rows={data}
  columns={columns}
  bind:state={tableState}
  pageSizes={[10, 25, 50, 100]}
  mode="client"
  loading={false}
>
  {#snippet cell_status(row, value)}
    <span class="badge badge-{value}">{value}</span>
  {/snippet}
  {#snippet empty()}
    No results found.
  {/snippet}
</DataTable>
```

> Note: per the architectural decision, per-column custom cells are wired through the explicit `snippets` prop map (column key → Snippet), not dynamically-named `cell_*` snippets. The `empty` snippet (and other structural snippets) may still be named slots. Document the chosen convention in `index.ts` / component doc comment.

## Phase 2 Deliverables

1. Snippet-based cell rendering via the `snippets` prop map, with `format` fallback, with raw fallback (precedence: snippet > format > raw).
2. `bind:state` (`$bindable`) exposing full `TableState`; changing it externally must drive the table.
3. `mode="server"`: component skips internal processing, renders rows verbatim, and emits an `onstatechange(state)` callback; parent supplies `totalCount` prop for the readout and page math. Write a small demo faking a server with `setTimeout` to prove the contract works.
4. Header snippet support (optional custom header content per column).

## Phase 2 Acceptance Criteria

- A status column renders a colored badge via snippet; a currency column renders via `format`; both still sort by the underlying raw value, and search matches the formatted text.
- Switching the demo between client and server mode requires changing only props, not markup.

## Cross-Cutting Requirements (carried from Phase 1 — see DATATABLE-1.md for full text)

- **Accessibility:** semantic table, `<button>` in sortable headers, `aria-sort`, labeled search + pagination, `aria-live="polite"` readout, focus preserved across page changes.
- **Styling:** scoped CSS with `--dt-*` custom properties; no Tailwind/external CSS.
- **Pipeline purity:** all processing stays in `tableCore.ts` as pure functions; the four chained `$derived` stages are never merged. In server mode, the client-side pipeline is bypassed but the pure functions remain the single source of truth for client mode.

## Testing & Quality Gates

- Extend the Svelte component test to cover: snippet rendering, `format` fallback, sorting by raw value while displaying formatted text, and search matching formatted text.
- Add a test (or demo-driven check) that external `bind:state` mutation drives the table, and that server mode emits `onstatechange` and honors `totalCount`.
- `svelte-check` passes with no errors; Vitest suite green before each commit.

## Commit Cadence

One commit per numbered deliverable, message format `feat(datatable): <deliverable>`, tests in the same commit as the code they cover. Run `svelte-check` and the test suite before each commit. End the phase with the demo route updated to showcase snippets, `format`, and the client/server toggle.
