<script lang="ts">
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

	// Give every code block a header that names its language and holds the
	// copy button. The markdown HTML is rendered by <Content />, so the
	// wrapper and header are built imperatively around each <pre>.
	$effect(() => {
		void data.local;

		if (!article) return;

		const blocks = [...article.querySelectorAll('pre')].map((pre) => {
			const wrapper = document.createElement('div');

			wrapper.className = 'code-block';

			const header = document.createElement('div');

			header.className = 'code-block-header';

			// Prism tags the <pre> with the fence's language (`language-sh`).
			// Blocks without one get no label, just the copy button.
			const language = /language-([\w-]+)/.exec(pre.className)?.[1];

			if (language) {
				const label = document.createElement('span');

				label.className = 'code-block-language';
				label.textContent = language;
				header.appendChild(label);
			}

			pre.replaceWith(wrapper);
			wrapper.appendChild(header);
			wrapper.appendChild(pre);

			const button = mount(DocsCodeCopyButton, {
				props: { getText: () => pre.innerText },
				target: header
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

<div class="flex w-full">
	<aside
		class="sticky top-20 hidden h-[calc(100vh-5rem)] w-[19rem] shrink-0 overflow-y-auto px-7 py-6 lg:block"
	>
		<DocsSidebar toctree={data.toctree} active={data.local} />
	</aside>

	<div class="flex min-h-screen w-full min-w-0 grow gap-x-8 px-4 pt-6 lg:pt-10 lg:pr-10 lg:pl-16">
		<main class="mx-auto w-full max-w-xl min-w-0 pb-10 xl:w-[calc(100%-28rem)] 2xl:max-w-2xl">
			<details class="mb-6 rounded-md border border-border lg:hidden">
				<summary class="cursor-pointer px-3 py-2 text-sm font-medium">Documentation</summary>
				<div class="px-3 pb-3">
					<DocsSidebar toctree={data.toctree} active={data.local} />
				</div>
			</details>

			<div class="mb-4 flex justify-end">
				<DocsCopyPage local={data.local} />
			</div>

			<article bind:this={article} class="prose max-w-none dark:prose-invert">
				<Content />
			</article>

			<DocsFooterNav prev={data.prev} next={data.next} />
		</main>

		<aside
			class="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-[19rem] shrink-0 self-start overflow-y-auto pb-4 pl-10 xl:block"
		>
			<DocsToc {article} pageKey={data.local} />
		</aside>
	</div>
</div>

<style lang="postcss">
	/* Keep anchor targets clear of the sticky site header. */
	article :global(:is(h1, h2, h3, h4, h5, h6)) {
		scroll-margin-top: 6rem;
	}

	/* Each code block is a box with a header row -- the language on the left,
	   the copy button on the right -- laid over the top of the <pre>, whose
	   top padding makes room for it. The global prism theme strips pre box
	   styling with !important (the homepage install widget provides its own
	   container), so the box lives on the wrapper and the pre is reset with
	   higher specificity. */
	article :global(.code-block) {
		position: relative;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 2px);
		background: var(--code-background);
	}

	article :global(.code-block-header) {
		position: absolute;
		inset-inline: 0;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem 0;
	}

	/* Pushes the copy button right even when there's no language label. */
	article :global(.code-block-header > :last-child) {
		margin-left: auto;
	}

	article :global(.code-block-language) {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	article :global(pre) {
		margin: 0 !important;
		padding: 3rem 1rem 1rem !important;
		border: none !important;
		border-radius: 0 !important;
		background: transparent !important;
		color: var(--code-foreground);
		line-height: 1.3;
	}

	/* Wrap every docs block inside the column. The docs column is narrower than
	   a typical command or reply line, and the prism theme's `white-space: pre`
	   would otherwise leave the rest of the line on a horizontal scrollbar. */
	article :global(pre),
	article :global(pre code) {
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}

	article :global(.table-scroll) {
		max-width: 100%;
		overflow-x: auto;
	}
</style>
