import type { Plugin } from 'vite';
import fs from 'fs/promises';
import path from 'path';

interface Param {
	name: string;
	rest: boolean;
	optional: boolean;
}

interface Route {
	routeId: string;
	params: Param[];
}

async function walk(dir: string) {
	const files = await fs.readdir(dir, { recursive: true });

	const routes = new Map<string, Route>();

	for (const file of files) {
		const p = path.parse(file);
		if (!p.name.startsWith('+')) continue;

		const routeId = path.join('/', p.dir);
		if (routes.has(routeId)) continue;

		routes.set(routeId, {
			routeId,
			params: parseRouteIdParams(routeId)
		});
	}

	const entries = Array.from(routes.values())
		.map((route) => {
			const p = route.params
				.map((p) => `\t\t'${p.name}'${p.optional ? '?' : ''}: string;`)
				.join(';\n');

			return `\t'${route.routeId}': ${p ? `{\n${p}\n\t};` : '{};'}`;
		})
		.join('\n');

	const schema = `export type Routes = {\n${entries}\n}\n`;

	await fs.writeFile('./.svelte-kit/generated-routes.d.ts', schema, 'utf-8');
}

function parseRouteIdParams(routeId: string) {
	const params: Param[] = [];
	for (const match of routeId.matchAll(/(\[+)(\.{0,3})(.*?)(\]+)/g)) {
		if (match[1].length !== match[4].length) throw new Error(`brackets not balanced: ${routeId}`);

		params.push({
			name: match[3],
			optional: match[1].length === 2,
			rest: match[2] === '...'
		});
	}
	return params;
}

export function sveltekitRoutes({ routes = 'src/routes' }: { routes?: string } = {}): Plugin {
	return {
		name: 'vite-plugin-sveltekit-routes',
		async buildStart() {
			await walk(routes);
		},
		configureServer(vite) {
			vite.watcher.on('all', (_, filepath) => {
				if (path.basename(filepath).startsWith('+')) {
					walk(routes);
				}
			});
		}
	};
}
