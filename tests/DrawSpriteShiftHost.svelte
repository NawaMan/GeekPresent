<!-- Host for the Shift-drag tests on a Sprite's keyframe-stop handles. Kept
     deliberately plain next to DrawSpriteHost: EVEN, whole-pixel boxes so a
     box center is an integer and an aligned leg compares exactly, equal sizes
     so "same top" means "same center y", and every stop at rot 0 so a single
     rotate(<n>deg) in the generated keyframes is unambiguous. -->
<script lang="ts">
	import Draw from '../src/lib/draw/Draw.svelte';
	import Sprite from '../src/lib/draw/Sprite.svelte';
</script>

<Draw title="Sprite shift host">
	<Sprite
		name="glider"
		animate={2}
		stops={[
			{ pct: 0, x: 100, y: 100, w: 100, h: 100 },
			{ pct: 50, x: 600, y: 500, w: 100, h: 100 },
			{ pct: 100, x: 1200, y: 900, w: 100, h: 100 }
		]}>GLIDER</Sprite
	>
</Draw>
