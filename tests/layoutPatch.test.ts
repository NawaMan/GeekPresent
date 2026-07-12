import { describe, expect, it } from 'vitest';
import { patchSlideSource, type LayoutChange } from '$lib/layout/patchSource';

const change = (over: Partial<LayoutChange> = {}): LayoutChange => ({
	kind: 'Block',
	name: undefined,
	before: { x: 100, y: 200, width: 300, height: 400 },
	after: { x: 111, y: 222, width: 333, height: 444 },
	...over
});

describe('patchSlideSource', () => {
	it('rewrites geometry in a single-line tag matched by name', () => {
		const src = `<Block name="hero" x={100} y={200} width={300} height={400}>\n  <h2>hi</h2>\n</Block>`;
		const { source, patched, unmatched } = patchSlideSource(src, [change({ name: 'hero' })]);
		expect(unmatched).toHaveLength(0);
		expect(patched).toHaveLength(1);
		expect(source).toContain('<Block name="hero" x={111} y={222} width={333} height={444}>');
	});

	it('preserves multi-line layout and other attributes', () => {
		const src = [
			'<Block',
			'  name="card"',
			'  grid={10}',
			'  x={100}',
			'  y={200}',
			'  width={300}',
			'  height={400}',
			'  bounds="none"',
			'>'
		].join('\n');
		const { source } = patchSlideSource(src, [change({ name: 'card' })]);
		expect(source).toContain('grid={10}');
		expect(source).toContain('bounds="none"');
		expect(source).toContain('x={111}');
		expect(source).toContain('height={444}');
		// Structure kept (still multi-line).
		expect(source.split('\n')).toHaveLength(9);
	});

	it('falls back to old geometry when there is no name', () => {
		const src = `<Block x={100} y={200} width={300} height={400}><p/></Block>`;
		const { source, patched } = patchSlideSource(src, [change()]);
		expect(patched).toHaveLength(1);
		expect(source).toBe(`<Block x={111} y={222} width={333} height={444}><p/></Block>`);
	});

	it('only touches the tag it matched, not siblings of the same kind', () => {
		const src =
			`<Block name="a" x={100} y={200} width={300} height={400}></Block>\n` +
			`<Block name="b" x={10} y={20} width={30} height={40}></Block>`;
		const { source } = patchSlideSource(src, [change({ name: 'a' })]);
		expect(source).toContain('<Block name="b" x={10} y={20} width={30} height={40}>');
		expect(source).toContain('<Block name="a" x={111} y={222} width={333} height={444}>');
	});

	it('refuses a tag whose twin is a code sample of ITSELF — name and geometry both match', () => {
		// A slide that documents a Block often shows the tag in a <QuickCode> sample
		// living in the SAME file. patchSlideSource scans the raw source, so a sample
		// that spells out name AND x/y/width/height is indistinguishable from the real
		// tag: two candidates, both perfect. Guessing would rewrite the SAMPLE (and
		// silently lose the author's drag), so the change comes back unmatched instead.
		// This is why every Block sample in the deck elides its geometry with `…`.
		const src = [
			'<QuickCode lang="svelte" code={`',
			'<Block name="pinned" x={100} y={200} width={300} height={400} />`} />',
			'',
			'<Block name="pinned" x={100} y={200} width={300} height={400}>real</Block>'
		].join('\n');
		const { source, patched, unmatched } = patchSlideSource(src, [change({ name: 'pinned' })]);
		expect(patched).toHaveLength(0);
		expect(unmatched).toHaveLength(1);
		expect(source).toBe(src); // nothing written — and above all, the SAMPLE is untouched
	});

	it('places the real tag when the code sample elides its geometry (the house convention)', () => {
		const src = [
			'<QuickCode lang="svelte" code={`',
			'<Block name="pinned" … style="left: 40px" />`} />',
			'',
			'<Block name="pinned" x={100} y={200} width={300} height={400}>real</Block>'
		].join('\n');
		const { source, patched, unmatched } = patchSlideSource(src, [change({ name: 'pinned' })]);
		expect(unmatched).toHaveLength(0);
		expect(patched).toHaveLength(1);
		expect(source).toContain('<Block name="pinned" x={111} y={222} width={333} height={444}>real</Block>');
		expect(source).toContain('<Block name="pinned" … style="left: 40px" />'); // sample untouched
	});

	it('reports unmatched changes instead of guessing', () => {
		const src = `<Block name="hero" x={100} y={200} width={300} height={400}></Block>`;
		const { unmatched, patched } = patchSlideSource(src, [change({ name: 'ghost' })]);
		expect(patched).toHaveLength(0);
		expect(unmatched).toHaveLength(1);
	});

	it('does not confuse ImageBlock with Block', () => {
		const src =
			`<Block name="x" x={100} y={200} width={300} height={400}></Block>\n` +
			`<ImageBlock name="x" x={100} y={200} width={300} height={400} />`;
		const { source } = patchSlideSource(src, [
			change({ kind: 'ImageBlock', name: 'x' })
		]);
		// Block untouched, ImageBlock patched.
		expect(source).toContain('<Block name="x" x={100} y={200} width={300} height={400}>');
		expect(source).toContain('<ImageBlock name="x" x={111} y={222} width={333} height={444} />');
	});

	it('inserts a geometry attribute that was absent from the tag', () => {
		const src = `<Block name="p" x={100} y={200} width={300} />`;
		// height missing on the tag; before matches on the three present attrs is not
		// enough (geomMatches needs all four) so match by name only.
		const { source, patched } = patchSlideSource(src, [
			change({ name: 'p', before: { x: 100, y: 200, width: 300, height: 0 } })
		]);
		expect(patched).toHaveLength(1);
		expect(source).toContain('height={444}');
		expect(source).toContain('<Block name="p" x={111} y={222} width={333} height={444} />');
	});

	it('applies a literal old→new tag swap for a Draw shape (Curve)', () => {
		const src =
			`<Curve name="hop" from={[900, 1010]} to={[1143, 992]} c1={[874, 844]} arrow="end" />\n` +
			`<Line name="x" from={[1, 2]} to={[3, 4]} />`;
		const oldTag = `<Curve name="hop" from={[900, 1010]} to={[1143, 992]} c1={[874, 844]} arrow="end" />`;
		const newTag = `<Curve name="hop" from={[900, 1010]} to={[1200, 950]} c1={[850, 800]} arrow="end" />`;
		const { source, patched, unmatched } = patchSlideSource(src, [
			{ kind: 'Curve', name: 'hop', oldTag, newTag }
		]);
		expect(unmatched).toHaveLength(0);
		expect(patched).toHaveLength(1);
		expect(source).toContain(newTag);
		expect(source).toContain('<Line name="x" from={[1, 2]} to={[3, 4]} />');
	});

	it('reports a literal change whose old tag is not in source', () => {
		const src = `<Curve name="hop" from={[1, 1]} to={[2, 2]} c1={[3, 3]} />`;
		const { patched, unmatched } = patchSlideSource(src, [
			{ kind: 'Curve', oldTag: `<Curve name="ghost" from={[9, 9]} to={[8, 8]} c1={[7, 7]} />`, newTag: `<Curve name="ghost" from={[0, 0]} to={[8, 8]} c1={[7, 7]} />` }
		]);
		expect(patched).toHaveLength(0);
		expect(unmatched).toHaveLength(1);
	});

	it('mixes a geometry Block change and a literal shape change', () => {
		const src =
			`<Block name="client" x={180} y={700} width={320} height={140}></Block>\n` +
			`<Curve name="hop" from={[900, 1010]} to={[1143, 992]} c1={[874, 844]} />`;
		const { source, patched } = patchSlideSource(src, [
			change({ name: 'client', before: { x: 180, y: 700, width: 320, height: 140 }, after: { x: 200, y: 720, width: 320, height: 140 } }),
			{ kind: 'Curve', name: 'hop', oldTag: `<Curve name="hop" from={[900, 1010]} to={[1143, 992]} c1={[874, 844]} />`, newTag: `<Curve name="hop" from={[905, 1000]} to={[1143, 992]} c1={[874, 844]} />` }
		]);
		expect(patched).toHaveLength(2);
		expect(source).toContain('<Block name="client" x={200} y={720} width={320} height={140}>');
		expect(source).toContain('<Curve name="hop" from={[905, 1000]} to={[1143, 992]} c1={[874, 844]} />');
	});

	it('inserts z only when the new value is non-zero', () => {
		const src = `<Block name="hero" x={100} y={200} width={300} height={400}></Block>`;
		const { source } = patchSlideSource(src, [
			change({ name: 'hero', after: { x: 111, y: 222, width: 333, height: 444, z: 3 } })
		]);
		expect(source).toContain('<Block name="hero" x={111} y={222} width={333} height={444} z={3}>');
	});

	it('never inserts z={0} — a default-layer Block stays clean', () => {
		const src = `<Block name="hero" x={100} y={200} width={300} height={400}></Block>`;
		const { source } = patchSlideSource(src, [
			change({ name: 'hero', after: { x: 111, y: 222, width: 333, height: 444, z: 0 } })
		]);
		expect(source).toContain('<Block name="hero" x={111} y={222} width={333} height={444}>');
		expect(source).not.toContain('z={');
	});

	it('rewrites an existing z in place — including back down to 0', () => {
		const src = `<Block name="hero" x={100} y={200} width={300} height={400} z={5}></Block>`;
		const { source } = patchSlideSource(src, [
			change({ name: 'hero', before: { x: 100, y: 200, width: 300, height: 400, z: 5 }, after: { x: 100, y: 200, width: 300, height: 400, z: 0 } })
		]);
		expect(source).toContain('<Block name="hero" x={100} y={200} width={300} height={400} z={0}>');
	});

	it('leaves the source untouched when nothing (including z) changed', () => {
		const src = `<Block name="hero" x={100} y={200} width={300} height={400} z={2}></Block>`;
		const { source, patched } = patchSlideSource(src, [
			change({ name: 'hero', before: { x: 100, y: 200, width: 300, height: 400, z: 2 }, after: { x: 100, y: 200, width: 300, height: 400, z: 2 } })
		]);
		expect(patched).toHaveLength(1); // matched, nothing to write
		expect(source).toBe(src);
	});

	it('applies several changes across the file', () => {
		const src =
			`<Block name="a" x={100} y={200} width={300} height={400}></Block>\n` +
			`<ImageBlock name="pic" x={5} y={6} width={7} height={8} />`;
		const { source, patched } = patchSlideSource(src, [
			change({ name: 'a' }),
			change({
				kind: 'ImageBlock',
				name: 'pic',
				before: { x: 5, y: 6, width: 7, height: 8 },
				after: { x: 50, y: 60, width: 70, height: 80 }
			})
		]);
		expect(patched).toHaveLength(2);
		expect(source).toContain('<Block name="a" x={111} y={222} width={333} height={444}>');
		expect(source).toContain('<ImageBlock name="pic" x={50} y={60} width={70} height={80} />');
	});

	// Every component now takes `style` / `id` / `class`, and LAYOUT knows nothing about
	// them — which is precisely why they are worth pinning here. SAVE is a surgical
	// rewrite of the geometry attributes ONLY, so a decorated tag must come out the far
	// side still decorated. (COPY is the other, blunter path: it emits a whole tag, which
	// is why draw/editing.ts has to emit these too — see drawEditingTag.test.ts.)
	it('leaves the author’s style, id and class untouched while moving the box', () => {
		const src = `<Block name="hero" id="hero-box" class="hot" style="opacity: 0.4" x={100} y={200} width={300} height={400}>\n</Block>`;
		const { source, unmatched } = patchSlideSource(src, [change({ name: 'hero' })]);

		expect(unmatched).toHaveLength(0);
		expect(source).toContain('id="hero-box"');
		expect(source).toContain('class="hot"');
		expect(source).toContain('style="opacity: 0.4"');
		expect(source).toContain('x={111} y={222} width={333} height={444}');
	});

	// A style can carry the very characters the patcher scans for — braces. It must not
	// mistake `style="--f: {x}"` for a geometry expression, nor corrupt it.
	it('is not confused by braces inside a style value', () => {
		const src = `<Rect name="api" style="width: calc(100% - 4px)" x={100} y={200} width={300} height={400} />`;
		const { source, unmatched } = patchSlideSource(src, [change({ kind: 'Rect', name: 'api' })]);

		expect(unmatched).toHaveLength(0);
		expect(source).toContain('style="width: calc(100% - 4px)"');
		expect(source).toContain('x={111} y={222} width={333} height={444}');
	});
});
