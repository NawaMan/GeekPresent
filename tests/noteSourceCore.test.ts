import { describe, expect, it } from 'vitest';
import {
	fingerprint,
	fromEditable,
	locateNote,
	readNote,
	toEditable,
	writeNote
} from '../src/lib/note/noteSourceCore';

// The slide shape the console edits: a script, a sample of <Note> inside a QuickCode
// string (which must NOT count), and the one real note, indented by a tab.
const SLIDE = `<script>
	import Note from '$lib/components/Note.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
</script>

<QuickCode code={\`<Note>
  <p>sample</p>
</Note>\`} />

<Note>
	<p>First point.</p>
	<li data-highlight="db">Then the <b>database</b>.</li>
</Note>
`;

describe('locateNote', () => {
	it('finds the real note and ignores a sample inside a string', () => {
		const at = locateNote(SLIDE);
		expect(at.ok).toBe(true);
		if (!at.ok) return;
		expect(SLIDE.slice(at.start, at.end)).toContain('First point.');
		expect(SLIDE.slice(at.start, at.end)).not.toContain('sample');
	});

	it('refuses a slide with no note', () => {
		expect(locateNote('<p>hi</p>')).toEqual({ ok: false, reason: 'none' });
	});

	it('refuses a slide with two notes', () => {
		expect(locateNote('<Note>a</Note>\n<Note>b</Note>')).toEqual({ ok: false, reason: 'many' });
	});

	it('refuses a self-closing note', () => {
		expect(locateNote('<Note />')).toEqual({ ok: false, reason: 'self-closing' });
	});

	it('refuses a file that does not parse', () => {
		expect(locateNote('<Note></div></Note>')).toEqual({ ok: false, reason: 'unparsable' });
	});

	it('finds a note inside an {#if} block and past a `>` in an attribute expression', () => {
		const src = '{#if true}<Note class={1 > 0 ? "a" : "b"}>x</Note>{/if}';
		const at = locateNote(src);
		expect(at.ok && src.slice(at.start, at.end)).toBe('x');
	});
});

describe('toEditable / fromEditable', () => {
	it('strips the shared indentation and puts it back', () => {
		const inner = '\n\t<p>a</p>\n\t\t<p>b</p>\n';
		const body = toEditable(inner);
		expect(body.text).toBe('<p>a</p>\n\t<p>b</p>');
		expect(fromEditable(body.text, body)).toBe(inner);
	});

	it('keeps blank lines blank and drops trailing whitespace', () => {
		const body = toEditable('\n\t<p>a</p>\n');
		expect(fromEditable('<p>a</p>\n\n<p>b</p>\n\n', body)).toBe('\n\t<p>a</p>\n\n\t<p>b</p>\n');
	});

	it('gives a one-line note a frame once it spans lines', () => {
		const body = toEditable('a');
		expect(fromEditable('a', body)).toBe('a');
		expect(fromEditable('a\nb', body)).toBe('\na\nb\n');
	});
});

describe('readNote / writeNote', () => {
	it('hands out the dedented body', () => {
		expect(readNote(SLIDE)).toEqual({
			ok: true,
			text: '<p>First point.</p>\n<li data-highlight="db">Then the <b>database</b>.</li>'
		});
	});

	it('splices an edit back, leaving everything else byte-for-byte', () => {
		const r = writeNote(SLIDE, '<p>Changed.</p>\n<p>Added.</p>');
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.source).toBe(
			SLIDE.replace(
				'\t<p>First point.</p>\n\t<li data-highlight="db">Then the <b>database</b>.</li>',
				'\t<p>Changed.</p>\n\t<p>Added.</p>'
			)
		);
	});

	it('round-trips an unchanged body to the identical file', () => {
		const text = (readNote(SLIDE) as { text: string }).text;
		expect(writeNote(SLIDE, text)).toEqual({ ok: true, source: SLIDE });
	});

	it('refuses an edit that would break the slide', () => {
		expect(writeNote(SLIDE, '<p>a</p></div>')).toEqual({ ok: false, reason: 'broken' });
		expect(writeNote(SLIDE, '</Note><Note>')).toEqual({ ok: false, reason: 'broken' });
		expect(writeNote(SLIDE, '{oops')).toEqual({ ok: false, reason: 'broken' });
	});
});

describe('fingerprint', () => {
	it('is stable and changes with the content', () => {
		expect(fingerprint('abc')).toBe(fingerprint('abc'));
		expect(fingerprint('abc')).not.toBe(fingerprint('abd'));
		expect(fingerprint('')).toMatch(/^[0-9a-f]{8}$/);
	});
});
