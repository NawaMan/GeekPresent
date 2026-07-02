<!-- Host for Sprite editing tests: a Draw surface with one flying Sprite
     (three stops, a rotation + easing flourish) so the LAYOUT-mode ghosts,
     handles and keyframe panel have something to drive. -->
<script lang="ts">
	import Draw from '../src/lib/draw/Draw.svelte';
	import Sprite from '../src/lib/draw/Sprite.svelte';
</script>

<Draw title="Sprite host">
	<Sprite
		name="rocket"
		animate={2.5}
		fontScale={0.84}
		stops={[
			{ pct: 0, x: 100, y: 800, w: 56, h: 56, rot: 20, ease: 'ease-in' },
			{ pct: 50, x: 900, y: 400, w: 140, h: 135, rot: 26 },
			{ pct: 100, x: 1500, y: 430, w: 228, h: 219, rot: -45, ease: 'ease-out' }
		]}
	>ROCKET</Sprite>
</Draw>
