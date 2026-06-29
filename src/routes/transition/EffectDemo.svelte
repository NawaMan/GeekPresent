<!--
  EffectDemo — an IN-PAGE re-creation of a transition effect, for the "(from)"
  slides. Two cards (A = leaving, B = arriving) play the same motion the page's
  view-transition performs, but as ordinary in-page @keyframes on real elements —
  so the deck's AnimationBar can pause/scrub/restart it.

  This is deliberately SEPARATE from the actual page transition (which lives on the
  ::view-transition pseudo-element tree and is out of AnimationBar's reach): the
  point is to let a viewer step THROUGH the effect frame by frame, then press → to
  watch the real thing run at speed.

  All variants are finite (~2.4s, fill `both`) so the whole motion is seekable.
-->
<script lang="ts">
	/** Which effect to mimic — matches the page's transition kind. */
	export let kind: 'fade' | 'slide' | 'zoom' | 'flip' | 'reveal' | 'morph' = 'fade';
</script>

<div class="stage {kind}" aria-hidden="true">
	<div class="card a"><span>A</span></div>
	<div class="card b"><span>B</span></div>
</div>

<style>
	/* Parked low-centre on the canvas: above the AnimationBar / nav row, below the
	   centred TransitionFrom content. */
	.stage {
		position: absolute;
		left: 50%;
		bottom: 150px;
		transform: translateX(-50%);
		width: 13em;
		height: 7.3em;
		perspective: 900px;
		/* A little "viewport" the effect plays inside: the frame, and overflow:hidden
		   so a card sliding/zooming past the edge is clipped by it (just like a real
		   slide leaving the screen) instead of spilling across the canvas. */
		border: 2px solid rgba(255, 255, 255, 0.5);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
	}
	.card {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Fill the viewport flush; the stage's rounded frame does the corner clipping. */
		border-radius: 0;
		font-size: 2.6em;
		font-weight: bold;
		backface-visibility: hidden;
	}
	.card.a { background: #6EE7A0; color: #06210F; }
	/* B starts on top of A (later in DOM); each effect decides how it enters. */
	.card.b { background: #2FA85F; color: #EAFFF2; }

	/* ── fade ── A dissolves out, B dissolves in. */
	.fade .a { animation: fx-fade-out 2.4s ease both; }
	.fade .b { animation: fx-fade-in  2.4s ease both; }
	@keyframes fx-fade-out { to   { opacity: 0; } }
	@keyframes fx-fade-in  { from { opacity: 0; } }

	/* ── slide ── A exits left, B enters from the right. */
	.slide .a { animation: fx-slide-out 2.4s ease both; }
	.slide .b { animation: fx-slide-in  2.4s ease both; }
	@keyframes fx-slide-out { to   { transform: translateX(-110%); opacity: 0.25; } }
	@keyframes fx-slide-in  { from { transform: translateX(110%);  opacity: 0.25; } }

	/* ── zoom ── A blooms out, B grows in. */
	.zoom .a { animation: fx-zoom-out 2.4s ease both; }
	.zoom .b { animation: fx-zoom-in  2.4s ease both; }
	@keyframes fx-zoom-out { to   { transform: scale(1.4);  opacity: 0; } }
	@keyframes fx-zoom-in  { from { transform: scale(0.6);  opacity: 0; } }

	/* ── flip ── staged: A swings out, then B swings in. */
	.flip .a { animation: fx-flip-out 1.2s ease both; }
	.flip .b { animation: fx-flip-in  1.2s ease 1.2s both; }
	@keyframes fx-flip-out { to   { transform: rotateY(90deg);  } }
	@keyframes fx-flip-in  { from { transform: rotateY(-90deg); } }

	/* ── reveal ── B irises in over A. */
	.reveal .b { animation: fx-reveal 2.4s ease both; }
	@keyframes fx-reveal {
		from { clip-path: circle(0%  at 50% 50%); }
		to   { clip-path: circle(80% at 50% 50%); }
	}

	/* ── morph ── ONE box (no second card) that glides corner-to-corner AND reshapes:
	   a square parked top-left becomes a circle parked bottom-right. Scrubbing walks
	   it across — the shared-element idea, in-page. */
	.morph .b { display: none; }
	.morph .a {
		inset: auto;            /* drop the fill; size & place it as a small box (px so
		                           it stays small regardless of the card's font scale) */
		width: 84px;
		height: 84px;
		font-size: 30px;
		animation: fx-morph 2.4s ease both;
	}
	@keyframes fx-morph {
		/* round → square, mirroring the page's own round-to-square morph. */
		from { top: 0;                 left: 0;                 border-radius: 50%; background: #6EE7A0; }
		to   { top: calc(100% - 84px); left: calc(100% - 84px); border-radius: 10px; background: #2FA85F; }
	}
</style>
