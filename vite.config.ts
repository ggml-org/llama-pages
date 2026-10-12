import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import type { PreviewServer, ViteDevServer } from 'vite';
import { defineConfig } from 'vitest/config';

function configureMarkdownCharset(server: ViteDevServer | PreviewServer) {
	server.middlewares.use((req, res, next) => {
		// The static server omits the charset for Markdown, so browsers may misread UTF-8.
		if (/^\/docs\/.*\.md(?:\?|$)/.test(req.url ?? '')) {
			res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
		}

		next();
	});
}

export default defineConfig({
	plugins: [
		{
			configurePreviewServer: configureMarkdownCharset,
			configureServer: configureMarkdownCharset,
			name: 'docs-markdown-charset'
		},
		tailwindcss(),
		sveltekit()
	],
	test: {
		expect: { requireAssertions: true },
		// There are no unit tests at the moment (the homepage is covered by
		// the e2e test), and vitest fails a run that finds no test files.
		passWithNoTests: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					browser: {
						enabled: true,
						instances: [{ browser: 'chromium', headless: true }],
						provider: playwright()
					},
					exclude: ['src/lib/server/**'],
					include: ['src/**/*.svelte.{test,spec}.{js,ts}', 'tests/**/*.svelte.{test,spec}.{js,ts}'],
					name: 'client'
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					environment: 'node',
					exclude: ['**/*.svelte.{test,spec}.{js,ts}'],
					include: ['tests/**/*.{test,spec}.{js,ts}'],
					name: 'server'
				}
			}
		]
	}
});
