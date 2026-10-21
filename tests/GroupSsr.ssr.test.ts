// @vitest-environment node
//
// Group through svelte/server: a mapped member must be in the prerendered HTML
// at its CANVAS position (built deck HTML never shows slide markup, so this is
// the honest surface — see the deck-tests skill). A `view` or literal `focus`
// is exact here; a NAMED camera resolves once its target mounts, so on the
// server it renders with the placement frame — pinned below so a change to that
// is a decision, not an accident.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import GroupHost from './GroupHost.svelte';

describe('Group (SSR)', () => {
	it('prerenders placed members at their mapped canvas boxes', () => {
		const { body } = render(GroupHost, { props: { x: 100, y: 50, scale: 2 } });
		expect(body).toContain('left:300px; top:250px; width:400px; height:200px;');
		expect(body).toContain('transform:scale(2)');
	});

	it('prerenders a view camera exactly', () => {
		const { body } = render(GroupHost, { props: { view: { x: 100, y: 100, width: 192, height: 108 } } });
		expect(body).toContain('left:0px; top:0px; width:2000px; height:1000px;');
	});

	it('a named camera falls back to the placement on the server', () => {
		const { body } = render(GroupHost, { props: { focus: 'b', zoom: 2 } });
		expect(body).toContain('left:100px; top:100px; width:200px; height:100px;');
	});

	it('leaves a Block outside any group exactly as before', () => {
		const { body } = render(GroupHost, { props: { scale: 3 } });
		expect(body).toContain('left:10px; top:20px; width:30px; height:40px;');
	});
});
