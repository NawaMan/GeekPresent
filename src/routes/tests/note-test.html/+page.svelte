<!--
  Note test — src/routes/tests/note-test.html/+page.svelte

  Same full-canvas target as calibration.html, but with a <Note> attached, so the
  speaker-note behaviour can be tested: switch to SCALED mode and zoom out below
  the fit — the beige note appears below the slide. In FITTED mode it is hidden.
-->
<script lang="ts">
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import Note from '$lib/components/Note.svelte';
	import { getPageNavigation, type PageNavigation } from '$lib/utils/navigate';
	import { getPages } from '$lib/presentation';
	import { page } from '$app/stores';

	const pages = getPages();
	let navigation: PageNavigation;
	$: navigation = getPageNavigation(pages, $page.url.pathname.split('/').pop() || '', './');
</script>

<div class="calib">
	<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
		<!-- corner-to-corner X -->
		<line x1="0" y1="0" x2="1920" y2="1080" stroke="#00E5FF" stroke-width="3" />
		<line x1="1920" y1="0" x2="0" y2="1080" stroke="#00E5FF" stroke-width="3" />

		<!-- quarter grid -->
		<g stroke="#2E7D32" stroke-width="1" opacity="0.85">
			<line x1="480"  y1="0" x2="480"  y2="1080" />
			<line x1="960"  y1="0" x2="960"  y2="1080" />
			<line x1="1440" y1="0" x2="1440" y2="1080" />
			<line x1="0" y1="270" x2="1920" y2="270" />
			<line x1="0" y1="540" x2="1920" y2="540" />
			<line x1="0" y1="810" x2="1920" y2="810" />
		</g>

		<!-- centre crosshair -->
		<g stroke="#FFD400" stroke-width="3">
			<line x1="860" y1="540" x2="1060" y2="540" />
			<line x1="960" y1="440" x2="960"  y2="640" />
		</g>
		<circle cx="960" cy="540" r="6" fill="#FFD400" />

		<!-- title -->
		<text x="960" y="300" fill="#FFFFFF" font-size="40" text-anchor="middle" font-family="monospace">1920 × 1080 — note test</text>
		<text x="960" y="345" fill="#9AA0A6" font-size="22" text-anchor="middle" font-family="monospace">SCALED + zoom out below the fit → the note appears below</text>

		<!-- corner coordinate labels -->
		<text x="30"   y="48"   fill="#FFFFFF" font-size="24" font-family="monospace">0,0</text>
		<text x="1890" y="48"   fill="#FFFFFF" font-size="24" font-family="monospace" text-anchor="end">1920,0</text>
		<text x="30"   y="1058" fill="#FFFFFF" font-size="24" font-family="monospace">0,1080</text>
		<text x="1890" y="1058" fill="#FFFFFF" font-size="24" font-family="monospace" text-anchor="end">1920,1080</text>

		<!-- red endpoint dots (8px diameter at 1:1): mark exactly where each diagonal
		     stops; centered on the corner and allowed to straddle the edge (see
		     overflow:visible on .calib / svg) so the full circle shows. -->
		<circle cx="0"    cy="0"    r="4" fill="#FF0000" />
		<circle cx="1920" cy="0"    r="4" fill="#FF0000" />
		<circle cx="0"    cy="1080" r="4" fill="#FF0000" />
		<circle cx="1920" cy="1080" r="4" fill="#FF0000" />
	</svg>

	<!-- 10px frame, a distinct colour from the deck's ~1.5px grey frame, at the canvas
	     edge. Drawn BENEATH the svg (z-index) so the cyan X + endpoint dots sit on top. -->
	<div class="frame"></div>
</div>

<Note>
	<p>This is a speaker note. It sits below the slide in SCALED mode.</p>
	<p>Zoom out below the fit and it becomes visible; in FITTED mode it is hidden.</p>
	<p>Use it to verify the note renders, scrolls, and stays aligned under the canvas.</p>
</Note>

<NavigationBar
	firstLink={navigation.first}
	prevLink={navigation.prev}
	nextLink={navigation.next}
	lastLink={navigation.last}
/>

<style>
	.calib {
		position: absolute;
		inset: 0;
		background: #101418;
		/* visible so the corner dots can straddle the canvas edge (full circle shows) */
		overflow: visible;
	}
	.calib svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		overflow: visible; /* let corner dots paint past the viewBox bounds */
		z-index: 2; /* above .frame, so the cyan X + dots paint over the magenta border */
	}
	.calib .frame {
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		border: 10px solid #FF00AA;
		pointer-events: none;
		z-index: 1;
	}
</style>
