import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { sveltekitRoutes } from './src/lib/typesafe-routes/vite-plugin.js';

export default defineConfig({
	plugins: [sveltekitRoutes(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
