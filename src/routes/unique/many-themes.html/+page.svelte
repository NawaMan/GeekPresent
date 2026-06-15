<!--
  Unique #5: Many independent presentations, each self-themed + portable output
  File: src/routes/unique/many-themes.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Many decks, each walled off" subtitle="Scoped styles and separate themes — so nothing leaks or rots">
	<p>
		A big reason this framework exists: in other tools, global styles pile up and
		eventually <b>collide</b> &mdash; a tweak on slide 30 silently breaks slide 3.
		Here that can't happen.
	</p>
	<ul style="margin-top: 0.4em;">
		<li>
			<b>Styles are scoped per slide.</b> Svelte hashes each slide's (and each
			component's) <code>&lt;style&gt;</code> to itself, so CSS <b>never leaks</b> to its
			neighbours. Sharing is opt-in (<code>:global()</code> or <code>$lib/styles</code>),
			never accidental.
		</li>
		<li>
			<b>Each presentation is its own world.</b> Its own theme, fonts, background,
			and favicon &mdash; and its own nav / ToC scope
			(<code>setPages</code> / <code>getPages</code>), not one global config.
		</li>
		<li>
			<b>Sibling decks don't touch each other.</b> Add a new presentation and the
			existing ones don't change &mdash; and the output stays portable (relative
			asset paths run anywhere).
		</li>
	</ul>
	<p style="margin-top: 0.6em;">
		Same components, separate worlds:
		<a href="../../portrait/title.html" style="color: #7fd9ff;">GeekPortrait (1080&times;1920) &rarr;</a>
		&nbsp;&middot;&nbsp;
		<a href="../../geeklight/title.html" style="color: #7fd9ff;">GeekLight (light theme) &rarr;</a>
	</p>
</ContentPage>
