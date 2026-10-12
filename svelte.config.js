import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { relative, sep } from 'node:path';
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index.js';
import rehypeSlug from 'rehype-slug';

// The languages the docs' code fences use (`sh` and `yml` are aliases of
// `bash` and `yaml`). Loaded up front because mdsvex's own highlighter loads
// grammars lazily, and that silently fails in some environments -- in
// `vite dev`, `sh` blocks came out unhighlighted. Fences in any other
// language render as plain text.
loadLanguages(['bash', 'json', 'python', 'yaml']);

// Prism's bash grammar marks known commands (`curl`, `sh`, ...) as
// `function`, but its list predates `llama` -- the docs' main command, which
// would otherwise render as plain text next to a colored `curl`. Same
// boundaries as Prism's own command pattern.
Prism.languages.insertBefore('bash', 'function', {
	llama: {
		alias: 'function',
		lookbehind: true,
		pattern: /(^|[\s;|&]|[<>]\()llama(?=$|[)\s;|&])/
	}
});

/**
 * Highlights a docs code block with Prism, at build time.
 *
 * Same output as mdsvex's highlighter: the code goes inside `{@html `...`}`,
 * so Svelte treats it as a string instead of compiling every token span. In
 * that JS template literal, `{`, `}` and `` ` `` would break out of it and a
 * backslash is an escape (a shell line continuation -- `\` + newline --
 * would vanish), so all four become HTML entities. The HTML's only such
 * characters come from the code itself, so escaping all of them is safe.
 *
 * @param {string} code
 * @param {string | undefined} lang
 */
function highlight(code, lang) {
	const grammar = lang ? Prism.languages[lang] : undefined;
	const html = grammar ? Prism.highlight(code, grammar, lang) : Prism.util.encode(code);
	const escaped = html.replace(/[{}`\\]/g, (c) => `&#${c.charCodeAt(0)};`);

	return `<pre class="language-${lang}">{@html \`<code class="language-${lang}">${escaped}</code>\`}</pre>`;
}

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
			highlight: { highlighter: highlight },
			rehypePlugins: [rehypeSlug]
		})
	]
};

export default config;
