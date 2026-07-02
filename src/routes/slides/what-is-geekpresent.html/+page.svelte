<!--
  Example: Content Page - Introduction
  File: src/routes/slides/what-is-geekpresent.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="What is GeekPresent?" subtitle="A SvelteKit-based presentation framework">
	<ul>
		<li><b>SvelteKit</b> static site &mdash; each slide is a route</li>
		<li><b>1920x1080</b> fixed canvas that scales to fit any screen</li>
		<li><b>Keyboard navigation</b> with arrow keys</li>
		<li><b>Table of Contents</b> sidebar (top-left button)</li>
		<li><b>Speaker notes</b> below the slide in SCALED mode (zoomed out)</li>
		<li>Deploys to <b>GitHub Pages</b> as a static site</li>
		<li><b>Keyboard shortcuts</b>
		<table style="width: 100%; border-collapse: collapse; margin-top: 0.4em; line-height: 1.6em;">
			<tbody>
				<tr style="border-bottom: 1px solid #444;">
					<td style="padding: 0.2em 1em; width: 6em; white-space: nowrap;"><b>Arrow Left</b></td>
					<td>Previous slide</td>
				</tr>
				<tr style="border-bottom: 1px solid #444;">
					<td style="padding: 0.2em 1em; white-space: nowrap;"><b>Arrow Right</b></td>
					<td>Next slide</td>
				</tr>
				<tr>
					<td style="padding: 0.2em 1em; white-space: nowrap;"><b>Escape</b></td>
					<td>Close Table of Contents / Box</td>
				</tr>
			</tbody>
		</table>
		</li>
	</ul>
</ContentPage>
