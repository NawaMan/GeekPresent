# DataTable — Phase 1: Core MVP

> Part 1 of 3. See [DATATABLE-2.md](./DATATABLE-2.md) (custom cells + controlled mode) and [DATATABLE-3.md](./DATATABLE-3.md) (selection, filters, visibility, CSV).

## Objective

Build a reusable, dependency-free DataTable component in Svelte 5 (runes mode) that replicates the core jQuery DataTables experience: sorting, global search, pagination, and configurable columns — with custom cell rendering via snippets as the flagship feature (delivered in Phase 2). The component will be used inside a presentation-building app.

## Hard Constraints (all phases)

- Svelte 5 with runes (`$state`, `$derived`, `$props`, `$bindable`). No legacy `export let` / stores-based reactivity.
- Zero runtime dependencies. No jQuery, no table libraries, no utility libraries.
- TypeScript throughout (`<script lang="ts">`), with exported types for the public API.
- Accessible by default (see Accessibility section — not optional, not deferred).
- All data processing must be pure functions in a separate module (`tableCore.ts`), independently unit-testable without rendering a component.

## Architectural Decisions (settled — do not revisit)

**1. Hybrid controlled/uncontrolled design.** The component defaults to uncontrolled: parent passes raw `rows`, the component filters/sorts/paginates internally. But all processing state (sort descriptor, filter text, page, pageSize) lives in a single `TableState` object that can be bound (`$bindable`) or driven externally, and processing can be disabled entirely via a `mode: 'client' | 'server'` prop. In server mode the component renders `rows` as-is and only emits state changes — this is the hook for future server-side data without a rewrite. (Binding and server mode land in Phase 2; design Phase 1 so they slot in.)

**2. Chained derivations.** Data flows through exactly this pipeline, each step a separate `$derived`:

```
rows → filtered (global search + per-column filters) → sorted → paginated → visible rows
```

Each stage is a pure function imported from `tableCore.ts`. Never merge stages. Total count for the "showing X–Y of Z" readout comes from the `sorted` (post-filter) stage, not the raw rows.

**3. Snippets for cell rendering** (Phase 2). Custom cells use Svelte 5 snippets passed per column, receiving `(row, value, rowIndex)`. Fall back to a `format` function (value → string) for simple cases, and raw value rendering as the default. Precedence: snippet > format > raw. In Phase 1, implement raw + `format` fallback so the pipeline and search behave correctly.

## File Structure

```
src/lib/datatable/
  DataTable.svelte        # main component (rendering + state wiring only)
  tableCore.ts            # pure functions: filter, sort, paginate, compare
  types.ts                # ColumnDef, TableState, SortDescriptor, etc.
  Pagination.svelte       # page controls + page-size select + readout
  SearchBox.svelte        # debounced global search input
  index.ts                # public exports
tests/
  tableCore.test.ts       # unit tests for pure functions
```

## Public API (target shape — full surface; Phase 1 uses the subset it needs)

```ts
// types.ts
export type SortDirection = 'asc' | 'desc' | null;

export interface SortDescriptor {
  key: string;
  direction: SortDirection;
}

export interface ColumnDef<T = any> {
  key: string;                     // property accessor (support dot paths later; flat keys for MVP)
  label: string;
  sortable?: boolean;              // default true
  type?: 'string' | 'number' | 'date' | 'auto';  // default 'auto'
  format?: (value: any, row: T) => string;
  sortValue?: (row: T) => unknown; // custom sort key ("orthogonal data") — added post-MVP, see Addendum
  width?: string;                  // CSS width, optional
  filterable?: boolean;            // per-column filter (Phase 3)
  visible?: boolean;               // column visibility (Phase 3)
  align?: 'left' | 'center' | 'right';
}

export interface TableState {
  sort: SortDescriptor | null;
  search: string;
  columnFilters: Record<string, string>;
  page: number;                    // 1-based
  pageSize: number;
}
```

## Type-Aware Sorting (get this right — it's the classic bug)

In `tableCore.ts`, implement `compareValues(a, b, type)`:

- `number`: coerce with `Number()`, `NaN` sorts last.
- `date`: coerce via `new Date()`, invalid dates sort last.
- `string`: `String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true })` — the `numeric: true` gives natural sort ("item2" before "item10").
- `auto`: infer per column once by sampling non-null values (if all coerce cleanly to numbers → number; else if all parse as dates → date; else string). Cache the inference per column, don't infer per comparison.
- `null`/`undefined`/`''` always sort last regardless of direction.
- Sorting must be stable (use index-tagged sort or rely on `Array.prototype.sort` stability in modern engines, but tag anyway for safety) and non-mutating (sort a copy).

Sort cycle on header click: none → asc → desc → none (back to natural order).

## Phase 1 Deliverables

1. `tableCore.ts` with `filterRows`, `sortRows`, `paginateRows`, `compareValues`, `inferColumnType` — all pure, all unit-tested.
2. `DataTable.svelte` rendering a semantic table from `rows` + `columns` with the chained `$derived` pipeline.
3. Header-click sorting with the three-state cycle and type-aware comparison. Visual sort indicator (▲/▼) and `aria-sort`.
4. Global search box, debounced ~250ms, case-insensitive substring match across all visible columns (match against the *formatted* value if a `format` fn exists, else the raw value stringified).
5. Pagination: prev/next, page-size select (10/25/50/100), "Showing X–Y of Z entries" readout. Clamp page when filters shrink the result set (e.g., on page 9 of 3 → snap to page 3). Reset to page 1 when search/sort changes.
6. Empty state ("No results found" when filter yields zero; distinct "No data" when rows is empty) and a `loading` prop that shows a loading indicator without collapsing the table layout.
7. Demo route with a hardcoded ~200-row dataset containing mixed types (strings, numbers, dates, nulls) to exercise sorting edge cases.

## Phase 1 Acceptance Criteria

- Clicking a numeric column header sorts 2 < 10 < 100 (not "10" < "100" < "2").
- Third click on a header restores original row order exactly.
- Searching "foo" then navigating pages then clearing search returns coherent state (no out-of-range page).
- Unit tests pass for: stable sort, null handling, NaN handling, date sorting, natural string sort, pagination boundaries (empty set, exact multiple of pageSize, single partial page).

## Accessibility Requirements (all phases)

- Real `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`.
- Sortable headers contain a `<button>` (not a click handler on `<th>`) so they're keyboard-operable; `aria-sort="ascending" | "descending"` on the `<th>`, removed when unsorted.
- Search input has a visible or `aria-label` label; pagination buttons have `aria-label`s ("Next page"); the readout region uses `aria-live="polite"`.
- Focus is never lost when the page of data changes (don't re-mount the table wrapper).

(Checkbox-column a11y requirements apply in Phase 3.)

## Styling (all phases)

Plain scoped CSS in the component with CSS custom properties for theming (`--dt-border`, `--dt-header-bg`, `--dt-row-hover`, `--dt-accent`, font sizes). No Tailwind, no external CSS. Clean, neutral default look; the presentation app will theme via the custom properties.

## Testing & Quality Gates (all phases)

- Vitest for `tableCore.ts` (this is where the bugs live — comparison, inference, pagination math). Target: every branch of `compareValues` and `paginateRows` covered.
- One Svelte component test (Vitest + @testing-library/svelte, dev-dependency only) smoke-testing: renders rows, click header changes order, search filters, pagination readout correct.
- Type-check (`svelte-check`) must pass with no errors.
- Each phase ends with the demo route updated to showcase the new features.

## Commit Cadence

One commit per numbered deliverable, message format `feat(datatable): <deliverable>`, with tests in the same commit as the code they cover. Run `svelte-check` and the test suite before each commit.

---

## Addendum — shipped additions beyond the Phase 1 spec

Added during/after the Phase 1 build (all covered by tests; Phase 2/3 should preserve them):

- **`maxHeight` / `height` props** (also `--dt-max-height` / `--dt-height`): `maxHeight` caps the table body — larger page sizes scroll inside it under a sticky header instead of growing the page. `height` *fixes* the body size, so a filtered-down result set doesn't shrink the table either (no layout jumping on a slide). Sticky headers required `border-collapse: separate` and an opaque header base (`--dt-bg`).
- **`--dt-bg` / `--dt-color`**: the table body is its own themable surface (e.g. a light panel on a dark deck). Toolbar and pagination stay on the page background deliberately.
- **`striped` prop** + `--dt-stripe-bg`: alternate-row (zebra) backgrounds.
- **`ColumnDef.sortValue?: (row) => unknown`**: custom sort accessor — the "orthogonal data" pattern from jQuery DataTables. The column sorts by the accessor's result (compared under the column's resolved type; `type: 'auto'` inference also samples it) while cells display the raw/formatted value. Canonical use: `sortValue: (r) => r.when === 'pending' ? '9999-12-31' : r.when` makes a 'pending' date sort as *latest* — after real dates ascending, leading a newest-first sort — instead of being an invalid date that always sinks. Blank/uncomparable accessor results still sort last regardless of direction. Plumbed as the optional 4th arg of `sortRows` (and 3rd of `inferColumnType`).
