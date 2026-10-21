// @vitest-environment node
//
// animation/scene-camera.html through svelte/server: it must survive a server
// render (the handout prerenders every slide), and the first shot — the whole
// drawing at 1:1 — must be in the HTML, with the build's later shots not yet.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Slide from '../src/routes/animation/scene-camera.html/+page.svelte';

describe('scene-camera slide (SSR)', () => {
	it('prerenders the wide shot, every part at its authored box', () => {
		const { body } = render(Slide, { props: {} });
		expect(body).toContain('left:620px; top:380px; width:340px; height:220px;'); // api
		expect(body).toContain('left:1160px; top:420px; width:340px; height:220px;'); // db
		expect(body).toContain('Scene camera — press Space');
	});

	it('starts with the replica hidden; the glide arms only in the browser, after the first paint', () => {
		const { body } = render(Slide, { props: {} });
		expect(body).toMatch(/class="movable[^"]*concealed[^"]*"[^>]*left:1580px/);
		expect(body).not.toContain('--gp-glide');
	});
});
