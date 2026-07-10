<!--
  Example: QRCode component
  File: src/routes/slides/qrcode-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import QRCode      from '$lib/components/QRCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/qrcode-component.html/+page.svelte';

	const url = 'https://github.com/NawaMan/GeekPresent';

	// The same URL at each level. More error correction means more codewords, which
	// means a larger symbol — the trade the audience pays for in module size.
	/** @type {Array<{ ecc: import('$lib/utils/qrCore').Ecc, survives: string }>} */
	const levels = [
		{ ecc: 'L', survives: '~7%' },
		{ ecc: 'M', survives: '~15%' },
		{ ecc: 'Q', survives: '~25%' },
		{ ecc: 'H', survives: '~30%' },
	];
</script>

<ContentPage title="QRCode" subtitle="A scannable link, encoded on the slide">
	<div style="max-width: 760px;">
		<p>
			The symbol is computed here, not fetched: <code>utils/qrCore.ts</code> is a
			from-scratch encoder, so a QR is a <b>pure function of its text</b>. Change the
			URL, the code changes — no <code>qrencode</code> binary, no PNG to commit.
		</p>
		<p style="margin-top: 0.6em;">
			It draws as <b>SVG</b>, so it stays crisp at whatever size the projector
			scales the canvas to, and it is computed where it renders — <b>nothing is
			fetched</b>, so there is nothing to fail in a room with bad wifi.
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. -->
<Block name="usage" x={940} y={230} width={880} height={220} grid={10} fill={false}>
	<QuickCode>
		&lt;QRCode value="https://geekpresent.dev" label="Slides" /&gt;<br/>
		&lt;QRCode value={'{'}url{'}'} ecc="H" size={'{'}300{'}'} /&gt;
	</QuickCode>
</Block>

<!-- The hero: a real, scannable code. Block fills its content, and an <svg> keeps its
     aspect ratio, so resizing the box letterboxes the symbol rather than skewing it. -->
<Block name="hero" x={120} y={560} width={360} height={400} grid={10}>
	<QRCode value={url} label="GeekPresent on GitHub" size={280} />
</Block>

<!-- One URL, four error-correction levels: the symbol grows as the redundancy does. -->
<Block name="levels" x={560} y={560} width={1260} height={400} grid={10}>
	<div class="levels">
		{#each levels as { ecc, survives }}
			<figure class="level">
				<QRCode value={url} {ecc} size={190} link={false} />
				<figcaption>
					<b>{ecc}</b>
					<span>survives {survives}</span>
				</figcaption>
			</figure>
		{/each}
	</div>
</Block>

<Hint text="Scan any of them — all four encode the same URL" />

<ViewSource {source} {path} />

<style>
	.levels {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5em;
		height: 100%;
	}
	.level {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6em;
		margin: 0;
	}
	.level figcaption {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1.3;
	}
	.level b {
		font-size: 1.3em;
	}
	.level span {
		font-size: 0.85em;
		opacity: 0.6;
	}
</style>
