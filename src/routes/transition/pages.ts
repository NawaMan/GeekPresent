export const pages = [
    // Each effect is a PAIR of slides; paging from "(from)" to "(to)" performs the
    // transition live. Going FORWARD (→) each effect plays exactly once, on its own
    // (from → to) step; everything else bridges with a plain 'slide'. Pressing BACK
    // (←) on a "(to)" slide replays that effect, via `transitionBack`. See
    // view-transitions.css. (forward = `transition`, back = `transitionBack`.)
    { path: "title.html",            title: "Page Transitions",              transition: "slide" },

    { path: "cross-fade-from.html",  title: "Cross-Fade (from)",             transition: "fade" },
    { path: "cross-fade-to.html",    title: "Cross-Fade (to)",               transition: "slide", transitionBack: "fade" },

    { path: "slide-from.html",       title: "Directional Slide (from)",      transition: "slide" },
    { path: "slide-to.html",         title: "Directional Slide (to)",        transition: "slide", transitionBack: "slide" },

    { path: "zoom-from.html",        title: "Zoom / Scale (from)",           transition: "zoom" },
    { path: "zoom-to.html",          title: "Zoom / Scale (to)",             transition: "slide", transitionBack: "zoom" },

    { path: "flip-from.html",        title: "3D Flip (from)",                transition: "flip" },
    { path: "flip-to.html",          title: "3D Flip (to)",                  transition: "slide", transitionBack: "flip" },

    { path: "reveal-from.html",      title: "Circular Reveal (from)",        transition: "reveal" },
    { path: "reveal-to.html",        title: "Circular Reveal (to)",          transition: "slide", transitionBack: "reveal" },

    { path: "morph-from.html",       title: "Shared-Element Morph (from)",   transition: "morph" },
    { path: "morph-to.html",         title: "Shared-Element Morph (to)",     transition: "slide", transitionBack: "morph" },

    { path: "limitations.html",      title: "Limits & Browser Support",      transition: "slide" },
];
