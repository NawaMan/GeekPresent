import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DataTable from '../src/lib/datatable/DataTable.svelte';
import type { ColumnDef } from '../src/lib/datatable/types';

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
