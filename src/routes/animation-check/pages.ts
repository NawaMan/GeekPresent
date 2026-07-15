export const pages = [
    { path: "title.html",       title: "Draw & Block, step by step" },
    // Step 1 — place it. The same ADJUST gate for an HTML box and an SVG shape.
    { path: "block-edit.html",  title: "Block — Editable" },
    { path: "shape-edit.html",  title: "Shape — Editable" },
    { path: "mix-edit.html",    title: "Block + Shape — Editable" },
    // Step 2 — move it. A Block hits a wall; Shapes animate; a Sprite bridges it.
    { path: "block-anim.html",  title: "Block — Can't Animate" },
    { path: "shape-anim.html",  title: "Shape — Animated" },
    { path: "mix-anim.html",    title: "Block + Shape — Animated" },
    // Step 3 — the fork, closed: KeyframeStudio retired (deleted), its job folded
    // into the Sprite path; SpriteStudio is the one drop-in authoring wrapper.
    { path: "studio-vs-sprite.html", title: "Two Tools, Folded Into One" },
    { path: "sprite-studio.html",    title: "SpriteStudio — The One Studio" },
    // Two independent animation sets, each (Sprite + Shape) on its own bar.
    { path: "two-scenes.html",       title: "Two Scenes, Two Bars" },
];
