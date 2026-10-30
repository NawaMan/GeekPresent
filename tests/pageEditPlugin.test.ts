// The deck-edit endpoints that touch more than pages.ts — duplicate, rename (with
// link rewriting), delete and refs — driven against a temp project, as
// sourceTag.test.ts does for ADJUST.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import type { ViteDevServer } from 'vite';
import {
	handlePageDuplicate,
	handlePageRefs,
	handlePageRemove,
	handlePageRename
} from '../src/lib/adjust/devSavePlugin';

const PAGES = `export const pages = [
	{ path: "title.html", title: "Title" },
	{ path: "old.html", title: "Old", adjust: true },
];
`;
const OLD_PAGE = `<script>
	const path = 'src/routes/slides/old.html/+page.svelte';
</script>
<p>Old</p>
`;
const TITLE_PAGE = `<AppendixLink to="old.html">go</AppendixLink>\n`;
const OTHER_DECK = `<a href="../slides/old.html">x</a> <a href="old.html">mine</a>\n`;

describe('page duplicate / rename / remove / refs', () => {
	let root: string;
	const server = () => ({ config: { root, base: '/' } }) as unknown as ViteDevServer;
	const f = (rel: string) => path.join(root, 'src/routes', rel);
	const read = (rel: string) => readFile(f(rel), 'utf8');
	const gone = async (rel: string) => access(f(rel)).then(() => false, () => true);
	type Handler = (server: ViteDevServer, body: string) => Promise<{ status: number; payload: unknown }>;
	const post = (fn: Handler, body: object) => fn(server(), JSON.stringify(body));

	beforeEach(async () => {
		root = await mkdtemp(path.join(tmpdir(), 'gp-deck-'));
		for (const d of ['slides/title.html', 'slides/old.html', 'other/a.html']) {
			await mkdir(f(d), { recursive: true });
		}
		await writeFile(f('slides/pages.ts'), PAGES);
		await writeFile(f('slides/old.html/+page.svelte'), OLD_PAGE);
		await writeFile(f('slides/old.html/+layout.js'), 'export const prerender = true;\n');
		await writeFile(f('slides/old.html/pic.png'), 'PNG');
		await writeFile(f('slides/title.html/+page.svelte'), TITLE_PAGE);
		await writeFile(f('other/a.html/+page.svelte'), OTHER_DECK);
	});
	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	it('duplicates the folder (assets included), retargets its own path, lists it after', async () => {
		const r = await post(handlePageDuplicate, { deck: 'slides', path: 'old.html', newPath: 'old-copy.html', title: 'Old (copy)' });
		expect(r.status).toBe(200);
		expect(await read('slides/old-copy.html/pic.png')).toBe('PNG');
		expect(await read('slides/old-copy.html/+page.svelte')).toContain("'src/routes/slides/old-copy.html/+page.svelte'");
		expect(await read('slides/old.html/+page.svelte')).toBe(OLD_PAGE);
		expect(await read('slides/pages.ts')).toContain(
			'{ path: "old.html", title: "Old", adjust: true },\n\t{ path: "old-copy.html", title: "Old (copy)", adjust: true },'
		);
	});

	it('refuses to duplicate onto an existing folder', async () => {
		const r = await post(handlePageDuplicate, { deck: 'slides', path: 'old.html', newPath: 'title.html', title: 'X' });
		expect(r.status).toBe(409);
	});

	it('renames a path: moves the folder, rewrites links in its deck and others, edits the entry', async () => {
		const r = await post(handlePageRename, { deck: 'slides', path: 'old.html', newPath: 'new.html', title: 'New' });
		expect(r.status).toBe(200);
		expect(await gone('slides/old.html')).toBe(true);
		expect(await read('slides/new.html/+page.svelte')).toContain("'src/routes/slides/new.html/+page.svelte'");
		expect(await read('slides/title.html/+page.svelte')).toBe('<AppendixLink to="new.html">go</AppendixLink>\n');
		// The other deck's bare "old.html" is ITS slide, not ours.
		expect(await read('other/a.html/+page.svelte')).toBe('<a href="../slides/new.html">x</a> <a href="old.html">mine</a>\n');
		expect(await read('slides/pages.ts')).toContain('{ path: "new.html", title: "New", adjust: true },');
		expect((r.payload as { updated: string[] }).updated.sort()).toEqual([
			'src/routes/other/a.html/+page.svelte',
			'src/routes/slides/title.html/+page.svelte'
		]);
	});

	it('renames a title only without touching any folder', async () => {
		const r = await post(handlePageRename, { deck: 'slides', path: 'old.html', newPath: 'old.html', title: 'Renamed' });
		expect(r.status).toBe(200);
		expect(await read('slides/old.html/+page.svelte')).toBe(OLD_PAGE);
		expect(await read('slides/pages.ts')).toContain('{ path: "old.html", title: "Renamed", adjust: true },');
	});

	it('refuses a rename onto an existing folder, changing nothing', async () => {
		const r = await post(handlePageRename, { deck: 'slides', path: 'old.html', newPath: 'title.html', title: 'X' });
		expect(r.status).toBe(409);
		expect(await read('slides/pages.ts')).toBe(PAGES);
		expect(await gone('slides/old.html')).toBe(false);
	});

	it('lists who links to a slide', async () => {
		const r = await handlePageRefs(server(), '/__geekpresent/page-refs?deck=slides&path=old.html');
		expect((r.payload as { refs: { file: string }[] }).refs.map((x) => x.file).sort()).toEqual([
			'src/routes/other/a.html/+page.svelte',
			'src/routes/slides/title.html/+page.svelte'
		]);
	});

	it('unlist keeps the folder; delete removes it and reports the links left behind', async () => {
		const unlisted = await post(handlePageRemove, { deck: 'slides', path: 'old.html' });
		expect(unlisted.status).toBe(200);
		expect(await gone('slides/old.html')).toBe(false);
		expect(await read('slides/pages.ts')).not.toContain('old.html');

		await writeFile(f('slides/pages.ts'), PAGES);
		const deleted = await post(handlePageRemove, { deck: 'slides', path: 'old.html', deleteFiles: true });
		expect(deleted.status).toBe(200);
		expect(await gone('slides/old.html')).toBe(true);
		expect((deleted.payload as { refs: unknown[] }).refs.length).toBe(2);
	});
});
