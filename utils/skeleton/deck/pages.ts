// The slide list — this array IS the deck. Order here is the order you present in,
// and it is what the nav arrows and the ToC read.
//
// To add a slide: create the route dir `<name>.html/` next to this file (with a
// `+layout.js` and a `+page.svelte` — copy title.html/), then add a line below.
// The `.html` suffix is part of the folder name; without a +layout.js the slide's
// nav links 404 on the trailing-slash URL.
//
// Optional per-entry flags:
//   hidden: true   reachable by URL, but skipped by the nav and absent from the ToC
//   layout: true   this slide may enter LAYOUT mode (drag Blocks to exact pixels)
//   favicon        a per-slide favicon override (import the image, pass it here)
export const pages = [{ path: "title.html", title: "Title" }];
