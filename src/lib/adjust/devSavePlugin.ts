import type { Plugin, ViteDevServer } from 'vite';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { patchSlideSource, type LayoutChange } from './patchSource';

// Dev-only Vite plugin that lets ADJUST mode WRITE a slide's new Block geometry
// back to its Svelte source. It exists solely under `vite dev` (apply: 'serve'):
// a built/`?adjust` site has no Node process and must stay copy → paste only, so
// there is deliberately no production counterpart.
//
// The browser (see $lib/stores/adjustSave.ts) POSTs the current route plus the
// dirty tags; we map the route to `src/routes/<route>/+page.svelte`, hand the
// file and the changes to the pure patcher (patchSource.ts), write the result,
// and let HMR reload the slide. Tags we can't confidently place come back as
// `unmatched` so the UI can tell the author to paste those by hand.

const ENDPOINT = '/__geekpresent/adjust-save';

interface SaveRequest {
	/** The slide's `location.pathname`, e.g. `/slides/title.html`. */
	route: string;
	changes: LayoutChange[];
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
			// Guard against an absurd payload — ADJUST patches are tiny.
			if (data.length > 1_000_000) reject(new Error('payload too large'));
		});
		req.on('end', () => resolve(data));
		req.on('error', reject);
	});
}

/** Turn `/slides/title.html` (minus the dev `base`) into a route folder path,
    or null if it escapes the routes tree. */
function routeToDir(route: string, base: string): string | null {
	let r = route.split('?')[0].split('#')[0];
	if (base && base !== '/' && r.startsWith(base)) r = r.slice(base.length);
	r = r.replace(/^\/+/, '').replace(/\/+$/, '');
	if (!r) return null;
	// No traversal, no absolute segments.
	if (r.split('/').some((seg) => seg === '..' || seg === '.' || seg === '')) return null;
	return r;
}

async function handleSave(server: ViteDevServer, body: string) {
	const { route, changes } = JSON.parse(body) as SaveRequest;
	if (!route || !Array.isArray(changes)) {
		return { status: 400, payload: { error: 'route and changes are required' } };
	}

	const dir = routeToDir(route, server.config.base);
	if (!dir) {
		return { status: 400, payload: { error: `cannot map route "${route}" to a file` } };
	}

	const root = server.config.root;
	const routesDir = path.resolve(root, 'src/routes');
	const file = path.resolve(routesDir, dir, '+page.svelte');
	// Belt-and-braces: the resolved file must stay inside src/routes.
	if (file !== routesDir && !file.startsWith(routesDir + path.sep)) {
		return { status: 400, payload: { error: 'resolved path escapes src/routes' } };
	}

	let source: string;
	try {
		source = await fs.readFile(file, 'utf8');
	} catch {
		return {
			status: 404,
			payload: { error: `no +page.svelte for route "${route}" (${path.relative(root, file)})` }
		};
	}

	const { source: next, patched, unmatched } = patchSlideSource(source, changes);
	if (patched.length && next !== source) {
		await fs.writeFile(file, next, 'utf8');
	}

	return {
		status: 200,
		payload: {
			file: path.relative(root, file),
			patched: patched.length,
			unmatched: unmatched.map(
				(c) => c.name || (c.before ? `${c.kind}@${c.before.x},${c.before.y}` : c.kind)
			)
		}
	};
}

export function adjustSavePlugin(): Plugin {
	return {
		name: 'geekpresent-adjust-save',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				if (!req.url || !req.url.startsWith(ENDPOINT)) return next();
				if (req.method !== 'POST') {
					res.statusCode = 405;
					res.end('method not allowed');
					return;
				}
				try {
					const body = await readBody(req);
					const { status, payload } = await handleSave(server, body);
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
