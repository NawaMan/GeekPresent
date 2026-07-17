import type { Plugin, ViteDevServer } from 'vite';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { patchSlideSource, type LayoutChange } from './patchSource';
import { routeToPageFile } from './routeToPage';

// Dev-only Vite plugin that lets authoring tools read/write a slide's source.
// It exists solely under `vite dev` (apply: 'serve'): a built site has no Node
// process and must stay read-only / copy-paste only, so there is deliberately
// no production counterpart.
//
// Endpoints share the route→file mapping:
//
//   POST /__geekpresent/adjust-save   — ADJUST mode: surgical Block/Draw patches
//   POST /__geekpresent/source-save   — ViewSource EDIT: full +page.svelte overwrite
//   GET  /__geekpresent/source-load   — ViewSource EDIT REFRESH: read +page.svelte
//
// Tags ADJUST cannot confidently place come back as `unmatched` so the UI can
// tell the author to paste those by hand. Source SAVE writes the whole buffer.

const ADJUST_ENDPOINT = '/__geekpresent/adjust-save';
const SOURCE_SAVE_ENDPOINT = '/__geekpresent/source-save';
const SOURCE_LOAD_ENDPOINT = '/__geekpresent/source-load';

interface AdjustSaveRequest {
	/** The slide's `location.pathname`, e.g. `/slides/title.html`. */
	route: string;
	changes: LayoutChange[];
}

interface SourceSaveRequest {
	route: string;
	/** Full new contents of the slide's `+page.svelte`. */
	content: string;
}

function readBody(req: import('node:http').IncomingMessage, maxBytes: number): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
			if (data.length > maxBytes) reject(new Error('payload too large'));
		});
		req.on('end', () => resolve(data));
		req.on('error', reject);
	});
}

function parseRouteQuery(url: string): string | null {
	try {
		// url may be path + query (no origin) — URL needs a base.
		const u = new URL(url, 'http://dev.local');
		const route = u.searchParams.get('route');
		return route && route.trim() ? route : null;
	} catch {
		return null;
	}
}

async function readPageFile(server: ViteDevServer, route: string) {
	const root = server.config.root;
	const file = routeToPageFile(route, server.config.base, root);
	if (!file) {
		return { status: 400 as const, payload: { error: `cannot map route "${route}" to a file` } };
	}
	try {
		const content = await fs.readFile(file, 'utf8');
		return {
			status: 200 as const,
			payload: { file: path.relative(root, file), content }
		};
	} catch {
		return {
			status: 404 as const,
			payload: {
				error: `no +page.svelte for route "${route}" (${path.relative(root, file)})`
			}
		};
	}
}

async function handleAdjustSave(server: ViteDevServer, body: string) {
	const { route, changes } = JSON.parse(body) as AdjustSaveRequest;
	if (!route || !Array.isArray(changes)) {
		return { status: 400, payload: { error: 'route and changes are required' } };
	}

	const loaded = await readPageFile(server, route);
	if (loaded.status !== 200) return loaded;

	const source = loaded.payload.content as string;
	const fileRel = loaded.payload.file as string;
	const root = server.config.root;
	const file = routeToPageFile(route, server.config.base, root)!;

	const { source: next, patched, unmatched } = patchSlideSource(source, changes);
	if (patched.length && next !== source) {
		await fs.writeFile(file, next, 'utf8');
	}

	return {
		status: 200,
		payload: {
			file: fileRel,
			patched: patched.length,
			unmatched: unmatched.map((c) => ({
				label: c.name || (c.before ? `${c.kind}@${c.before.x},${c.before.y}` : c.kind),
				reason: c.reason
			}))
		}
	};
}

async function handleSourceSave(server: ViteDevServer, body: string) {
	const { route, content } = JSON.parse(body) as SourceSaveRequest;
	if (!route || typeof content !== 'string') {
		return { status: 400, payload: { error: 'route and content are required' } };
	}
	// Empty would wipe the slide; refuse rather than write zero bytes.
	if (content.length === 0) {
		return { status: 400, payload: { error: 'refusing to write empty content' } };
	}

	const root = server.config.root;
	const file = routeToPageFile(route, server.config.base, root);
	if (!file) {
		return { status: 400, payload: { error: `cannot map route "${route}" to a file` } };
	}

	// The file must already exist — never create a page from a bad route mapping.
	try {
		await fs.access(file);
	} catch {
		return {
			status: 404,
			payload: { error: `no +page.svelte for route "${route}" (${path.relative(root, file)})` }
		};
	}

	await fs.writeFile(file, content, 'utf8');

	return {
		status: 200,
		payload: { file: path.relative(root, file) }
	};
}

async function handleSourceLoad(server: ViteDevServer, url: string) {
	const route = parseRouteQuery(url);
	if (!route) {
		return { status: 400, payload: { error: 'route query parameter is required' } };
	}
	return readPageFile(server, route);
}

export function adjustSavePlugin(): Plugin {
	return {
		name: 'geekpresent-adjust-save',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				if (!req.url) return next();
				const pathOnly = req.url.split('?')[0];
				const isAdjust =
					pathOnly === ADJUST_ENDPOINT || pathOnly.startsWith(ADJUST_ENDPOINT + '/');
				const isSourceSave =
					pathOnly === SOURCE_SAVE_ENDPOINT ||
					pathOnly.startsWith(SOURCE_SAVE_ENDPOINT + '/');
				const isSourceLoad =
					pathOnly === SOURCE_LOAD_ENDPOINT ||
					pathOnly.startsWith(SOURCE_LOAD_ENDPOINT + '/');
				if (!isAdjust && !isSourceSave && !isSourceLoad) return next();

				try {
					if (isSourceLoad) {
						if (req.method !== 'GET') {
							res.statusCode = 405;
							res.end('method not allowed');
							return;
						}
						const { status, payload } = await handleSourceLoad(server, req.url);
						res.statusCode = status;
						res.setHeader('content-type', 'application/json');
						res.end(JSON.stringify(payload));
						return;
					}

					if (req.method !== 'POST') {
						res.statusCode = 405;
						res.end('method not allowed');
						return;
					}
					// Source saves carry a whole file; ADJUST patches are tiny.
					const maxBytes = isSourceSave ? 5_000_000 : 1_000_000;
					const body = await readBody(req, maxBytes);
					const { status, payload } = isSourceSave
						? await handleSourceSave(server, body)
						: await handleAdjustSave(server, body);
					res.statusCode = status;
					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify(payload));
				} catch (err) {
					res.statusCode = 500;
					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
				}
			});
		}
	};
}
