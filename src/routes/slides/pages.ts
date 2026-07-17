// `adjust: true` — this slide OFFERS the ADJUST authoring control, even in the built
// site. Set on the slides that TEACH layout (their prose says "flip ADJUST and drag
// this box"), so the button is there when the audience is told to look for it. The
// rest of the deck ships ADJUST-free. It makes the control AVAILABLE, not active —
// the mode still starts off. See lib/adjust/adjustAccessCore.ts.
export const pages = [
    { path: "title.html",             title: "Title" },
    { path: "what-is-geekpresent.html", title: "What is GeekPresent?" },
    { path: "project-structure.html", title: "Project Structure" },
    { path: "title-page.html",        title: "Using TitlePage" },
    { path: "content-page.html",      title: "Using ContentPage" },
    { path: "content-header.html",    title: "The ContentPage Header" },
    { path: "navigation.html",        title: "Navigation" },
    // Beside Navigation, because that is what it is: the OVERVIEW PAGE grid is the third way
    // to move around a deck, after paging and the ToC. The slide IS its own demo — press
    // O while reading it and this deck opens as a grid of itself.
    { path: "overview-grid.html",     title: "Overview Page — The All-Slides Grid" },
    // Also beside Navigation: full-deck search is the fourth way to get around a deck.
    // The slide IS its own demo — open the ToC while reading it and search its own words.
    { path: "full-deck-search.html",  title: "Full-Deck Search" },
    { path: "appendix-page.html",     title: "AppendixPage" },
    // `hidden: true` — an APPENDIX: real, prerendered, linkable slides that are NOT in
    // the deck's linear order. →/Space step over them and the Table of Contents doesn't
    // list them; you arrive by <AppendixLink> from a slide that calls one, and leave by
    // paging off the end of the run (or with RETURN). CONTIGUOUS hidden entries are ONE
    // appendix chapter — these two page to each other, and the second's NEXT goes back
    // to the caller. Kept beside their caller for readability; their position in this
    // list matters only relative to each other. See lib/utils/appendixCore.ts.
    { path: "appendix-detail.html",   title: "Appendix — How the GC marks",  hidden: true },
    { path: "appendix-detail-2.html", title: "Appendix — Write barriers",    hidden: true },
    // And the counterpart, to show that `hidden` is OPTIONAL: an appendix with no
    // `hidden` is ordinary back matter — listed in the TOC, paged into by →/Space,
    // and still returnable-from when a slide calls it. It sits at the BACK of the
    // deck (below), where a book's appendix lives, precisely because it IS in the
    // march. `hidden` does not make an appendix; it only decides whether the deck's
    // forward march can find one.
    { path: "components.html",        title: "Components" },
    { path: "box-component.html",     title: "Box Component" },
    { path: "block-component.html",   title: "Block Component", adjust: true },
    { path: "adjust-mode.html",       title: "ADJUST Mode", adjust: true },
    { path: "adjust-style-guard.html", title: "style vs. ADJUST", adjust: true },
    { path: "highlight-component.html", title: "Highlight Component" },
    { path: "carousel-component.html", title: "Carousel Component" },
    { path: "steps-component.html",   title: "Steps & Fragment" },
    { path: "datatable-component.html", title: "DataTable — Static Data" },
    { path: "datatable-tools.html",   title: "DataTable — Table Tools" },
    { path: "datatable-server.html",  title: "DataTable — Server-Side Data" },
    { path: "draw-component.html",    title: "Draw — Shapes & Arrows", adjust: true },
    { path: "path-component.html",    title: "Path — Multi-Segment Stroke", adjust: true },
    { path: "draw-sequence.html",     title: "Draw — Building a Diagram", adjust: true },
    { path: "connector-component.html", title: "Connector — Arrows by Name", adjust: true },
    { path: "note-highlight-component.html", title: "Note-driven Highlight", adjust: true },
    // The pen sits next to the Spotlight it complements: the highlight rings what the
    // AUTHOR named, ANNOTATE draws on what the SPEAKER decides to point at. No `annotate`
    // flag here — that one is deck-wide (see +layout.svelte), because a speaker tool takes
    // no instruction from the slide it happens to be standing on.
    // Four slides, and they READ as four: draw on it, straighten the pen with Shift, watch the
    // ink survive the hop, then learn the switch. Each payoff leans on the slide before it.
    { path: "annotate-component.html", title: "Annotate — The Speaker's Pen" },
    { path: "annotate-snap.html",     title: "Annotate — A Straight Edge" },
    { path: "annotate-persistence.html", title: "Annotate — The Ink Stays" },
    { path: "annotate-setup.html",    title: "Annotate — Turning It On" },
    { path: "chart-bar.html",         title: "Chart — Grouped & Stacked Bars" },
    { path: "chart-line.html",        title: "Chart — Dual-Axis Line + Time" },
    { path: "chart-combo.html",       title: "Chart — Combo (Bars + Line)" },
    { path: "chart-scatter.html",     title: "Chart — Bubble Scatter" },
    { path: "chart-area.html",        title: "Chart — Stacked Area + Draw-In" },
    { path: "function-graph.html",    title: "Chart — Plotting y = f(x)" },
    { path: "histogram-component.html", title: "Chart — Histogram (Distribution)" },
    { path: "heatmap-component.html", title: "Chart — Heatmap (2-D Distribution)" },
    { path: "datatable-chart.html",   title: "DataTable + Charts — One Dataset" },
    { path: "youtube-showcase.html",  title: "YouTube" },
    { path: "website-component.html", title: "WebSite — Embedded Site" },
    { path: "webpage-component.html", title: "WebPage — Full-Canvas Site" },
    { path: "video-component.html",   title: "Video — Player & Bookmarks" },
    { path: "videopage-component.html", title: "VideoPage — Full-Canvas Video" },
    { path: "hint-component.html",    title: "Hint" },
    { path: "callout-component.html", title: "Callout", adjust: true },
    { path: "stat-component.html",    title: "Stat & StatGroup", adjust: true },
    { path: "quote-component.html",   title: "Quote", adjust: true },
    { path: "timeline-component.html", title: "Timeline", adjust: true },
    { path: "timeline-horizontal.html", title: "Timeline — Horizontal & Scroll" },
    { path: "columns-component.html", title: "Columns & Column", adjust: true },
    { path: "tabs-component.html",    title: "Tabs & Tab", adjust: true },
    { path: "kbd-component.html",     title: "Kbd" },
    { path: "qrcode-component.html",  title: "QRCode" },
    { path: "label-component.html",   title: "Label" },
    { path: "scrolldiv-component.html", title: "ScrollDiv" },
    { path: "code-component.html",    title: "Code" },
    { path: "javacode-component.html", title: "JavaCode" },
    { path: "codebox-component.html", title: "CodeBox" },
    // ViewSource (Monaco) on a slide — view via ☰ → SOURCE; under vite dev the buffer is
    // editable and SAVE writes the full +page.svelte (same refusal language as ADJUST SAVE).
    { path: "viewsource-edit.html",   title: "ViewSource — Edit in Dev" },
    { path: "codediff-component.html", title: "CodeDiff", adjust: true },
    { path: "terminal-component.html", title: "Terminal" },
    { path: "speaker-notes.html",     title: "Speaker Notes" },
    // Beside Speaker Notes, because the notes are half of what it prints: the HANDOUT is
    // this deck as one document (/slides/handout). The slide IS its own demo — its link is
    // live, and it carries a <Note> so the ?notes handout has something to print under it.
    { path: "handout-page.html",      title: "The Handout — The Deck as a PDF" },
    { path: "state-demo.html",        title: "State — URL, localStorage, Stores" },
    { path: "progress-demo.html",     title: "Progress — Which Page of How Many" },
    // The listed appendix (see the note beside the hidden pair above): no `hidden`, so
    // it IS in the running order and IS in the TOC — back matter, at the back.
    { path: "appendix-listed.html",   title: "Appendix — Listed, not hidden" },
    { path: "thank-you.html",         title: "Thank You" },
];
