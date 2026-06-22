<!--
  Scaling calibration target — src/routes/tests/calibration.html/+page.svelte

  A full-canvas (1920x1080) target for verifying the SlideDeck VIEW scale
  (adjustSize in SlideDeck.svelte) is pixel-accurate and undistorted. Capture
  this slide and measure it in an image editor (e.g. GIMP):

    - the magenta 10px frame should sit exactly at the canvas edge, INSIDE the
      thin ~1.5px grey deck frame, and be uniform thickness on all four sides;
    - the cyan diagonals must meet exactly at the four corners (no clip / offset);
    - the target's outer rectangle must measure 16:9 (1920:1080), no stretch;
    - captured 10px-border / captured target-width should equal 10 / 1920.

  Markers are drawn in canvas coordinates (SVG viewBox 0 0 1920 1080) and the
  SVG uses the DEFAULT preserveAspectRatio (xMidYMid meet) ON PURPOSE: if the
  scaled box is not 16:9 the SVG letterboxes and the X stops reaching the
  corners, so non-uniform scaling shows up as a visible error.

  The target is position:absolute inset:0, so it fills the .content padding box
  (== the 1920x1080 canvas in fill mode) regardless of the slot's 15px padding.
-->
<script lang="ts">
	import NavigationBar from '$lib/components/NavigationBar.svelte';
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

		<!-- 100px reference bar: captured length / captured target-width = 100 / 1920 -->
		<rect x="910" y="700" width="100" height="16" fill="#FF8A00" />
		<text x="960" y="752" fill="#FF8A00" font-size="22" text-anchor="middle" font-family="monospace">100 px</text>

		<!-- corner coordinate labels -->
		<text x="30"   y="48"   fill="#FFFFFF" font-size="24" font-family="monospace">0,0</text>
		<text x="1890" y="48"   fill="#FFFFFF" font-size="24" font-family="monospace" text-anchor="end">1920,0</text>
		<text x="30"   y="1058" fill="#FFFFFF" font-size="24" font-family="monospace">0,1080</text>
		<text x="1890" y="1058" fill="#FFFFFF" font-size="24" font-family="monospace" text-anchor="end">1920,1080</text>

		<!-- title -->
		<text x="960" y="300" fill="#FFFFFF" font-size="40" text-anchor="middle" font-family="monospace">1920 × 1080 — calibration</text>
		<text x="960" y="345" fill="#9AA0A6" font-size="22" text-anchor="middle" font-family="monospace">magenta 10px frame hugs the edge · X must hit the corners</text>
	</svg>

	<!-- 10px frame, a distinct colour from the deck's ~1.5px grey frame, at the canvas edge -->
	<div class="frame"></div>
</div>

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
		overflow: hidden;
	}
	.calib svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.calib .frame {
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		border: 10px solid #FF00AA;
		pointer-events: none;
	}
</style>
