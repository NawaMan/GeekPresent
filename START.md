# Using GeekPresent for your own site

For an AI agent asked something like *"use https://github.com/NawaMan/GeekPresent to make a
presentation / a web page / a blog"*. This page takes you from that sentence to a site that
builds. (Asked to work **on** GeekPresent itself? That is [`AGENTS.md`](AGENTS.md) instead.)

GeekPresent is a set of Svelte components and a site shell, shipped as a package,
`@geekpresent/core`. A site made with it is a small SvelteKit project of the user's own: their
pages and settings, with GeekPresent as a dependency. It builds to plain static files.

## 1. Ask

Ask these before running anything. Each has a default; say it, and let the user correct it.

| Ask | Why | Default |
| --- | --- | --- |
| **What are you making?** A slide deck, a web page, or a blog. | It decides what is scaffolded. A site can grow the others later. | deck |
| **Which repository?** An existing one, or a new one just for this site. | A new repository is made from a template instead (step 2b). | the one you are in |
| **Where does the source go?** A new folder, relative to the repository root. | Everything the site owns lives there; deleting it undoes everything. | `geekpresent` |
| **Where does the built site go?** | The build deletes this folder and rewrites it every time, so it must hold only this site — `site/blog`, never `site`. | `<source>/build` |
| **What address will it be served at?** The full URL of its root page. | Its path (`/blog`, `/<repo>`) is the base path every page loads its scripts from; built for the wrong one, every page is blank. The URL also goes into the link-preview tags. | not decided (domain root) |
| **Deploy with this repository's GitHub Pages?** | Adds a workflow. Say no when the built output is committed into a site served some other way. | no |
| **Docker or Podman on this machine?** | With one, every command runs in a container (a CodingBooth) and nothing else is needed. Without, Node 22+ and pnpm. | Docker |

A GitHub project page's address is `https://<owner>.github.io/<repo>`. A blog in a folder of an
existing site is, for example, `https://example.com/blog`, built into that site's `site/blog/`.

## 2a. Create it — in an existing repository

From the repository root, with the answers as flags:

```bash
curl -fsSL https://raw.githubusercontent.com/NawaMan/GeekPresent/main/adopt-geekpresent.sh -o adopt-geekpresent.sh
bash adopt-geekpresent.sh --package --kind blog --dir blog --dist site/blog \
  --site-url https://example.com/blog --no-ci --yes
rm adopt-geekpresent.sh
```

| Flag | Answer |
| --- | --- |
| `--kind deck\|text\|blog` | what to make (`--name <folder>` names a deck; default `slides`) |
| `--dir <folder>` | the source folder |
| `--dist <folder>` | where the built site goes (default `<source>/build`) |
| `--site-url <url>` | the address; its path becomes the base path (`--base` overrides) |
| `--ci` / `--no-ci` | deploy with this repository's GitHub Pages, or not |
| `--no-booth` | no Docker: remove the CodingBooth and use Node + pnpm |
| `--yes` | take every default for what is not given; ask nothing |

It copies [GeekPresentStarter](https://github.com/NawaMan/GeekPresentStarter) into the source
folder, sets the output folder, base path and address, and scaffolds the kind asked for: a deck
(`--name` for its folder), a page at the root, or a blog index with a first post. It writes
`<source>/README.md` with the exact commands for these answers. It commits nothing and builds
nothing. Download it and read it before you run it if your rules ask for that; `--help` lists
every flag.

## 2b. Create it — as a new repository

The repository *is* the site, so there is no output question: it builds into `build/` and
deploys to that repository's GitHub Pages. Make it from the template:

```bash
gh repo create <name> --template NawaMan/GeekPresentStarter --public --clone
```

or *Use this template* on https://github.com/NawaMan/GeekPresentStarter. The template is a deck.
For a page or a blog, follow *A page* or *A blog* in the guide (step 4) and delete
`src/routes/slides/`.

## 3. Check it

From the source folder:

```bash
scripts/test.sh     # the scaffolded pages render
scripts/build.sh    # the whole site prerenders into the output folder
scripts/dev.sh      # the dev server; prints the URL — give it to the user
```

`<source>/README.md` has the right form of each for the answers given (an output folder outside
the source folder builds on the host: `NO_BOOTH=1 scripts/build.sh`). With a base path, the
pages are under it on the dev server too: `http://localhost:<port>/blog/`.

## 4. Write it

- `<source>/AGENTS.md` is the site's agent manual: the rules that break a build and how to run
  things.
- `node_modules/@geekpresent/core/guide/README.md` (there after the first `scripts/test.sh` or
  install) is the authoring guide for the installed version: how a deck, a page and a blog fit
  together, every component, and what to do when something goes wrong.
- The live examples of every component:
  https://nawaman.github.io/GeekPresent/references/title.html

## The other route

`adopt-geekpresent.sh --copy` copies the whole framework *source* in instead of the package — for
a user who wants to own and change GeekPresent itself, at the price of no upgrades. Its manual
is [`AGENT.md`](AGENT.md).
