<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import {
		DocsCodeCopyButton,
		DocsCopyPage,
		DocsFooterNav,
		DocsSearch,
		DocsSidebar,
		DocsToc
	} from '$lib/components/app';
	import { SITE_URL } from '$lib/constants';
	import { mount, unmount } from 'svelte';

	let { data } = $props();

	const Content = $derived(data.component);
	const mdPath = $derived(`/docs/${data.local}.md`);

	let article = $state<HTMLElement>();

	// Give every code block a copy button. The markdown HTML is rendered by
	// <Content />, so a wrapper is built imperatively around each <pre> to
	// hold the button in its top-right corner.
	$effect(() => {
		void data.local;

		if (!article) return;

		const blocks = [...article.querySelectorAll('pre')].map((pre) => {
			const wrapper = document.createElement('div');

			wrapper.className = 'code-block';
			pre.replaceWith(wrapper);
			wrapper.appendChild(pre);

			const button = mount(DocsCodeCopyButton, {
				props: { getText: () => pre.innerText },
				target: wrapper
			});

			return { button, pre, wrapper };
		});
		// Wide tables scroll inside the column instead of widening the page.
		const tables = [...article.querySelectorAll('table')].map((table) => {
			const wrap = document.createElement('div');

			wrap.className = 'table-scroll';
			table.replaceWith(wrap);
			wrap.appendChild(table);

			return { table, wrap };
		});

		return () => {
			for (const { button, pre, wrapper } of blocks) {
				unmount(button);

				if (wrapper.isConnected) wrapper.replaceWith(pre);
			}

			for (const { table, wrap } of tables) {
				if (wrap.isConnected) wrap.replaceWith(table);
			}
		};
	});
</script>

<svelte:head>
	<title>{data.title} — llama.app</title>
	<link rel="canonical" href="{SITE_URL}/docs/{data.local}" />
	<link rel="alternate" type="text/markdown" href={mdPath} />
</svelte:head>

<DocsSearch />

{#snippet onPage()}
	<DocsToc {article} pageKey={data.local} />
{/snippet}

<!-- Same content column as the header and the rest of the site
     (`max-w-6xl`, `px-6 md:px-12`, per llama-design), so the sidebar lines up
     under the logo instead of hugging the window edge. Two columns: the page
     nav (with the current page's sections nested under it) and the article --
     no third "on this page" column, which would squeeze the article and its
     code blocks. -->
<div
	class="mx-auto grid w-full max-w-6xl grid-cols-1 px-6 md:px-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14"
>
	<!-- The site header isn't sticky (it scrolls away), so the sidebar sticks
	     to the very top of the viewport. -->
	<aside class="sticky top-0 hidden h-dvh overflow-y-auto pt-6 pb-10 lg:block">
		<DocsSidebar toctree={data.toctree} active={data.local} {onPage} />
	</aside>

	<main class="relative min-w-0 pt-2 pb-24 lg:pt-6">
		<!-- On phones and tablets the nav folds into a menu named after the
		     current page. Keyed by page so it closes after navigating -- the
		     component (and an open <details>) otherwise persists. -->
		{#key data.local}
			<details class="group mb-8 rounded-xl border lg:hidden">
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden"
				>
					<span class="truncate">
						<span class="text-muted-foreground">Docs /</span>
						<span class="font-medium">{data.title}</span>
					</span>
					<ChevronDown class="size-4 shrink-0 transition-transform group-open:rotate-180" />
				</summary>
				<div class="border-t p-4">
					<DocsSidebar toctree={data.toctree} active={data.local} {onPage} />
				</div>
			</details>
		{/key}

		<!-- In the top-right corner, level with the h1 (which leaves room for it,
		     see the style block) from lg up; above it on narrower screens, where
		     a long title would run into it. -->
		<div class="mb-4 flex justify-end lg:absolute lg:top-6 lg:right-0 lg:mb-0">
			<DocsCopyPage local={data.local} />
		</div>

		<!-- Prose colors come from the site's tokens (see the style block), so
		     dark mode needs no `prose-invert`. Inline code is a soft gray chip
		     rather than typography's bold-with-backticks. -->
		<article
			bind:this={article}
			class="prose max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-4xl prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:bg-foreground/6 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[0.85em]"
		>
			<Content />
		</article>

		<DocsFooterNav prev={data.prev} next={data.next} />
	</main>
</div>

<style lang="postcss">
	/* Typography's palette, swapped for the site's tokens, which already
	   change with the theme. Body text is a touch softer than headings, for
	   long reading (llama-design: soften with foreground/80, don't go gray). */
	article {
		--tw-prose-body: color-mix(in oklab, var(--foreground) 85%, transparent);
		--tw-prose-headings: var(--foreground);
		--tw-prose-lead: var(--foreground);
		--tw-prose-links: var(--foreground);
		--tw-prose-bold: var(--foreground);
		--tw-prose-counters: var(--muted-foreground);
		--tw-prose-bullets: var(--muted-foreground);
		--tw-prose-hr: var(--border);
		--tw-prose-quotes: var(--foreground);
		--tw-prose-quote-borders: var(--border);
		--tw-prose-captions: var(--muted-foreground);
		--tw-prose-code: var(--foreground);
		--tw-prose-th-borders: var(--border);
		--tw-prose-td-borders: var(--border);
	}

	/* Room for the "Copy page" control beside the title (see above). */
	@media (min-width: 64rem) {
		article :global(h1) {
			padding-right: 10rem;
		}
	}

	/* The header scrolls away, so anchor targets need only a little air. */
	article :global(:is(h1, h2, h3, h4, h5, h6)) {
		scroll-margin-top: 1.5rem;
	}

	/* Each code block is a box with the copy button in its top-right corner.
	   Code panels are light in light mode on llama.app (see llama-design).
	   The global prism theme strips pre box styling with !important (the
	   homepage install widget provides its own container), so the box lives
	   on the wrapper and the pre is reset with higher specificity. */
	article :global(.code-block) {
		position: relative;
		margin-block: 1.5em;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 4px);
		background: var(--code-background);
	}

	/* Backed by the panel color, so a long first line scrolled under it
	   (narrow screens) doesn't show through. */
	article :global(.code-block > button) {
		position: absolute;
		top: 0.625rem;
		right: 0.625rem;
		background: var(--code-background);
	}

	/* Lines don't wrap: wrapping breaks a command or a column of aligned
	   comments mid-line, where it reads as two lines. The column is wide
	   enough for most lines; the rest scroll inside the block. The right
	   padding keeps the first line clear of the copy button. */
	article :global(pre) {
		margin: 0 !important;
		padding: 1rem 3rem 1rem 1.25rem !important;
		border: none !important;
		border-radius: 0 !important;
		background: transparent !important;
		color: var(--code-foreground);
		font-size: 0.8125rem;
		line-height: 1.7;
		overflow-x: auto !important;
	}

	article :global(pre code) {
		font-size: inherit !important;
	}

	article :global(.table-scroll) {
		max-width: 100%;
		overflow-x: auto;
	}
</style>
