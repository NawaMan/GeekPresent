import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import BindStateHost from './BindStateHost.svelte';
import DataTable from '../src/lib/datatable/DataTable.svelte';
import type { ColumnDef, TableState } from '../src/lib/datatable/types';

type Person = { name: string; score: number | null; joined: string | null };

const people: Person[] = Array.from({ length: 15 }, (_, i) => ({
	name: `Person ${i + 1}`,
	score: i === 3 ? null : (i * 7) % 60,
	joined: i === 5 ? null : `2024-0${(i % 9) + 1}-15`
}));

// ColumnDef<any> — testing-library's render() can't infer the component generic
const columns: ColumnDef[] = [
	{ key: 'name', label: 'Name' },
	{ key: 'score', label: 'Score', format: (v) => (v === null ? '—' : `${v} pts`) },
	{ key: 'joined', label: 'Joined' }
];

function rowsOf(container: HTMLElement): HTMLTableRowElement[] {
	return Array.from(container.querySelectorAll('tbody tr'));
}

describe('DataTable', () => {
	it('renders a semantic table with headers and one page of formatted rows', () => {
		const { container } = render(DataTable, { rows: people, columns });

		expect(container.querySelector('table thead')).not.toBeNull();
		const headers = Array.from(container.querySelectorAll('th[scope="col"]'));
		expect(headers.map((h) => h.textContent?.trim())).toEqual(['Name', 'Score', 'Joined']);

		// default pageSize 10 of 15 rows
		expect(rowsOf(container)).toHaveLength(10);
		expect(screen.getByText('Person 1')).toBeTruthy();
		expect(screen.getByText('0 pts')).toBeTruthy(); // format() applied
		expect(screen.getByText('—')).toBeTruthy(); // null formatted, not "null"
	});

	it('sorts on header click through the asc → desc → none cycle', async () => {
		const { container } = render(DataTable, {
			rows: [
				{ name: 'b', score: 100, joined: null },
				{ name: 'c', score: 2, joined: null },
				{ name: 'a', score: 10, joined: null }
			],
			columns
		});
		const scoreTh = Array.from(container.querySelectorAll('th')).find((th) =>
			th.textContent?.includes('Score')
		)!;
		const scoreButton = scoreTh.querySelector('button')!;
		const firstColumn = () => rowsOf(container).map((tr) => tr.cells[0].textContent);

		expect(firstColumn()).toEqual(['b', 'c', 'a']); // natural order

		await fireEvent.click(scoreButton); // asc: 2 < 10 < 100, numerically
		expect(firstColumn()).toEqual(['c', 'a', 'b']);
		expect(scoreTh.getAttribute('aria-sort')).toBe('ascending');

		await fireEvent.click(scoreButton); // desc
		expect(firstColumn()).toEqual(['b', 'a', 'c']);
		expect(scoreTh.getAttribute('aria-sort')).toBe('descending');

		await fireEvent.click(scoreButton); // back to natural order exactly
		expect(firstColumn()).toEqual(['b', 'c', 'a']);
		expect(scoreTh.getAttribute('aria-sort')).toBeNull();
	});

	it('filters rows from the debounced search box', async () => {
		const { container } = render(DataTable, { rows: people, columns });
		const input = screen.getByLabelText('Search') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: 'Person 12' } });
		// debounced: nothing filtered yet
		expect(rowsOf(container)).toHaveLength(10);

		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(rowsOf(container)).toHaveLength(1);
		expect(rowsOf(container)[0].cells[0].textContent).toBe('Person 12');

		await fireEvent.input(input, { target: { value: '' } });
		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(rowsOf(container)).toHaveLength(10);
	});

	it('paginates with a correct readout and page-size select', async () => {
		const { container } = render(DataTable, { rows: people, columns });
		const readout = () => container.querySelector('.readout')?.textContent;

		expect(readout()).toBe('Showing 1–10 of 15 entries');

		await fireEvent.click(screen.getByLabelText('Next page'));
		expect(readout()).toBe('Showing 11–15 of 15 entries');
		expect(rowsOf(container)).toHaveLength(5);

		await fireEvent.click(screen.getByLabelText('Next page')); // guarded: already last
		expect(readout()).toBe('Showing 11–15 of 15 entries');

		await fireEvent.click(screen.getByLabelText('Previous page'));
		expect(readout()).toBe('Showing 1–10 of 15 entries');

		const select = screen.getByLabelText('Rows per page') as HTMLSelectElement;
		await fireEvent.change(select, { target: { value: '25' } });
		expect(rowsOf(container)).toHaveLength(15);
		expect(readout()).toBe('Showing 1–15 of 15 entries');
	});

	it('keeps state coherent through search → page → clear search', async () => {
		const { container } = render(DataTable, {
			rows: people,
			columns,
			pageSize: 3
		});
		const input = screen.getByLabelText('Search') as HTMLInputElement;
		const readout = () => container.querySelector('.readout')?.textContent;

		// go deep, then filter down to fewer pages → page snaps back into range
		for (let i = 0; i < 4; i++) await fireEvent.click(screen.getByLabelText('Next page'));
		expect(readout()).toBe('Showing 13–15 of 15 entries');

		await fireEvent.input(input, { target: { value: 'Person 1' } });
		await new Promise((resolve) => setTimeout(resolve, 350));
		// matches Person 1, 10–15 → 7 rows, and page reset to 1
		expect(readout()).toBe('Showing 1–3 of 7 entries');

		await fireEvent.click(screen.getByLabelText('Next page'));
		expect(readout()).toBe('Showing 4–6 of 7 entries');

		await fireEvent.input(input, { target: { value: '' } });
		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(readout()).toBe('Showing 1–3 of 15 entries'); // no out-of-range page
	});

	it('distinguishes "No data" from "No results found"', async () => {
		const empty = render(DataTable, { rows: [], columns });
		expect(empty.container.querySelector('tbody')?.textContent).toContain('No data');
		expect(empty.container.querySelector('.readout')?.textContent).toBe('Showing 0–0 of 0 entries');
		empty.unmount();

		const { container } = render(DataTable, { rows: people, columns });
		await fireEvent.input(screen.getByLabelText('Search'), { target: { value: 'zzz-no-hit' } });
		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(container.querySelector('tbody')?.textContent).toContain('No results found');
	});

	it('caps the body at maxHeight so large page sizes scroll instead of growing', () => {
		const { container } = render(DataTable, {
			rows: people,
			columns,
			pageSize: 50,
			maxHeight: '560px'
		});
		const scroll = container.querySelector('.scroll') as HTMLElement;
		expect(scroll.style.maxHeight).toBe('560px');
		expect(rowsOf(container)).toHaveLength(15); // all rows in the scroll container
	});

	it('sorts a column by its sortValue accessor (pending as latest)', async () => {
		const { container } = render(DataTable, {
			rows: [
				{ name: 'old', when: '2023-01-01' },
				{ name: 'wip', when: 'pending' },
				{ name: 'new', when: '2025-06-01' }
			],
			columns: [
				{ key: 'name', label: 'Name' },
				{
					key: 'when',
					label: 'When',
					type: 'date',
					sortValue: (r: { when: string }) => (r.when === 'pending' ? '9999-12-31' : r.when)
				}
			] as ColumnDef[]
		});
		const whenButton = Array.from(container.querySelectorAll('th button')).find((b) =>
			b.textContent?.includes('When')
		)!;
		const firstColumn = () => rowsOf(container).map((tr) => tr.cells[0].textContent);

		await fireEvent.click(whenButton); // asc: oldest → newest → pending
		expect(firstColumn()).toEqual(['old', 'new', 'wip']);

		await fireEvent.click(whenButton); // desc (newest-first): pending leads
		expect(firstColumn()).toEqual(['wip', 'new', 'old']);
	});

	it('fixes the body height so filtered-down results do not shrink the table', async () => {
		const { container } = render(DataTable, { rows: people, columns, height: '400px' });
		const scroll = container.querySelector('.scroll') as HTMLElement;
		expect(scroll.style.height).toBe('400px');

		await fireEvent.input(screen.getByLabelText('Search'), { target: { value: 'Person 12' } });
		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(rowsOf(container)).toHaveLength(1);
		expect(scroll.style.height).toBe('400px'); // container height unchanged
	});

	it('stripes alternate rows when striped is set', () => {
		const { container } = render(DataTable, { rows: people, columns, striped: true });
		const stripes = rowsOf(container).map((tr) => tr.classList.contains('stripe'));
		expect(stripes.slice(0, 4)).toEqual([false, true, false, true]);

		const plain = render(DataTable, { rows: people, columns });
		expect(rowsOf(plain.container).some((tr) => tr.classList.contains('stripe'))).toBe(false);
	});

	it('overlays a loading indicator without collapsing the table', () => {
		const { container } = render(DataTable, { rows: people, columns, loading: true });
		expect(container.querySelector('[role="status"]')?.textContent).toContain('Loading');
		expect(rowsOf(container)).toHaveLength(10); // rows still rendered underneath
	});
});

describe('DataTable cell snippets', () => {
	type Service = { name: string; status: string; cost: number };
	const services: Service[] = [
		{ name: 'api', status: 'up', cost: 20 },
		{ name: 'db', status: 'down', cost: 3 },
		{ name: 'web', status: 'up', cost: 100 }
	];
	const serviceColumns: ColumnDef[] = [
		{ key: 'name', label: 'Name' },
		// format present too — the snippet must win (precedence snippet > format > raw)
		{ key: 'status', label: 'Status', format: () => 'format-loses' },
		{ key: 'cost', label: 'Cost', format: (v) => `$${v}.00` }
	];
	// createRawSnippet params arrive as getters: (row, value, rowIndex).
	// row is `() => unknown` because render() can't infer the component generic.
	const badge = createRawSnippet(
		(_row: () => unknown, value: () => unknown, rowIndex: () => number) => ({
			render: () =>
				`<span class="badge badge-${value()}" data-row-index="${rowIndex()}">${value()}</span>`
		})
	);

	it('renders cells via the snippets map with (row, value, rowIndex), beating format', () => {
		const { container } = render(DataTable, {
			rows: services,
			columns: serviceColumns,
			snippets: { status: badge }
		});

		const badges = Array.from(container.querySelectorAll('tbody .badge'));
		expect(badges.map((b) => b.textContent)).toEqual(['up', 'down', 'up']); // raw value, not format()
		expect(badges.map((b) => b.className)).toEqual(['badge badge-up', 'badge badge-down', 'badge badge-up']);
		expect(badges.map((b) => b.getAttribute('data-row-index'))).toEqual(['0', '1', '2']);
		expect(container.textContent).not.toContain('format-loses');
	});

	it('sorts snippet and format columns by the raw value, not the displayed text', async () => {
		const { container } = render(DataTable, {
			rows: services,
			columns: serviceColumns,
			snippets: { status: badge }
		});
		const names = () => rowsOf(container).map((tr) => tr.cells[0].textContent);
		const buttonFor = (label: string) =>
			Array.from(container.querySelectorAll('th button')).find((b) =>
				b.textContent?.includes(label)
			)!;

		// cost displays "$20.00" etc. but sorts numerically: 3 < 20 < 100
		await fireEvent.click(buttonFor('Cost'));
		expect(names()).toEqual(['db', 'api', 'web']);
		expect(rowsOf(container).map((tr) => tr.cells[2].textContent?.trim())).toEqual([
			'$3.00',
			'$20.00',
			'$100.00'
		]);

		// snippet column sorts by its raw value too
		await fireEvent.click(buttonFor('Status'));
		expect(names()).toEqual(['db', 'api', 'web']); // down < up (asc), ties keep order
	});

	it('matches global search against the formatted text, even for snippet cells', async () => {
		const { container } = render(DataTable, {
			rows: services,
			columns: serviceColumns,
			snippets: { status: badge }
		});
		const input = screen.getByLabelText('Search') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: '$100' } }); // format() output
		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(rowsOf(container).map((tr) => tr.cells[0].textContent)).toEqual(['web']);
	});

	it('renders the empty snippet instead of "No results found"', async () => {
		const emptySnippet = createRawSnippet(() => ({
			render: () => `<em class="custom-empty">Nothing matched, sorry!</em>`
		}));
		const { container } = render(DataTable, {
			rows: services,
			columns: serviceColumns,
			empty: emptySnippet
		});

		await fireEvent.input(screen.getByLabelText('Search'), { target: { value: 'zzz-no-hit' } });
		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(container.querySelector('tbody .custom-empty')?.textContent).toBe(
			'Nothing matched, sorry!'
		);
		expect(container.textContent).not.toContain('No results found');
	});
});

describe('DataTable bind:state (controlled mode)', () => {
	const hostProps = { rows: people, columns };
	const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

	it('follows external state changes: page, search, sort', async () => {
		const { container, component } = render(BindStateHost, hostProps);
		const readout = () => container.querySelector('.readout')?.textContent;
		const names = () => rowsOf(container).map((tr) => tr.cells[0].textContent);

		expect(readout()).toBe('Showing 1–5 of 15 entries'); // host pageSize 5

		component.setState({ page: 3 });
		await flush();
		expect(readout()).toBe('Showing 11–15 of 15 entries');

		// external search needs no debounce — it drives the table directly
		component.setState({ search: 'Person 12', page: 1 });
		await flush();
		expect(names()).toEqual(['Person 12']);

		component.setState({ search: '', sort: { key: 'name', direction: 'desc' } });
		await flush();
		expect(names()[0]).toBe('Person 15'); // natural desc: 15 > 14 > … (numeric, not lexicographic)
		const nameTh = container.querySelector('th[aria-sort]');
		expect(nameTh?.getAttribute('aria-sort')).toBe('descending'); // UI reflects external sort
	});

	it('writes internal changes back to the bound parent state', async () => {
		const { container, component } = render(BindStateHost, hostProps);

		const nameButton = Array.from(container.querySelectorAll('th button')).find((b) =>
			b.textContent?.includes('Name')
		)!;
		await fireEvent.click(nameButton);
		expect(component.getState().sort).toEqual({ key: 'name', direction: 'asc' });

		await fireEvent.click(screen.getByLabelText('Next page'));
		expect(component.getState().page).toBe(2);

		const select = screen.getByLabelText('Rows per page') as HTMLSelectElement;
		await fireEvent.change(select, { target: { value: '10' } });
		expect(component.getState().pageSize).toBe(10);
	});

	it('accepts an initial state prop without binding', () => {
		const initial: TableState = {
			sort: null,
			search: '',
			columnFilters: {},
			page: 2,
			pageSize: 5
		};
		const { container } = render(DataTable, { rows: people, columns, state: initial });
		expect(container.querySelector('.readout')?.textContent).toBe('Showing 6–10 of 15 entries');
	});
});

describe('DataTable server mode', () => {
	const serverState: TableState = {
		sort: { key: 'name', direction: 'desc' },
		search: 'Person',
		columnFilters: {},
		page: 2,
		pageSize: 5
	};

	it('renders rows verbatim — no filtering, sorting, or paging applied', () => {
		// state says: sort desc, search "Person", pageSize 5 — none of it may
		// touch the rows; the server already applied it.
		const { container } = render(DataTable, {
			rows: people.slice(0, 8), // "the server's page": 8 rows, unsorted
			columns,
			mode: 'server',
			totalCount: 95,
			state: serverState
		});

		const names = rowsOf(container).map((tr) => tr.cells[0].textContent);
		expect(names).toEqual(people.slice(0, 8).map((p) => p.name)); // original order, all 8
	});

	it('honors totalCount for the readout and page math', () => {
		const { container } = render(DataTable, {
			rows: people.slice(0, 5),
			columns,
			mode: 'server',
			totalCount: 95,
			state: serverState
		});

		expect(container.querySelector('.readout')?.textContent).toBe('Showing 6–10 of 95 entries');
		expect(container.textContent).toContain('Page 2 of 19');
	});

	it('emits onstatechange for sort, search, and paging interactions', async () => {
		const emitted: TableState[] = [];
		const { container } = render(DataTable, {
			rows: people.slice(0, 5),
			columns,
			mode: 'server',
			totalCount: 95,
			state: serverState,
			onstatechange: (s: TableState) => emitted.push(s)
		});

		await fireEvent.click(screen.getByLabelText('Next page'));
		expect(emitted.at(-1)?.page).toBe(3);

		const nameButton = Array.from(container.querySelectorAll('th button')).find((b) =>
			b.textContent?.includes('Name')
		)!;
		await fireEvent.click(nameButton); // desc → none (cycle), back to page 1
		expect(emitted.at(-1)?.sort).toBeNull();
		expect(emitted.at(-1)?.page).toBe(1);

		await fireEvent.input(screen.getByLabelText('Search'), { target: { value: 'node' } });
		await new Promise((resolve) => setTimeout(resolve, 350)); // debounce
		expect(emitted.at(-1)?.search).toBe('node');
	});

	it('shows "No results found" when a server search comes back empty', () => {
		const { container } = render(DataTable, {
			rows: [],
			columns,
			mode: 'server',
			totalCount: 0,
			state: { ...serverState, search: 'zzz-no-hit', page: 1 }
		});
		expect(container.querySelector('tbody')?.textContent).toContain('No results found');
	});
});

describe('DataTable header snippets', () => {
	const fancy = createRawSnippet((column: () => ColumnDef) => ({
		render: () => `<span class="fancy-th">★ ${column().label}</span>`
	}));

	it('renders custom header content inside the sort button; sorting still works', async () => {
		const { container } = render(DataTable, {
			rows: people,
			columns,
			headerSnippets: { score: fancy }
		});

		const fancyTh = container.querySelector('th .fancy-th');
		expect(fancyTh?.textContent).toBe('★ Score'); // receives the ColumnDef
		expect(fancyTh?.closest('button')).not.toBeNull(); // inside the sort button

		await fireEvent.click(fancyTh!.closest('button')!);
		expect(fancyTh?.closest('th')?.getAttribute('aria-sort')).toBe('ascending');
	});

	it('renders bare header content for non-sortable columns', () => {
		const { container } = render(DataTable, {
			rows: people,
			columns: [{ key: 'name', label: 'Name', sortable: false }] as ColumnDef[],
			headerSnippets: { name: fancy }
		});

		const fancyTh = container.querySelector('th .fancy-th');
		expect(fancyTh?.textContent).toBe('★ Name');
		expect(fancyTh?.closest('button')).toBeNull(); // no button when unsortable
	});
});
