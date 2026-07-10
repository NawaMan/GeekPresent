<!--
  PROTOTYPE: Sprite-as-group — a <Sprite> wrapping a NESTED <Draw>.

  The question this stress-tests: can an HTML div (Sprite's animated box) act as
  a coordinate base + transform carrier for a whole cluster of Draw shapes, so
  the cluster flies / rotates / scales as ONE unit?

  How it works: Sprite renders its children inside a <foreignObject> → <div>
  that carries the animated left/top/width/height/rotate. A <Draw> is an <svg>,
  and an <svg> is valid inside foreignObject HTML — so we drop a full little
  diagram (frame Rect, arrow Line, node Ellipse, a raw dot) authored in LOCAL
  coordinates (0..600 × 0..360) into the Sprite. The whole badge then translates
  and banks across the canvas as a rigid unit on the AnimationBar timeline.

  What this proves / the caveats it confirms — see the notes on the slide.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Line, Rect, Ellipse, Sprite } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/sprite-group.html/+page.svelte';
</script>

<ContentPage
	title="Draw — Sprite as Group"
	subtitle="A whole diagram, authored in local coords inside a nested Draw, flies and banks as one rigid unit"
>
	<div style="line-height: 1.4em; font-size: 0.8em">
		<p>
			The <Label>Sprite</Label> renders its children in a transformable HTML box,
			and a <Label>Draw</Label> is just an <code>&lt;svg&gt;</code> — so nesting one
			inside the other turns the Sprite into a <b>group container</b>. The badge
			below (frame <Label>Rect</Label>, arrow <Label>Line</Label>, node
			<Label>Ellipse</Label>, a raw dot) is authored once in <b>local</b>
			coordinates (0…600 × 0…360); the Sprite flies and <b>banks</b> the entire
			cluster as a rigid unit on <b>one</b> AnimationBar. The <Label>Rect</Label>
			rides along too — its editing chrome now lives <i>inside</i> the transformed
			div, which is exactly why the div-as-group idea works where an SVG
			<code>&lt;g&gt;</code> could not. And the inner arrow carries its
			<b>own keyframes on the same progress</b> as the flight
			(<code>animate=&#123;4&#125;</code>, stop percents lined up with the
			Sprite's) — so as the badge flies 0→50→100%, the arrow <b>extends in
			lockstep</b> on <b>one</b> AnimationBar, because
			<code>getAnimations(&#123;subtree:true&#125;)</code> scrubs both finite
			animations through the foreignObject and the nested svg together.
		</p>
		<p style="margin-top: 0.5em;">
			<b>Editing the shapes inside</b> — the Sprite makes its content
			pointer-inert, and a rotated box breaks the drag math. So in <b>LAYOUT</b>,
			<b>double-click</b> the badge: it <b>freezes in place and straightens</b>
			to rot&nbsp;0 (isolation mode), and its nested shapes become directly
			selectable with the ordinary Draw handles + toolbar — because upright at
			deck scale the nested svg is identical to a standalone Draw. Tune the
			connector, <b>Copy</b>, then <b>Esc</b> — or <b>click outside the
			group</b> — to leave isolation and resume the flight (which also closes
			the inner dialog). The nested Draw only shows its chrome while isolated,
			so nothing lingers on the flying badge.
		</p>
		<QuickCode style="margin-top: 0.4em;" lang="svelte" code={`<Sprite name="badge" animate={4} stops={[…]}>
  <Draw width={600} height={360} decorative>
    <Line arrow="end" animate={4} stops={[…same %s as the flight…]} …/>
    …
  </Draw>
</Sprite>`} />
	</div>
</ContentPage>

<Draw
	title="A diagram badge flying and banking across the canvas as one rigid group"
	name="group"
	description="A rounded card holding an arrow and a node ellipse — authored in its own local coordinate space inside a nested Draw — is carried by a Sprite across three keyframe stops as a single unit, translating and rotating together."
>
	<!-- The group: a Sprite whose children are a WHOLE nested Draw. Box size is
	     held constant across stops so the cluster translates + rotates rigidly
	     (see the notes re: scaling). -->
	<Sprite
		name="badge"
		group
		animate={4}
		origin="50% 50%"
		stops={[
			{ pct: 0, x: 60, y: 620, w: 600, h: 360, rot: -8, ease: 'ease-in' },
			{ pct: 50, x: 700, y: 170, w: 600, h: 360, rot: 12 },
			{ pct: 100, x: 1260, y: 560, w: 600, h: 360, rot: -4, ease: 'ease-out' }
		]}
	>
		<!-- LOCAL coordinate space: 0..600 × 0..360. decorative → no title needed
		     (the outer Draw describes the whole thing). -->
		<Draw width={600} height={360} decorative>
			<Rect x={8} y={8} width={584} height={344} rounded={28} thickness={5} color="#2980b9" />
			<!-- Inner keyframes on the SAME progress as the flight: animate={4}
			     matches the Sprite's animate={4}, and the stop percents line up
			     with the flight's stops — so as the badge flies 0→50→100%, the
			     arrow extends in lockstep on the one AnimationBar. Both are finite
			     4s CSS animations; getAnimations({subtree:true}) scrubs them
			     together. In isolation you can drag each of these stops. -->
			<Line
				name="flow"
				from={[70, 165]}
				to={[130, 165]}
				arrow="end"
				thickness={7}
				color="#f39c12"
				labelText="req"
				stops={[
					{ pct: 0, to: [130, 165] },
					{ pct: 50, to: [240, 165] },
					{ pct: 100, to: [350, 165] }
				]}
				animate={4}
			/>
			<Ellipse x={400} y={110} width={110} height={110} thickness={5} color="#00b356" />
			<!-- raw SVG escape hatch: a dot at the node's centre -->
			<circle cx="455" cy="165" r="12" fill="#00b356" />
		</Draw>
	</Sprite>
</Draw>

<!-- One control for the whole group's flight — the Sprite's transform keyframes
     are ordinary CSS, so the bar scrubs the badge along its path. -->
<AnimationBar highlight />

<ViewSource {source} {path} />
