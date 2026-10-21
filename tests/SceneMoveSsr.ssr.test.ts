// @vitest-environment node
//
// animation/scene-move.html → scene-moved.html: one shared scene, DB moved on
// Space and left there. Through svelte/server, the slide that moves it prerenders
// DB at its drawn spot, and the slide after draws it at the moved one.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Move from '../src/routes/animation/scene-move.html/+page.svelte';
import Moved from '../src/routes/animation/scene-moved.html/+page.svelte';

const db = (x: number) => `left:${x}px; top:600px; width:260px; height:140px;`;

describe('scene-move / scene-moved (SSR)', () => {
	it('the moving slide starts with DB where it is drawn', () => {
		const { body } = render(Move, { props: {} });
		expect(body).toContain(db(1120));
		expect(body).not.toContain(db(1600));
	});

	it('the next slide draws DB where the move left it', () => {
		const { body } = render(Moved, { props: {} });
		expect(body).toContain(db(1600));
		expect(body).toContain('left:1120px; top:380px;'); // cache never moved
	});
});
