// Watercolor background for the content surface (Vite resolves the import to a URL).
import bg from './bg.png';

// This deck's SURFACE — the light palette, the watercolor, the serif. Declared here rather
// than in +layout.svelte because the printable handout (routes/handout/[deck].html) reads it
// from this module: it never mounts the layout, so props passed to <SlideDeck> there are
// invisible to it, and a light deck would print on GeekPresent's black default. The layout
// reads the same export, so the deck and its handout cannot disagree about what it looks like.
export const deck = {
    deckClass:  'gp-deck theme-light',
    background: `url(${bg}) center / cover no-repeat, var(--surface-bg)`,
    font:       "'Merriweather', Georgia, serif"
};

export const pages = [
    { path: "title.html",                    title: "Title" },
    { path: "brittle-setups.html",           title: "Brittle setups" },
    { path: "cross-project-pollution.html",  title: "Cross-project pollution" },
    { path: "isolate.html",                  title: "Isolate with venv" },
    { path: "the-tower.html",                title: "The tower" },
    { path: "thank-you.html",                title: "Thank you" },
];
