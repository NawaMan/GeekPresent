<script>
	import TransitionFrom from '../TransitionFrom.svelte';
	import SourceView     from '$lib/components/SourceView.svelte';
	import EffectDemo     from '../EffectDemo.svelte';
	import source         from './+page.svelte?raw';

	const css = `@view-transition {
  navigation: auto;
}

::view-transition-old(root) {
  animation: 700ms ease both fade-out;
}
::view-transition-new(root) {
  animation: 700ms ease both fade-in;
}

@keyframes fade-out { to   { opacity: 0; } }
@keyframes fade-in  { from { opacity: 0; } }`;
</script>

<TransitionFrom
	title="Cross-Fade (from)"
	subtitle="The default — one at-rule, no JavaScript"
	code={css}
	action="cross-fade to the next page"
	forward="both slides cross-fade — this one dissolves out as the next dissolves in."
	back="the same dissolve, reversed (a cross-fade looks identical either way)."
>
	With <code>navigation: auto</code> the browser does the dissolve for free.
</TransitionFrom>

<!-- In-page re-creation of THIS slide's effect, controllable by the deck's
     AnimationBar. Scrub the cross-fade by hand, then press → for the real one. -->
<EffectDemo kind="fade" />

<SourceView {source} />
