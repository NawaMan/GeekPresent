import { describe, expect, it } from 'vitest';
import {
	stripToText,
	buildDeckIndex,
	snippetAround,
	searchDocs
} from '$lib/utils/searchCore';

describe('stripToText', () => {
	it('keeps prose and drops the tags around it', () => {
		expect(stripToText('<h1>Backpressure</h1><p>flows <b>upstream</b></p>')).toBe(
			'Backpressure flows upstream'
		);
	});

	it('removes <script> blocks whole, so imports are not searched', () => {
		const src = `<script>import Foo from './Foo.svelte';<\/script><p>real words</p>`;
		expect(stripToText(src)).toBe('real words');
	});

	it('removes <style> blocks whole', () => {
		expect(stripToText('<style>.a{color:red}</style><p>hi</p>')).toBe('hi');
	});

	it('drops Svelte mustaches and HTML comments', () => {
		expect(stripToText('<!-- note --><p>count {n} done</p>')).toBe('count done');
	});

	it('decodes the entities prose actually uses', () => {
		expect(stripToText('<p>a &amp; b &lt; c &gt; d &quot;e&quot; &#39;f&#39;</p>')).toBe(
			`a & b < c > d "e" 'f'`
		);
	});

	it('keeps the text inside a <Note> — a speaker can find their own note', () => {
		expect(stripToText('<p>slide</p><Note>remember the demo</Note>')).toBe(
			'slide remember the demo'
		);
	});

	it('is total: a non-string is empty', () => {
		expect(stripToText(undefined)).toBe('');
		expect(stripToText(null)).toBe('');
		expect(stripToText(42)).toBe('');
	});
});

describe('buildDeckIndex', () => {
	const modules = {
		'/src/routes/slides/title.html/+page.svelte': '<h1>The Title</h1>',
		'/src/routes/slides/intro.html/+page.svelte': '<p>about backpressure</p>',
		'/src/routes/other/title.html/+page.svelte': '<p>a different deck</p>'
	};

	it('keys stripped text by deck then path', () => {
		const idx = buildDeckIndex(modules);
		expect(idx.slides['title.html']).toBe('The Title');
		expect(idx.slides['intro.html']).toBe('about backpressure');
		expect(idx.other['title.html']).toBe('a different deck');
	});

	it('keeps same-named slides in different decks apart', () => {
		const idx = buildDeckIndex(modules);
		expect(idx.slides['title.html']).not.toBe(idx.other['title.html']);
	});

	it('is total on empty / missing input', () => {
		expect(buildDeckIndex({})).toEqual({});
		// @ts-expect-error exercising the total guard
		expect(buildDeckIndex(undefined)).toEqual({});
	});
});

describe('snippetAround', () => {
	it('windows the text around the first match with ellipses', () => {
		const text = 'x'.repeat(100) + 'NEEDLE' + 'y'.repeat(100);
		const snip = snippetAround(text, 'needle', 10);
		expect(snip.startsWith('…')).toBe(true);
		expect(snip.endsWith('…')).toBe(true);
		expect(snip).toContain('NEEDLE');
	});

	it('omits the leading ellipsis when the match is at the start', () => {
		expect(snippetAround('needle then more', 'needle', 4).startsWith('…')).toBe(false);
	});

	it('is empty when the needle is absent or blank', () => {
		expect(snippetAround('hello', 'zzz')).toBe('');
		expect(snippetAround('hello', '')).toBe('');
	});
});

describe('searchDocs', () => {
	const docs = [
		{ path: 'a.html', title: 'Intro', text: 'we discuss backpressure at length' },
		{ path: 'b.html', title: 'Backpressure Deep Dive', text: 'buffers and drops' },
		{ path: 'c.html', title: 'Wrap Up', text: 'thanks for watching' }
	];

	it('matches the body case-insensitively and carries a snippet', () => {
		const hits = searchDocs(docs, 'BACKPRESSURE');
		expect(hits.map((h) => h.path)).toEqual(['a.html', 'b.html']);
		const bodyHit = hits.find((h) => h.path === 'a.html')!;
		expect(bodyHit.where).toBe('body');
		expect(bodyHit.snippet).toContain('backpressure');
	});

	it('marks a title match as such and gives it no snippet', () => {
		const hit = searchDocs(docs, 'deep dive')[0];
		expect(hit.path).toBe('b.html');
		expect(hit.where).toBe('title');
		expect(hit.snippet).toBe('');
	});

	it('returns hits in deck order', () => {
		expect(searchDocs(docs, 'a').map((h) => h.path)).toEqual(['a.html', 'b.html', 'c.html']);
	});

	it('returns nothing for an empty or whitespace query (full list shown instead)', () => {
		expect(searchDocs(docs, '')).toEqual([]);
		expect(searchDocs(docs, '   ')).toEqual([]);
	});

	it('is total: junk docs and missing fields do not throw', () => {
		const junk = [
			null,
			{ path: 'x.html', title: undefined, text: undefined },
			{ path: 'y.html', title: 'ok', text: 'has needle here' }
		] as never;
		const hits = searchDocs(junk, 'needle');
		expect(hits.map((h) => h.path)).toEqual(['y.html']);
	});
});
