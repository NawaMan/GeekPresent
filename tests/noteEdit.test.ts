// The NOTE EDIT endpoints, driven against a temp project (as sourceTag.test.ts does
// for ADJUST): load hands out the note, save splices it back, and every refusal
// leaves the file untouched.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import type { ViteDevServer } from 'vite';
import { handleNoteLoad, handleNoteSave } from '../src/lib/adjust/devSavePlugin';

const ROUTE = '/deck/one.html';
const SLIDE = '<h1>One</h1>\n\n<Note>\n\t<p>Say hello.</p>\n</Note>\n';

describe('note-load / note-save', () => {
	let root: string;
	const server = () => ({ config: { root, base: '/' } }) as unknown as ViteDevServer;
	const page = () => path.join(root, 'src/routes/deck/one.html/+page.svelte');
	const load = () => handleNoteLoad(server(), `/__geekpresent/note-load?route=${encodeURIComponent(ROUTE)}`);
	const save = (text: string, fingerprint: string) =>
		handleNoteSave(server(), JSON.stringify({ route: ROUTE, text, fingerprint }));

	beforeEach(async () => {
		root = await mkdtemp(path.join(tmpdir(), 'gp-note-'));
		await mkdir(path.dirname(page()), { recursive: true });
		await writeFile(page(), SLIDE);
	});
	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	it('loads the dedented note and saves an edit back into the slide', async () => {
		const loaded = await load();
		expect(loaded.status).toBe(200);
		const { text, fingerprint } = loaded.payload as { text: string; fingerprint: string };
		expect(text).toBe('<p>Say hello.</p>');

		const saved = await save('<p>Say hello.</p>\n<p>Then wave.</p>', fingerprint);
		expect(saved.status).toBe(200);
		expect(await readFile(page(), 'utf8')).toBe(
			'<h1>One</h1>\n\n<Note>\n\t<p>Say hello.</p>\n\t<p>Then wave.</p>\n</Note>\n'
		);
	});

	it('refuses a save when the file changed since load', async () => {
		const { fingerprint } = (await load()).payload as { fingerprint: string };
		await writeFile(page(), SLIDE.replace('One', 'Uno'));
		const saved = await save('<p>mine</p>', fingerprint);
		expect(saved.status).toBe(409);
		expect((saved.payload as { reason: string }).reason).toBe('conflict');
		expect(await readFile(page(), 'utf8')).toContain('Say hello.');
	});

	it('refuses an edit that would break the slide, writing nothing', async () => {
		const { fingerprint } = (await load()).payload as { fingerprint: string };
		const saved = await save('<p>a</p></div>', fingerprint);
		expect(saved.status).toBe(409);
		expect((saved.payload as { reason: string }).reason).toBe('broken');
		expect(await readFile(page(), 'utf8')).toBe(SLIDE);
	});

	it('explains a slide without a note', async () => {
		await writeFile(page(), '<h1>One</h1>\n');
		const loaded = await load();
		expect(loaded.status).toBe(409);
		expect((loaded.payload as { error: string }).error).toMatch(/no <Note>/);
	});

	it('refuses a route outside the routes tree', async () => {
		const r = await handleNoteLoad(server(), '/__geekpresent/note-load?route=%2F..%2Fsecret');
		expect(r.status).toBe(400);
	});
});
