// This deck's SURFACE — the green palette. Declared here rather than in +layout.svelte because
// the printable handout (routes/_handout/[deck].html) reads it from this module: it never mounts
// the layout, so a deckClass passed to <SlideDeck> there would be invisible to it, and the deck
// would print in GeekPresent's default colours instead of its own.
export const deck = { deckClass: 'gp-deck theme-green' };

export const pages = [
    // Each effect is a PAIR of slides; paging from "(from)" to "(to)" performs the
    // transition live. Going FORWARD (→) each effect plays exactly once, on its own
    // (from → to) step; everything else bridges with a plain 'slide'. Pressing BACK
    // (←) on a "(to)" slide replays that effect: a slide with no `transitionBack`
    // goes back with the kind that led in (reversed when it has a direction). See
    // view-transitions.css and $lib/utils/transitionCore.ts.
    { path: "title.html",            title: "Page Transitions",              transition: "slide" },

    { path: "cross-fade-from.html",  title: "Cross-Fade (from)",             transition: "fade" },
    { path: "cross-fade-to.html",    title: "Cross-Fade (to)",               transition: "slide" },

    { path: "slide-from.html",       title: "Directional Slide (from)",      transition: "slide" },
    { path: "slide-to.html",         title: "Directional Slide (to)",        transition: "slide" },

    // The built-in push kinds ($lib/styles/push-transitions.css): no keyframes here.
    // Forward plays rise, then left; back plays right, then fall.
    { path: "push-rise.html",        title: "Built-in Push: rise",           transition: "rise" },
    { path: "push-left.html",        title: "Built-in Push: left",           transition: "left" },
    { path: "push-to.html",          title: "Built-in Push (to)",            transition: "slide" },

    { path: "zoom-from.html",        title: "Zoom / Scale (from)",           transition: "zoom" },
    { path: "zoom-to.html",          title: "Zoom / Scale (to)",             transition: "slide" },

    { path: "flip-from.html",        title: "3D Flip (from)",                transition: "flip" },
    { path: "flip-to.html",          title: "3D Flip (to)",                  transition: "slide" },

    { path: "reveal-from.html",      title: "Circular Reveal (from)",        transition: "reveal" },
    { path: "reveal-to.html",        title: "Circular Reveal (to)",          transition: "slide" },

    { path: "morph-from.html",       title: "Shared-Element Morph (from)",   transition: "morph" },
    { path: "morph-to.html",         title: "Shared-Element Morph (to)",     transition: "slide" },

    // A <Group> camera: one scene (CameraScene.svelte), four shots. Wide → zoom → pan
    // → out all morph, both ways; the 'camera' kind is in view-transitions.css.
    { path: "camera-wide.html",      title: "Group Camera (wide)",           transition: "camera" },
    { path: "camera-zoom.html",      title: "Group Camera (zoom)",           transition: "camera" },
    { path: "camera-pan.html",       title: "Group Camera (pan)",            transition: "camera" },
    { path: "camera-out.html",       title: "Group Camera (out)",            transition: "slide" },

    { path: "limitations.html",      title: "Limits & Browser Support",      transition: "slide" },

    { path: "thank-you.html",        title: "Now Go Animate Your Deck",      transition: "slide" },
];
