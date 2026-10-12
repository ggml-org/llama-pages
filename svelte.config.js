import adapter from '@sveltejs/adapter-static';
import { code_highlighter, mdsvex } from 'mdsvex';
import { relative, sep } from 'node:path';
import rehypeSlug from 'rehype-slug';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	extensions: ['.svelte', '.svx', '.md'],
	kit: {
		adapter: adapter(),
		output: {
			bundleStrategy: 'single'
		},
		prerender: {
			entries: ['*']
		}
	},
	preprocess: [
		mdsvex({
			extensions: ['.svx', '.md'],
			highlight: {
				// mdsvex's own Prism highlighter, with every backslash turned into
				// an HTML entity. mdsvex emits highlighted code inside a JS template
				// literal (`{@html `...`}`), where a backslash is an escape -- so a
				// shell line continuation (`\` + newline) vanished, joining
				// multi-line commands into one line. The output's only backslashes
				// come from the code itself, so escaping all of them is safe.
				highlighter: async (...args) => (await code_highlighter(...args)).replace(/\\/g, '&#92;')
			},
			rehypePlugins: [rehypeSlug]
		})
	]
};

export default config;
