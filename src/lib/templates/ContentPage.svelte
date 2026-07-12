<!--
  ContentPage — the template behind most slides: a header, then your content.

  The header has three parts — title, subtitle and the rule beneath them — and
  EACH IS INDEPENDENTLY OMITTABLE. Whatever survives closes the gap: drop the
  subtitle and the rule rides up under the title; drop all three and the content
  starts at the top of the canvas. (Previously all three were mandatory — an
  empty `title`/`subtitle` still rendered its box, and the rule was welded to the
  subtitle as `.subtitle::after`, so a subtitle-less slide kept the empty span's
  margins and the rule sat too low. The rule is now its own element.)

  Usage:

    <script>
      import ContentPage from '$lib/templates/ContentPage.svelte';
    </script>

    <ContentPage title="My Title" subtitle="Optional">
      <p>Any HTML or Svelte components here.</p>
    </ContentPage>

  Props:
    title    — heading text; '' (default) drops the <h1> entirely.
    subtitle — line under the title; '' (default) drops it, pulling the rule up.
    rule     — the hairline under the header (default true). `rule={false}`
               removes it. With no title, no subtitle and no rule there is no
               header at all and the content starts at the top.
    align    — 'left' (default) | 'center'. Centers the title and subtitle; the
               rule spans the header either way, so it needs no alignment.
    nav      — the FIRST/PREV/CONTINUE/NEXT/LAST pager (default true).
               `nav={false}` for a slide outside the deck's linear order, which
               brings its own way out — see templates/AppendixPage.svelte.

  The content area keeps its own styling (justified, slightly smaller than the
  header) regardless of `align` — `align` is the HEADER's alignment.

  Theming: sizes, spacing and the rule's weight/colour come from role tokens
  (roles.css). The `var(--token, fallback)` fallbacks below ARE the main deck's
  look — a deck without `.gp-deck`/a theme resolves to exactly these, so they
  must stay the dark-default (light-on-dark) values:

    --page-title-fg      title colour            (#F0A33E)
    --page-title-size    title font-size         (2.5em)
    --page-subtitle-fg   subtitle colour         (currentColor)
    --page-subtitle-size subtitle font-size      (1.2em)
    --page-title-gap     title → subtitle gap    (0.5em)
    --page-rule-gap      header → rule gap       (15px)
    --page-rule-weight   rule thickness          (4.5px)
    --subtitle-rule      rule colour             (#F0F8FF)
    --page-content-gap   header → content gap    (1em)
-->
<script lang="ts">
	import { getPageNavigation, type PageNavigation } from '$lib/utils/navigate';
	import { getPages } from '$lib/presentation';
	import { page } from "$app/stores";
	import NavigationBar from '$lib/components/NavigationBar.svelte';

	/** Heading text; '' drops the <h1>. */
	export let title = "";
	/** Line under the title; '' drops it and pulls the rule up. */
	export let subtitle = "";
	/** The hairline under the header; false removes it. */
	export let rule = true;
	/** Header alignment: 'left' (default) or 'center'. */
	export let align: 'left' | 'center' = 'left';
	/** Render the FIRST/PREV/CONTINUE/NEXT/LAST pager (default true).

	    `nav={false}` is for a slide that is not part of the deck's linear order and
	    so has no neighbours to page to — an appendix, which supplies its own RETURN
	    control instead (templates/AppendixPage.svelte). Everything else about the
	    page — header, content box, styling — is unchanged, which is the point:
	    an appendix is a normal slide that is left in a different way. */
	export let nav = true;

	const pages = getPages();
	let currentPath: string | null = null;
	let navigation: PageNavigation;

	// An unknown `align` falls back to the default rather than emitting a class
	// that matches nothing (which would silently render as left anyway, but via
	// a lie in the markup).
	$: centered = align === 'center';
	// Nothing to show → no header element, so no margins of its own survive and
	// the content starts at the top of the canvas.
	$: hasHeader = Boolean(title) || Boolean(subtitle) || rule;

	$: {
		currentPath    = $page.url.pathname.split("/").pop() || null;
		navigation = getPageNavigation(pages, currentPath || "", "./");
	}
</script>

<div class="page">
    {#if hasHeader}
        <header class="header" class:centered>
            {#if title}<h1>{title}</h1>{/if}
            {#if subtitle}<span class="subtitle">{subtitle}</span>{/if}
            {#if rule}<div class="rule" aria-hidden="true"></div>{/if}
        </header>
    {/if}
    <div class="content">
        <slot />
    </div>
</div>

{#if nav}
<NavigationBar
	firstLink={navigation.first}
	prevLink={navigation.prev}
	nextLink={navigation.next}
	lastLink={navigation.last}
/>
{/if}

<style>
    .page {
        /* cosmetic */
        width: 100%;
        height: 100%;
        padding-left: 2em;
        padding-right: 2em;
    }
    .header.centered {
        text-align: center;
    }
    .page h1 {
        font-size: var(--page-title-size, 2.5em);
        margin-bottom: 0em;
        font-family: 'Playfair Display Bolds', 'Cormorant Garamond', serif;
        color: var(--page-title-fg, #F0A33E);
    }
    .page .subtitle {
        /* cosmetic */
        display: block;
        margin-left: 0em;
        margin-top: var(--page-title-gap, 0.5em);
        font-size: var(--page-subtitle-size, 1.2em);
        /* currentColor, not `inherit`: a CSS-wide keyword arriving via var()
           substitution is invalid at computed-value time (it happens to fall
           back to the inherited colour, but only by accident of `color` being
           an inherited property). currentColor says the same thing outright. */
        color: var(--page-subtitle-fg, currentColor);
    }

    /* Its own element, not `.subtitle::after` — so the subtitle can go away
       without taking the rule with it, and the rule can go away on its own.
       Adjacent-sibling margins collapse, so the gap above it is the same
       whether it follows the subtitle, the title, or nothing. */
    .page .rule {
        margin-top: var(--page-rule-gap, 15px);
        border-bottom: var(--page-rule-weight, 4.5px) solid var(--subtitle-rule, #F0F8FF);
    }
    .page .content {
        /* cosmetic */
        margin-top: var(--page-content-gap, 1em);
        margin-bottom: 2em;
        font-size: 1.28em;   /* 80% of the former 1.6em default */
        line-height: 1.1em;
        text-align: justify;
        text-justify: inter-word;
    }
</style>
