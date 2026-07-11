<!--
  SlideDeck — the reusable shell for a Presentation artifact.

  A Presentation is many discrete, fixed-size slide pages. This component is the
  whole canvas: it draws a fixed width x height box and shows it in one of two
  display modes (see $lib/stores/displayMode):
    - FITTED: scale the box to fit the window, preserving aspect (present mode).
    - SCALED: show the box at an exact factor (1 = native px), centred and
      pannable when it overflows the window (inspect mode), with a minimap.
  It also mounts the slide chrome (Table of Contents, display-mode control,
  copyright). The slides themselves flow in via the default <slot/>.

  Orientation lives HERE, set by a deck's +layout.svelte through the width/height
  props — never a runtime toggle. A landscape deck wraps its <slot/> in
  <SlideDeck width={1920} height={1080}>; a portrait deck (e.g. a YouTube Short)
  uses <SlideDeck width={1080} height={1920}>. Each slide's layout is authored
  for its deck's fixed dimension, so a deck is landscape OR portrait, full stop.

  Note: the deck's +layout.svelte must still call setPages(pages) itself — the
  slotted slide content is lexically owned by the layout, so it reads the
  layout's context, not this component's. `pages` is passed here only for the
  Table of Contents rendered inside this shell.
-->
<script lang="ts">
	import '$lib/styles/global.css';
	import '$lib/styles/note.css';
	import '$lib/styles/presentation.css';
	import '$lib/styles/tooltip.css';

	import Copyright      from '$lib/components/Copyright.svelte';
	import TableOfContent from '$lib/components/TableOfContent.svelte';
	import SizeMode       from '$lib/components/SizeMode.svelte';
	import SlideMap       from '$lib/components/SlideMap.svelte';
	import CtrlBtn        from '$lib/components/CtrlBtn.svelte';
	import PresenterView  from '$lib/components/PresenterView.svelte';
	import Seo            from '$lib/components/Seo.svelte';
	import { SITE_DESCRIPTION } from '$lib/seo/config';

	import { browser }    from '$app/environment';
	import { page }       from '$app/stores';
	import { onMount } from 'svelte';
	import { displayMode, displayFactor, clampFactor } from '$lib/stores/displayMode';
	import type { DisplayMode } from '$lib/stores/displayMode';
	import { layoutMode, canLayout, canSave, setLayoutOffered, applyLayoutParam } from '$lib/stores/layoutMode';
	import { saveLayout } from '$lib/stores/layoutSave';
	import { getViewTransitions } from '$lib/presentation';
	import {
		presenterMode, publishCurrentSlide, subscribeCurrentSlide, subscribeAnimCommand,
		subscribeContinue, subscribeHighlight, deckKeyFromPath, openPresenterWindow
	} from '$lib/stores/presenter';
	import Spotlight from '$lib/components/Spotlight.svelte';
	import { setHighlight } from '$lib/stores/highlightTarget';
	import { collectFinite, applyState } from '$lib/utils/slideAnim';
	import { navigate } from '$lib/utils/deckNav';
	import { documentTitle, getPageNavigation } from '$lib/utils/navigate';
	import type { Page }  from '$lib/utils/navigate';

	/** This deck's slide list — for the Table of Contents rendered in the shell. */
	export let pages: Array<Page> = [];
	/** Presentation-level document title (the deck name) — the <title> counterpart
	    to the presentation favicon a +layout.svelte sets. Composed with the current
	    slide's own `title` into the browser-tab <title>; falls back to the site
	    default (SITE_TITLE) when left undefined. */
	export let title: string | undefined = undefined;
	/** Presentation-level SEO description, used for every slide that doesn't set its
	    own in pages.ts. Defaults to the site description. */
	export let description: string = SITE_DESCRIPTION;
	/** Presentation-level social/OG image (absolute URL or site-relative path), used
	    for slides without their own. Undefined falls back to the site-default image. */
	export let image: string | undefined = undefined;
	/** Presentation-level alt text for the social image, used for slides without
	    their own. Undefined falls back to the default card alt (see Seo). */
	export let imageAlt: string | undefined = undefined;
	/** Canvas size in px. Landscape: 1920x1080. Portrait (Tall): 1080x1920. */
	export let width  = 1920;
	export let height = 1080;
	/* Base font-size lever: every em-based size in the reused components scales
	   from here in one place. The landscape canvas grew x1.5 from the original
	   1280x720, hence 1.5em; a narrower portrait canvas wants a smaller base. */
	export let baseFontSize = '1.5em';
	/* Optional extra classes for the outer frame — the hook a deck uses to opt into
	   a theme. Pass "gp-deck theme-green" (and import themes.css + roles.css in the
	   deck's +layout.svelte) to recolour the whole canvas via the role tokens. Left
	   empty by default, so existing decks render exactly as before. */
	export let deckClass = '';
	/* Exact-fit mode. When false (the landscape default) the content box keeps its
	   legacy slack (+20 width / -30 height / 15 padding) — values hand-tuned for the
	   1920 canvas, whose wider-than-frame aspect leaves a small symmetric letterbox.
	   That gap is a tiny fraction at 1920 but visible on the much smaller portrait
	   render, so a Tall opts into fill=true: the content box IS the canvas
	   (border-box, no slack), so it shares the frame's aspect exactly and fills it
	   edge to edge. Either way the FITTED view scale (adjustSize) is an exact
	   Math.min fit, so content always sits inside the frame border. */
	export let fill = false;
	/* Optional per-deck overrides for the content surface — for themed decks (e.g.
	   GeekLight) that want a custom background (a watercolor image) or font while
	   reusing all the canvas/scaling machinery. Undefined keeps the standard dark
	   surface + Noto Sans. Passed through as CSS vars the .content rule falls back on. */
	export let contentBackground: string | undefined = undefined;
	export let contentFont: string | undefined = undefined;

	/* Show the TOC's extra link (article view, "back to home", …). Off by default —
	   only decks that want it should enable it. `articleText`/`articleHref` customise
	   the label and target (href is relative to the current slide URL). */
	export let article = false;
	export let articleText = 'View as article';
	export let articleHref = '../text.html';

	/* Fade the deck's own controls (NAV, TOC, DISPLAY/minimap, LAYOUT) down to a
	   ghost until the pointer reaches them, so the slide — not the chrome — is what
	   the audience looks at. Especially wanted where the chrome sits over someone
	   else's pixels (a full-canvas WebPage). Opt-in: a deck that says nothing keeps
	   the controls at full strength.

	   The controls keep their full hit area while faded (opacity, not visibility),
	   and any that are OPEN or PINNED stay lit — you can't hunt for a menu you are
	   already using. Touch devices have no hover to reveal with, so the fade is
	   disabled there outright. */
	export let fadeChrome = false;

	/* Offer the LAYOUT authoring control on EVERY slide of this deck, even in a build.
	   Almost no deck wants this — LAYOUT is off in production by default, and the usual
	   way to demo it is per-slide: set `layout: true` on the individual pages.ts entries
	   for the slides that actually teach it (see Page.layout), which is what the /slides
	   deck does. This deck-wide switch exists for the rare deck that is ENTIRELY about
	   authoring.

	   Either way it makes LAYOUT *available*, not *active*: the mode still starts off, so
	   the audience sees a normal slide until the speaker flips it. `vite dev` offers the
	   control regardless, and a sticky `?layout=off` outranks both (layout/layoutAccessCore). */
	export let layout = false;

	let viewport:  HTMLElement;
	let container: HTMLElement;
	let content:   HTMLElement;

	let mode: DisplayMode = $displayMode;
	let factor = clampFactor($displayFactor);
	let initialized = false;
	// On-screen scale of the slide content set by adjustSize() (the FITTED fit factor,
	// or the SCALED zoom factor), exposed to the content as --view-scale for any chrome
	// that needs to counter the slide transform. (DISPLAY no longer uses it — it's a
	// viewport control now, sized independently of the slide.)
	let viewScale = 1;
	$: isFitted = mode === 'FITTED';
	$: aspectRatio = width / height;

	// Minimap state (SCALED only): which slice of the slide is currently on screen,
	// as fractions of the scaled slide. Recomputed on scroll / resize / mode change.
	let mapVisible = false;
	let mapRect = { left: 0, top: 0, width: 1, height: 1 };
	const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

	// DISPLAY now attaches to the VIEWPORT's top-right corner (see SizeMode) — a
	// window control, reachable no matter how the slide is scaled or panned — so there
	// is nothing frame-relative to recompute here. The authoring LAYOUT/PRESENT cluster
	// lives ON the slide (.content, canvas space) and rides the slide's own transform.
	// updateOverlay is kept as the minimap's recompute hook.
	function updateOverlay() {
		updateMap();
	}

	// Page-level favicon. The shell renders at SSR (only the slide *content* below
	// is gated on onMount), so emitting the current slide's favicon HERE puts it in
	// the prerendered HTML — no flicker, works without JS. Last <link rel="icon">
	// wins, so a slide's favicon (declared in its pages.ts entry) overrides both the
	// site default (app.html) and any presentation favicon set in the deck's layout.
	$: currentSlide   = $page.url.pathname.replace(/\/+$/, '').split('/').pop();
	$: currentIndex   = pages.findIndex((p) => p.path === currentSlide);
	$: currentFavicon = pages.find((p) => p.path === currentSlide)?.favicon;
	// `?clean` hides all shell chrome (ToC, display-mode control, copyright, nav bar,
	// minimap) for an unobstructed screen capture — e.g. the /tests calibration
	// target. `browser &&` short-circuits so url.searchParams is never read during
	// prerender (SvelteKit forbids it — a prerendered page can't vary by query
	// string). Client hydration re-evaluates with browser=true and picks up ?clean.
	$: clean = browser && $page.url.searchParams.has('clean');
	// `?present` turns THIS window into the presenter console (see stores/presenter
	// + PresenterView). Browser-guarded like `?clean`, so it never affects SSR /
	// prerender output. presenterMode (the store <Note> and NavigationBar read) is
	// kept in step with it.
	$: present = browser && $page.url.searchParams.has('present');
	$: presenterMode.set(present);
	// Cross-window sync: whoever navigates publishes the new slide path; the other
	// window follows. deckKey namespaces it per deck so /slides/ and /portrait/
	// consoles never cross-drive. This deck's paging strategy is read once for the
	// follower to navigate exactly like a click.
	const viewTransitions = getViewTransitions();
	$: deckKey = browser ? deckKeyFromPath($page.url.pathname) : '/';
	// Only the TOP window syncs. The presenter console renders the next slide in an
	// <iframe> (a full deck instance); without this guard that iframe would publish
	// ITS slide to the shared channel and drag every window onto the preview slide.
	$: isTopWindow = browser && window.self === window.top;
	$: if (isTopWindow && currentSlide) publishCurrentSlide(deckKey, currentSlide);
	// Does THIS slide offer LAYOUT? Its own pages.ts `layout` flag, or the deck-wide
	// `layout` prop. Re-runs on every slide change, so paging off a LAYOUT demo onto an
	// ordinary slide takes the control away again. The sticky `?layout` flag outranks
	// both (layout/layoutAccessCore). Browser-guarded so url.searchParams is never read
	// during prerender.
	$: slideOffersLayout = pages.find((p) => p.path === currentSlide)?.layout === true;
	$: layoutOffered = slideOffersLayout || layout;
	$: if (browser) setLayoutOffered(layoutOffered);
	$: if (browser) applyLayoutParam($page.url);

	// On a slide that INVITES you to use LAYOUT, the button is the SUBJECT, not backstage
	// machinery — so it wears the featured look (filled warm pill) instead of receding
	// into the chrome like its neighbours. Not when the control merely happens to be
	// around (dev, or a sticky `?layout` the speaker set three slides ago): there it's a
	// tool, and a tool that shouts on every slide is just noise.
	$: featureLayoutBtn = layoutOffered;
	// …and it pulses only until it is USED. Once LAYOUT is on, the button has done its
	// job of being found: it drops to CtrlBtn's ordinary selected-green and stops calling
	// for attention, so the thing the audience now watches is the slide, not the chrome.
	// The pill geometry is kept in BOTH states, so toggling it doesn't jiggle the row.
	$: callLayoutBtn = layoutOffered && !$layoutMode;

	// "Save" writes the slide's moved Blocks back to source. It only reaches a source
	// tree under `vite dev` (the endpoint lives in the dev server — see
	// layout/devSavePlugin); on a static host there is nothing to rewrite.
	//
	// The button looks and behaves like a NORMAL control either way — no pre-emptive
	// greying-out. Where it can't fire, it says so ON CLICK: the label flips to
	// NOT ALLOWED and a tooltip explains that saving isn't allowed in this setup. That
	// ordering is the whole point of a LAYOUT demo. A button disabled from the start
	// invites the audience to assume the feature is missing or broken; a button that
	// answers when pressed teaches them that saving is *refused here*, and why — the
	// deck is static, and there is no source tree behind it to rewrite.
	//
	// `$canSave` is a store (not `import.meta.env.DEV` inline) precisely so this refusal
	// path survives into the build instead of being compiled away.
	//
	// Either way the button's OWN label carries the outcome (SAVE → SAVED / NONE / ERROR
	// / NOT ALLOWED) and then reverts, so there's no extra chrome. Detail (which tags
	// didn't land, any error) goes to the console.
	let saveLabel = 'SAVE';
	let saveRefused = false;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	function flashSave(label: string, ms: number) {
		saveLabel = label;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			saveLabel = 'SAVE';
			saveRefused = false;
		}, ms);
	}

	async function onSave() {
		if (!$canSave) {
			// Held longer than a normal outcome flash: this one has a tooltip to read,
			// and it's the beat the demo is built around.
			saveRefused = true;
			flashSave('NOT ALLOWED', 2600);
			return;
		}
		const r = await saveLayout();
		if (!r.ok) {
			flashSave('ERROR', 1600);
			console.error('[layout save] failed:', r.error);
		} else if (r.patched === 0 && r.unmatched.length === 0) {
			flashSave('NONE', 1600);
		} else {
			flashSave('SAVED', 1600);
			if (r.unmatched.length)
				console.warn('[layout save] not written — Copy these by hand:', r.unmatched);
		}
	}
	// Open (or focus) the presenter console at the current slide. Moved here from the
	// nav bar so PRESENT sits with LAYOUT in the slide's top-right chrome cluster.
	// Runs in the click handler (a user gesture) so the popup isn't blocked.
	function openPresenter() {
		openPresenterWindow(window.location.href, deckKeyFromPath(window.location.pathname));
	}
	// Page-level document title, same cascade idea as the favicon above but emitted
	// as ONE <title> (the browser uses the FIRST <title>, so it can't stack the way
	// the favicon links do): the current slide's own `title` from pages.ts, composed
	// with this deck's `title` prop into "Slide — Deck". See documentTitle.
	$: currentTitle   = pages.find((p) => p.path === currentSlide)?.title;
	$: docTitle       = documentTitle(currentTitle, title);
	// SEO description/image cascade: the current slide's own pages.ts value, else
	// the deck-level default. Emitted (with title/canonical/og/twitter) by <Seo>.
	$: currentDescription = pages.find((p) => p.path === currentSlide)?.description ?? description;
	$: currentImage       = pages.find((p) => p.path === currentSlide)?.image ?? image;
	$: currentImageAlt    = pages.find((p) => p.path === currentSlide)?.imageAlt ?? imageAlt;

	// Recompute the minimap's "you are here" rectangle from the live scroll position.
	// Only meaningful in SCALED when the scaled slide overflows the viewport (else
	// there is nothing to pan, so the map is hidden).
	function updateMap() {
		if (!viewport || !container || mode !== 'SCALED' || clean) { mapVisible = false; return; }
		const vw = viewport.clientWidth,  vh = viewport.clientHeight;
		const sw = container.offsetWidth,  sh = container.offsetHeight;
		mapVisible = sw > vw + 1 || sh > vh + 1;
		if (!mapVisible) return;
		mapRect = {
			left:   clamp01(viewport.scrollLeft / sw),
			top:    clamp01(viewport.scrollTop  / sh),
			width:  clamp01(vw / sw),
			height: clamp01(vh / sh),
		};
	}

	// Park the scroll so the slide starts centred when it overflows (zoom-in). Pairs
	// with `safe center` on .viewport, which otherwise start-aligns an overflowing
	// child (top-left) — reachable, but jarring as an entry point.
	function centerScroll() {
		if (!viewport || !container) return;
		viewport.scrollLeft = Math.max(0, (container.offsetWidth  - viewport.clientWidth)  / 2);
		viewport.scrollTop  = Math.max(0, (container.offsetHeight - viewport.clientHeight) / 2);
	}

	function adjustSize(recenter = false) {
		if (!container) return;
		// Presenter mode hides the canvas and never scales it — a scale transform on
		// .content would also make the fixed <Note> panel a transformed containing
		// block (fixed would then track .content, not the viewport). So: no transform.
		if (present) return;

		if (mode === 'SCALED') {
			// Exact factor: the frame is the canvas at `factor`, the content scales by
			// the same factor from its top-left so the two stay flush. The .viewport
			// scrolls/pans when this overflows the window.
			container.style.width  = `${Math.round(width  * factor)}px`;
			container.style.height = `${Math.round(height * factor)}px`;
			content.style.transform = `scale(${factor})`;
			content.style.transformOrigin = 'top left';
			viewScale = factor;
			// Expose the fit factor to canvas-space chrome (the LAYOUT/SAVE row) so it
			// can counter-scale its screen inset to match the screen-fixed MODE control.
			content.style.setProperty('--view-scale', String(factor));
			if (recenter) centerScroll();
			updateOverlay();
			return;
		}

		// FITTED — fit the canvas to the window by aspect. Size the cross axis from the
		// INNER box (client*, excludes the 1.5px border), NOT the border-box (offset*):
		// the scale below divides by client*, so using offset* would leave the inner
		// box ~(3px * aspect) larger than the scaled content — a thin black gap between
		// the content and the frame on the non-binding axis. client* makes the inner
		// box a true `aspect` rectangle, so the content fills it flush on both axes.
		const windowRatio = window.innerWidth / window.innerHeight;
		if (windowRatio > aspectRatio) {
			container.style.height = 'calc(100vh - 10px)';
			container.style.width  = `${Math.round(container.clientHeight * aspectRatio)}px`;
		} else {
			container.style.width  = 'calc(100vw - 10px)';
			container.style.height = `${Math.round(container.clientWidth / aspectRatio)}px`;
		}
		// Exact fit: scale the content's TRUE border-box down to the container's INNER
		// box by whichever axis binds. Math.min guarantees no overflow on either axis,
		// so the frame border stays visible all around and content sits inside. The box
		// is the full canvas in fill mode; otherwise it carries the legacy slack (width
		// +20 + 2x15 padding = width + 50; height nets back to the canvas height).
		const boxW = fill ? width : width + 50;
		const boxH = height;
		const scale = Math.min(container.clientWidth / boxW, container.clientHeight / boxH);
		content.style.transform = `scale(${scale})`;
		content.style.transformOrigin = 'center center';
		viewScale = scale;
		content.style.setProperty('--view-scale', String(scale));
		updateOverlay();
	}

	// Wrap a re-layout in the body.rendering class (suppresses paint of half-applied
	// styles); recenter only on a mode/factor change, never on a resize mid-pan.
	function apply(recenter: boolean) {
		document.body.classList.add('rendering');
		adjustSize(recenter);
		document.body.classList.remove('rendering');
	}

	onMount(() => {
		if (!browser) return;
		const unsubMode   = displayMode.subscribe(v   => { mode = v;                  if (initialized) apply(true); });
		const unsubFactor = displayFactor.subscribe(v => { factor = clampFactor(v);   if (initialized) apply(true); });
		const onResize = () => adjustSize(false);
		window.addEventListener('resize', onResize);

		// Follow the OTHER window: when it announces a different slide, page there.
		// Guard on `path !== currentSlide` (our own echo / already-here) so the
		// two-window ping-pong converges. Route through the shared navigate() so a
		// followed hop animates like a clicked one; keep the console's ?present flag.
		// Skipped in an iframe preview (window.top !== self) — see isTopWindow above.
		const stopFollow = (window.self === window.top)
			? subscribeCurrentSlide(deckKey, (path) => {
				if (!path || path === currentSlide) return;
				const target = present ? `./${path}?present` : `./${path}`;
				const targetIndex = pages.findIndex((p) => p.path === path);
				const direction = targetIndex >= 0 && targetIndex < (currentIndex ?? 0) ? 'back' : 'forward';
				const leaving = pages.find((p) => p.path === currentSlide);
				const kind = (direction === 'back' ? leaving?.transitionBack : leaving?.transition) ?? 'slide';
				navigate(target, { viewTransitions, kind, direction });
			})
			: () => {};

		// Apply relayed ANIMATE commands from the presenter console onto this window's
		// live slide animations. Top window only (an iframe preview must not react).
		const stopAnim = (window.self === window.top)
			? subscribeAnimCommand(deckKey, (cmd) => {
				const root = document.querySelector('.content');
				if (!root) return;
				const anims = collectFinite(root);
				if (anims.length) applyState(anims, cmd);
			})
			: () => {};

		// A relayed CONTINUE pulse from the console becomes a `gp:continue` DOM event;
		// NavigationBar routes it to the slide's onContinue hook. Top window only.
		const stopContinue = (window.self === window.top)
			? subscribeContinue(deckKey, () => window.dispatchEvent(new CustomEvent('gp:continue')))
			: () => {};

		// A relayed HIGHLIGHT from the console lights the named Block on this slide
		// (see Spotlight / stores/highlightTarget). Top window only — an iframe preview
		// must not react, exactly like the anim/continue relays above. `setHighlight`
		// clears the store on `null`, so leaving a note line turns the spotlight off.
		const stopHighlight = (window.self === window.top)
			? subscribeHighlight(deckKey, (name) => setHighlight(name))
			: () => {};

		initialized = true;
		apply(true);
		return () => {
			unsubMode();
			unsubFactor();
			stopFollow();
			stopAnim();
			stopContinue();
			stopHighlight();
			setHighlight(null); // don't leave a stale spotlight across a deck swap
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<!-- Seo owns the <title> + SEO/social tags; the favicon link stays here (its
     last-one-wins cascade is separate from the single <title> Seo emits). -->
<Seo
	title={docTitle}
	description={currentDescription}
	image={currentImage}
	imageAlt={currentImageAlt}
	type="website"
/>

<svelte:head>
	{#if currentFavicon}
		<link rel="icon" href={currentFavicon} />
	{/if}
</svelte:head>

<!-- .viewport is the screen-fixed pan area. It centres the frame when it fits and
     scrolls (top-left reachable, via `safe center`) when SCALED overflows it. -->
<div class="viewport" class:zoom={!isFitted} bind:this={viewport} on:scroll={updateOverlay}>
	<div
		class="container {deckClass}"
		class:fit-mode={isFitted}
		class:zoom-mode={!isFitted}
		class:clean={clean}
		class:present={present}
		class:fade-chrome={fadeChrome}
		style="--canvas-w:{width}px; --canvas-h:{height}px; --aspect:{aspectRatio}; --base-font:{baseFontSize};{contentBackground ? ` --content-bg:${contentBackground};` : ''}{contentFont ? ` --content-font:${contentFont};` : ''}"
		bind:this={container}
	>
		<div class="content" class:fill class:ready={initialized} bind:this={content}>
			{#if initialized}
			<!-- Slide-owned chrome, pinned to the SLIDE's top-right corner (canvas space,
			     so it rides the slide's own scale/pan — its home is the page, not the
			     window). LAYOUT (authoring) + PRESENT (open the console) live here together;
			     the viewport-anchored DISPLAY control sits separately in the overlay below.
			     Being a .content child placed BEFORE the slot, the slide's own blocks paint
			     over it. Hidden by ?clean; PRESENT hides inside the console itself. -->
			{#if !clean && ($canLayout || !$presenterMode)}
			<div
				class="slide-chrome gp-chrome no-print"
				class:pinned={$layoutMode}
				class:featuring={featureLayoutBtn}
			>
				{#if $canLayout}
				<!-- Featured on a slide that invites you to use LAYOUT (its pages.ts `layout`
				     flag), muted where the control is merely around (dev, a sticky ?layout).
				     `calling` adds the halo, and lasts only until the button is used. -->
				<span class="layout-btn" class:featured={featureLayoutBtn} class:calling={callLayoutBtn}>
					<CtrlBtn
						chrome
						text="LAYOUT"
						hoverText={$layoutMode ? 'LAYOUT on' : 'LAYOUT off'}
						isSelected={$layoutMode}
						on:click={() => layoutMode.update((v) => !v)}
					/>
				</span>
				<!-- Save writes moved Blocks back to source via the vite-dev endpoint. Shown
				     whenever LAYOUT is on, and it looks like an ordinary control in BOTH worlds
				     — it isn't greyed out where it can't fire. It answers on click instead:
				     NOT ALLOWED, plus a tooltip saying why. A button disabled from the start
				     invites the audience to assume the feature is missing or broken; a button
				     that refuses when pressed teaches them saving is *forbidden here*. -->
				{#if $layoutMode}
					<span class="save-btn" class:refused={saveRefused}>
						<CtrlBtn chrome text={saveLabel} hoverText={saveLabel} on:click={onSave} />
						{#if saveRefused}
							<!-- aria-live so the refusal is announced, not just drawn. -->
							<span class="save-tip" role="status">Save not allowed in this setup.</span>
						{/if}
					</span>
				{/if}
				{/if}
				<!-- PRESENT opens the presenter console; a text label like the other chrome
				     buttons, hidden inside the console itself ($presenterMode). -->
				<CtrlBtn chrome text="PRESENT" on:click={openPresenter} isVisible={!$presenterMode} />
			</div>
			{/if}
			<slot />
			<!-- Note-driven spotlight: a canvas-level singleton (like the minimap),
			     inert until a <Note> line or a slide sets the highlightTarget store.
			     Placed after the slot so it paints over the slide's own blocks. -->
			<Spotlight canvasWidth={width} canvasHeight={height} />
			<TableOfContent {pages} {article} {articleText} {articleHref} />
			<Copyright />
			{/if}
		</div>
	</div>
</div>

<!-- Viewport-fixed chrome that must stay reachable regardless of pan/zoom: the
     display-mode (DISPLAY) control and the minimap. DISPLAY anchors to the WINDOW's
     top-right corner (SizeMode's own fixed inset), so it's always in reach even when a
     SCALED slide is panned or the frame is letterboxed — a window control, distinct
     from the slide-owned LAYOUT/PRESENT cluster above. Hidden by ?clean and in the
     presenter console (which has its own chrome). -->
{#if initialized && !clean && !present}
<div class="overlay" class:fade-chrome={fadeChrome} style="--base-font:{baseFontSize};">
	<SizeMode {width} {height} />
	{#if mapVisible}
	<SlideMap {width} {height} rect={mapRect} />
	{/if}
</div>
{/if}

<!-- Presenter console (this window loaded with ?present). Mounts OVER the hidden
     canvas; the current slide's own <Note> supplies the notes panel. -->
{#if initialized && present}
<PresenterView {pages} {width} {height} />
{/if}

<style>
	.viewport {
		position: fixed;
		inset: 0;
		/* FITTED never scrolls (the frame always fits); hidden also clips any phantom
		   sub-pixel overflow from the scaled content. SCALED opts into scroll/pan. */
		overflow: hidden;
		display: flex;
		/* `safe` keeps the start edge reachable when the slide overflows (SCALED
		   zoom-in) while still centring it when it fits. */
		justify-content: safe center;
		align-items: safe center;
	}
	.viewport.zoom {
		overflow: auto;
	}
	.container {
		width: var(--canvas-w);
		height: var(--canvas-h);
		/* Hold the JS-set size in the flex viewport (no shrink/grow). */
		flex: none;
		display: flex;
		flex-direction: column;
		background: var(--surface-bg, #181818);
		border: 1.5px solid var(--frame-border, #CCCCCC);
		position: relative;
	}
	.container.fit-mode {
		/* Fit the frame to the window by ASPECT, in pure CSS, so first paint is
		   already the right shape — before onMount/adjustSize() runs. adjustSize()
		   still sets equivalent px inline (and tracks resize); this just owns first
		   paint. Both axes are set EXPLICITLY (not width:auto + aspect-ratio) so the
		   inner content's min-width can't inflate the frame back to canvas width. */
		width:  min(calc(100vw - 10px), calc((100vh - 10px) * var(--aspect)));
		height: min(calc(100vh - 10px), calc((100vw - 10px) / var(--aspect)));
		/* Centre the content child so the exact-fit scale (adjustSize) letterboxes
		   symmetrically about the centre — paired with transformOrigin 'center'. */
		justify-content: center;
		align-items: center;
	}
	.content {
		/* Base font-size lever (see baseFontSize prop): every em-based size in the
		   reused components scales from here in one place. */
		font-size: var(--base-font);
		width: calc(var(--canvas-w) + 20px);
		height: calc(var(--canvas-h) - 30px);
		min-width: calc(var(--canvas-w) - 30px);
		min-height: calc(var(--canvas-h) - 30px);
		overflow: visible;
		padding: 15px;
		margin: 0px;
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--surface-fg, #C0F1FF);
		background: var(--content-bg, var(--surface-bg, #181818));
		font-family: var(--content-font, 'Noto Sans', 'Cormorant Garamond', serif);
	}
	/* Keep the content OUT OF LAYOUT until JS has applied the scale transform (the
	   `ready` class flips on at onMount, right after the first adjustSize()). At its
	   native px size the unscaled box overflows the frame; display:none removes it
	   from layout entirely — adjustSize() only measures the CONTAINER, so this is
	   safe. The container stays visible (sized in CSS), so the gap shows an empty
	   frame, never an overflowing box. */
	.content:not(.ready) {
		display: none;
	}

	/* --- Chrome fade (opt-in via `fadeChrome`) ---------------------------------
	   Every deck control tags its own root `.gp-chrome`; the two hosts that can
	   contain one are .container (NAV, TOC, LAYOUT/PRESENT) and .overlay (DISPLAY,
	   minimap), so the rule is written once against each. :global because those roots
	   belong to sibling components with their own scoped styles.

	   Opacity, never visibility/display: a ghosted control keeps its full hit area,
	   so the pointer can find it exactly where it always was. */
	.container.fade-chrome :global(.gp-chrome),
	.overlay.fade-chrome   :global(.gp-chrome) {
		opacity: 0.12;
		transition: opacity 160ms ease;
	}
	/* The overlay chrome (DISPLAY, minimap) rests much more OPAQUE than the on-slide
	   chrome: it lives in the viewport corner, out of the way of slide content, so it
	   can stay readable at a glance instead of hiding until pointed at. It still lifts
	   to full on hover/focus below (that rule outranks this one via :hover). Same
	   selector as the shared 0.12 rule above, placed after it, so source order wins. */
	.overlay.fade-chrome :global(.gp-chrome) {
		opacity: 0.75;
	}
	/* Lit on approach — and STAY lit while open (`.expanded`, the class TOC and
	   SizeMode already flip) or pinned (LAYOUT mid-edit). :focus-within carries the
	   keyboard: tabbing to a control reveals it exactly as hovering does. */
	.container.fade-chrome :global(.gp-chrome:hover),
	.container.fade-chrome :global(.gp-chrome:focus-within),
	.container.fade-chrome :global(.gp-chrome.expanded),
	.container.fade-chrome :global(.gp-chrome.pinned),
	.overlay.fade-chrome   :global(.gp-chrome:hover),
	.overlay.fade-chrome   :global(.gp-chrome:focus-within),
	.overlay.fade-chrome   :global(.gp-chrome.expanded),
	.overlay.fade-chrome   :global(.gp-chrome.pinned) {
		opacity: 1;
	}
	/* No hover to reveal with (touch, pen): a ghosted control the reader cannot
	   summon is just a lost control. Show everything. */
	@media (hover: none) {
		.container.fade-chrome :global(.gp-chrome),
		.overlay.fade-chrome   :global(.gp-chrome) {
			opacity: 1;
		}
	}
	/* LAYOUT / PRESENT cluster — pinned to the SLIDE's own top-right corner, in CANVAS
	   space (a .content child), so it rides the slide's scale/pan: its home is the page,
	   not the window. That is the whole point of the split — the DISPLAY control belongs
	   to the viewport (overlay), this belongs to the slide. Inset a little from the
	   corner so it sits ON the slide, not on its edge. No font-size: it inherits
	   .content's --base-font like the nav bar, so these read at the same size as the
	   other in-slide chrome. */
	.slide-chrome {
		position: absolute;
		top: 24px;
		right: 24px;
		/* Right-anchored row: LAYOUT, the dev-only SAVE, then PRESENT. The box shrinks to
		   content, so an absent LAYOUT (viewer, not authoring) just leaves PRESENT. */
		display: flex;
		align-items: center;
		gap: 8px;
	}
	/* Pin the SAVE button's width so its label can swap (SAVE → SAVED / NONE / ERROR)
	   without nudging the row; the text stays centred in the reserved box.

	   NOT ALLOWED is far wider than any of those, and reserving room for it would pad
	   the button with dead space on every slide to spare one transient state a nudge.
	   So it isn't in the pin: the button grows for the ~2.6s the refusal is up, then
	   settles. The row moving there is fine — it moves BECAUSE of the click the audience
	   just watched, so it reads as the answer, not as a glitch. */
	.slide-chrome .save-btn :global(button) {
		min-width: 4.6em;
	}
	/* The refusal has to be READ from the back of a room, so it doesn't get the muted
	   chrome grey. Danger red, and the same token the demo slide's own prose uses, so
	   the words in the chrome and the words on the slide are literally one colour. */
	.slide-chrome .save-btn.refused :global(button) {
		color: var(--ctrl-forbidden-fg, #E5484D);
	}
	/* The tooltip: why it refused, not just that it did. Anchored under the button and
	   centred on it; `left: 50%` + translate keeps it centred as the button grows into
	   the NOT ALLOWED label. Never intercepts the pointer. */
	.slide-chrome .save-btn {
		position: relative;
	}
	.slide-chrome .save-tip {
		position: absolute;
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		white-space: nowrap;
		pointer-events: none;
		padding: 0.3em 0.7em;
		border-radius: 6px;
		font-size: 0.72em;
		font-weight: bold;
		background: var(--tooltip-bg, #000000);
		color: var(--tooltip-fg, #FFFFFF);
		border: 1px solid var(--ctrl-forbidden-fg, #E5484D);
	}
	/* ── The featured LAYOUT button ────────────────────────────────────────────────
	   On a slide that TEACHES layout, this button is the subject of the slide. Two
	   forces work against it being seen, and both have to be answered:

	   1. The chrome look (--ctrl-fg) is a near-invisible grey on the dark frame — it is
	      DESIGNED to be missed, which is right for a tool and wrong for a demo.
	   2. `fadeChrome` (which the /slides deck sets) drops the whole cluster to
	      opacity 0.12 until pointed at. That multiplies over any colour we pick, so
	      restyling alone would have left the button a ghost on exactly the slides that
	      point at it. Hence the exemption below — it is the load-bearing half.

	   So: a filled warm pill, at full opacity, with a halo pulsing out of it until it's
	   used. Loud on purpose; it only ever appears on the handful of slides that ask for
	   it by name. */

	/* (2) A featuring slide opts its chrome OUT of the fade entirely. The whole cluster
	   stays lit, not just LAYOUT: opacity on the parent can't be undone by a child, and
	   on a slide whose subject IS the chrome, chrome that hides is the wrong default.
	   Beats the 0.12 rule on specificity (two classes to its one). */
	.container.fade-chrome :global(.slide-chrome.featuring) {
		opacity: 1;
	}

	/* Geometry, applied in BOTH states (warm and selected-green) so toggling LAYOUT
	   recolours the button without resizing it — the control row never jiggles. The
	   min-width also absorbs the hover label swap (LAYOUT → "LAYOUT off"). */
	.slide-chrome .layout-btn.featured :global(button) {
		margin-left: 0;
		padding: 0.28em 1.05em;
		border-radius: 999px;
		font-size: 1em;
		letter-spacing: 0.04em;
		min-width: 7.4em;
	}
	/* The colour, only while unselected. Once LAYOUT is on, CtrlBtn's own selected-green
	   takes over — the button has been found, and green is the right "you are in this
	   mode" signal. */
	.slide-chrome .layout-btn.featured :global(button:not(.selected)) {
		background: var(--ctrl-featured-fg, #F0A33E);
		color: var(--ctrl-featured-on, #1A1206);
	}

	/* The halo: a ring expanding out of the button and fading. It rides a pseudo-element
	   on the WRAPPER rather than a box-shadow on the button, so it needs no alpha colour
	   (the role tokens are opaque hex by convention) and can't disturb the filled pill. */
	.slide-chrome .layout-btn {
		display: inline-flex;
		position: relative;
	}
	.slide-chrome .layout-btn.calling::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 999px;
		border: 2px solid var(--ctrl-featured-fg, #F0A33E);
		pointer-events: none;
		animation: gp-layout-halo 1.9s ease-out infinite;
	}
	@keyframes gp-layout-halo {
		0%   { transform: scale(1);    opacity: 0.75; }
		100% { transform: scale(1.5);  opacity: 0;    }
	}
	/* Motion is an attention-getter, not information — the pill and its colour already
	   carry the message, so drop the pulse for anyone who asked for less movement. */
	@media (prefers-reduced-motion: reduce) {
		.slide-chrome .layout-btn.calling::after {
			animation: none;
			opacity: 0.75;
		}
	}
	.content.fill {
		/* Exact-fit: the box IS the full canvas (padding folded in via border-box),
		   so it fills the frame edge to edge on BOTH axes with no fudge. */
		box-sizing: border-box;
		width: var(--canvas-w);
		height: var(--canvas-h);
		min-width: var(--canvas-w);
		min-height: var(--canvas-h);
	}
	/* With a full-canvas fill box the chrome that normally hangs at bottom:-10 (in
	   the content's own unscaled coords) would spill past the bottom border. Nudge
	   it just inside, so it floats over the slide's bottom corners. */
	.content.fill :global(.nav),
	.content.fill :global(.copyright) {
		bottom: 20px;
	}

	/* Screen-fixed overlay for always-reachable chrome (display-mode control,
	   minimap). pointer-events:none lets clicks fall through to the slide; each
	   control re-enables them for itself. */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		pointer-events: none;
		font-size: var(--base-font);
	}
	.overlay > :global(*) {
		pointer-events: auto;
	}

	/* `?clean`: hide the in-canvas chrome so a capture shows only the slide. (The
	   overlay chrome is render-gated on !clean above.) The deck's 1.5px frame is
	   intentionally kept: it marks the canvas edge the capture is measured against. */
	.container.clean :global(.toc),
	.container.clean :global(.copyright),
	.container.clean :global(.nav),
	.container.clean :global(.anim-bar) {
		display: none;
	}

	/* `?present`: hide the whole slide canvas (frame, background, slide body, its
	   chrome) with visibility so it keeps LAYOUT — the slide still mounts, so its
	   <Note> exists. The note then flips ITSELF back to visible + fixed as the
	   presenter panel (see Note.presenter). No transform is applied in present mode
	   (adjustSize early-returns), so that fixed note tracks the viewport. */
	.container.present {
		visibility: hidden;
	}
</style>
