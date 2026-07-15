// Page-level favicon override: the deck shell emits the current slide's favicon at
// SSR, so this overrides the site default for just the hook.html slide. The other
// portrait slides keep the site favicon (static/favicon.png).
import zoomFavicon from '$lib/assets/codecat-zoom.png';

// This deck's SURFACE. Declared HERE, beside the slide list, because two things need it and
// only one of them is the deck: +layout.svelte hands it to <SlideDeck>, and the printable
// handout (routes/handout/[deck].html) reads it from this module — it never mounts the layout,
// so it has no other way to learn that this deck is tall, nor that its text is bigger. A deck
// that says nothing gets GeekPresent's defaults (handoutCore.DeckMeta); this one must speak,
// and by speaking once, to both, it cannot drift.
export const deck = { width: 1080, height: 1920, baseFontSize: '1.8em' };

export const pages = [
    { path: "title.html",     title: "Title" },
    { path: "hook.html",      title: "The Hook", favicon: zoomFavicon },
    { path: "thank-you.html", title: "Thank You" },
];
