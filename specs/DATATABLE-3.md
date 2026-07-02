# DataTable — Phase 3: Selection, Per-Column Filters, Column Visibility, CSV Export

> Part 3 of 3. Builds on [DATATABLE-1.md](./DATATABLE-1.md) (core MVP) and [DATATABLE-2.md](./DATATABLE-2.md) (custom cells + controlled/server mode).
>
> **Read DATATABLE-1.md first** — the Hard Constraints, Architectural Decisions, File Structure, Public API types, Accessibility, Styling, and Testing & Quality Gates sections there apply to every phase and are not repeated in full here.

## Prerequisites

Phases 1 & 2 complete: pure `tableCore.ts` pipeline; type-aware sorting; global search; pagination; snippet/`format`/raw cell rendering; `bind:state`; `mode="client" | "server"` with `onstatechange` + `totalCount`; header snippets.

## Recap of Relevant Architecture / API

The pipeline (each stage a separate `$derived`, each a pure function from `tableCore.ts`):

```
rows → filtered (global search + per-column filters) → sorted → paginated → visible rows
```

Phase 3 activates the `filterable` and `visible` fields on `ColumnDef`, and the `columnFilters` map on `TableState`:

```ts
export interface ColumnDef<T = any> {
  // ...key, label, sortable, type, format, width, align (see DATATABLE-1.md)
  filterable?: boolean;            // per-column filter (this phase)
  visible?: boolean;               // column visibility (this phase)
}

export interface TableState {
  // ...sort, search, page, pageSize (see DATATABLE-1.md)
  columnFilters: Record<string, string>;  // per-column filter text (this phase)
}
```

New public surface this phase:
- `selectable` prop (opt-in checkbox column) + `bind:selected` (selected rows) + required `rowKey` prop (a key field name **or** function).
- `ColumnToggle.svelte` component for column visibility.
- `exportCsv(rows, columns)` utility in `tableCore.ts` (or a sibling pure module).

## Usage Target

```svelte
<DataTable
  rows={data}
  columns={columns}
  bind:state={tableState}
  selectable
  rowKey="id"
  bind:selected={selectedRows}
>
  {#snippet cell_status(row, value)}
    <span class="badge badge-{value}">{value}</span>
  {/snippet}
</DataTable>
```

## Phase 3 Deliverables

1. **Row selection:** checkbox column (opt-in via `selectable` prop), select-all-on-page with indeterminate state, `bind:selected` exposing selected rows (keyed by a required `rowKey` prop — a key field name or function; **do not use array index as identity**).
2. **Per-column filters:** filter inputs in a second header row for columns with `filterable: true`; text contains-match for MVP of this feature. Filters compose with global search (AND). Filter logic lives in the pure `filterRows` stage.
3. **Column visibility:** respect `visible` on `ColumnDef` reactively; provide a simple toggle UI component (`ColumnToggle.svelte`) that mutates a bound columns config.
4. **CSV export:** `exportCsv(rows, columns)` — exports the filtered+sorted set (**not just current page**), uses `format` where defined, proper quoting/escaping. Pure and unit-tested.

## Phase 3 Acceptance Criteria

- Select-all selects only the current page's rows; selection survives page changes and re-sorting (identity by `rowKey`, not index).
- Column filter on "region" + global search on "smith" returns the intersection.
- Exported CSV opens correctly in Excel with quoted commas and quotes escaped.

## Cross-Cutting Requirements (carried from Phase 1 — see DATATABLE-1.md for full text)

- **Accessibility (this phase adds):** checkbox column header checkbox labeled "Select all rows on this page"; row checkboxes labeled per row. Plus all prior a11y (semantic table, `<button>` headers, `aria-sort`, labeled controls, `aria-live` readout, focus preserved across page changes).
- **Styling:** scoped CSS with `--dt-*` custom properties; no Tailwind/external CSS.
- **Pipeline purity:** per-column filtering and CSV export are pure functions in `tableCore.ts`; the chained `$derived` stages are never merged. Total count still comes from the post-filter `sorted` stage.

## Out of Scope (do not build)

Virtual scrolling, column resizing/reordering, sticky headers, real server integration. Note where hooks exist (server mode contract from Phase 2, pipeline purity) but write no code for these.

## Testing & Quality Gates

- Unit-test `exportCsv` (comma quoting, quote escaping, `format` application, filtered+sorted set — not current page) and the per-column filter branch of `filterRows`.
- Extend the component test to cover: select-all-on-page + indeterminate state, selection identity by `rowKey` surviving page/sort changes, column filter + global search intersection, and `ColumnToggle` hiding/showing a column.
- `svelte-check` passes with no errors; Vitest suite green before each commit.

## Commit Cadence

One commit per numbered deliverable, message format `feat(datatable): <deliverable>`, tests in the same commit as the code they cover. Run `svelte-check` and the test suite before each commit. End the phase with the demo route updated to showcase selection, per-column filters, column toggling, and CSV export.
