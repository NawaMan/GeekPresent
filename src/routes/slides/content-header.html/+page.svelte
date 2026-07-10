<!--
  Example: ContentPage's optional header
  File: src/routes/slides/content-header.html/+page.svelte

  This slide IS the demo: its own header is centered and has no subtitle, so the
  rule sits right under the title instead of leaving an empty span's margins.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Callout     from '$lib/components/Callout.svelte';
</script>

<ContentPage title="The ContentPage Header" align="center">
	<p>
		The header has three parts &mdash; <b>title</b>, <b>subtitle</b> and the <b>rule</b>
		beneath them &mdash; and each is independently omittable. Whatever survives closes
		the gap. This slide passes no subtitle, so the rule rode up under the title.
	</p>
	<QuickCode style="margin-top: 0.5em;">
		&lt;ContentPage title="Centered" align="center"&gt;      &lt;!-- no subtitle --&gt;<br/>
		&lt;ContentPage title="Just a title" rule=&#123;false&#125;&gt;   &lt;!-- no rule    --&gt;<br/>
		&lt;ContentPage rule=&#123;false&#125;&gt;                       &lt;!-- no header   --&gt;
	</QuickCode>
	<p style="margin-top: 0.6em;">
		Props: <code>title</code>, <code>subtitle</code>, <code>rule</code> (default
		<code>true</code>), <code>align</code> (<code>left</code> default, or <code>center</code>).
		<code>align</code> moves the header only &mdash; the content stays justified.
	</p>
	<Callout kind="tip" title="Theming">
		Sizes, spacing and the rule&rsquo;s weight come from <code>roles.css</code> role tokens
		(<code>--page-title-size</code>, <code>--page-rule-weight</code>, &hellip;), so a theme
		can restyle every header without touching a slide.
	</Callout>
</ContentPage>
