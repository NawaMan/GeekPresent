// Slide Pages reference deck — full-page templates and full-canvas slides.
// Contiguous `hidden` appendix entries are one chapter (live demo from AppendixPage).
// WebPage / VideoPage live demos are single-slide hidden appendices (call via AppendixLink).
export const pages = [
	{ path: "title.html", title: "Slide Pages" },
	{ path: "titlepage.html", title: "TitlePage" },
	{ path: "contentpage.html", title: "ContentPage" },
	{ path: "emptypage.html", title: "EmptyPage" },
	// Appendix story + live chapter
	{ path: "appendixpage.html", title: "AppendixPage" },
	{ path: "appendix-hidden.html", title: "Appendix — hidden" },
	{ path: "appendix-a.html", title: "Appendix — part 1", hidden: true },
	{ path: "appendix-b.html", title: "Appendix — part 2", hidden: true },
	{ path: "appendixlink.html", title: "AppendixLink" },
	// WebPage docs → jump into live canvas
	{ path: "webpage.html", title: "WebPage" },
	{ path: "webpage-demo.html", title: "WebPage — live", hidden: true },
	// VideoPage docs → jump into live canvas
	{ path: "videopage.html", title: "VideoPage" },
	{ path: "videopage-demo.html", title: "VideoPage — live", hidden: true },
	{ path: "textpage.html", title: "TextPage" },
	{ path: "closing.html", title: "Closing" },
];
