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

	// Wrap every markdown code block in llama-ui's code-block chrome: a rounded,
	// soft-bordered box with a floating header that names the language and holds
	// the copy button. The markdown HTML is rendered by <Content />, so the
	// wrapper and header are built imperatively around each <pre>.
	$effect(() => {
		void data.local;

		if (!article) return;

		const blocks = [...article.querySelectorAll('pre')].map((pre) => {
			const wrapper = document.createElement('div');

			wrapper.className = 'code-block-wrapper';

			const header = document.createElement('div');

			header.className = 'code-block-header';

			const language = /language-([\w-]+)/.exec(pre.className)?.[1];

			if (language) {
				const label = document.createElement('span');

				label.className = 'code-language';
				label.textContent = language;
				header.appendChild(label);
			}

			const actions = document.createElement('div');

			actions.className = 'code-block-actions';
			header.appendChild(actions);

			pre.replaceWith(wrapper);
			wrapper.appendChild(header);
			wrapper.appendChild(pre);

			const button = mount(DocsCodeCopyButton, {
				props: { getText: () => pre.innerText },
				target: actions
			});

			return { button, pre, wrapper };
		});

		return () => {
			for (const { button, pre, wrapper } of blocks) {
				unmount(button);

				if (wrapper.isConnected) wrapper.replaceWith(pre);
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

	/* Code blocks mirror llama-ui's markdown renderer: a rounded, soft-bordered
	   box (border/30, dark border/20) with a small shadow, a floating header
	   that names the language, and a transparent <pre> the box provides the
	   chrome for. The global prism theme strips pre box styling with !important
	   (the homepage install widget provides its own container), so the box rules
	   live on the wrapper and only the pre's padding is restored here. */
	article :global(.code-block-wrapper) {
		position: relative;
		overflow: hidden;
		border: 1px solid color-mix(in oklch, var(--border) 30%, transparent);
		border-radius: 0.75rem;
		background: var(--code-background);
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	}

	:global(.dark) article :global(.code-block-wrapper) {
		border-color: color-mix(in oklch, var(--border) 20%, transparent);
	}

	article :global(.code-block-header) {
		position: absolute;
		inset-inline: 0;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem 0;
	}

	article :global(.code-language) {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--foreground);
	}

	article :global(.code-block-actions) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
</style>
