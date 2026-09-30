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

	// Give every code block a hover copy button. The markdown HTML is rendered
	// by <Content />, so the buttons are mounted imperatively onto each <pre>.
	$effect(() => {
		void data.local;

		if (!article) return;

		const buttons = [...article.querySelectorAll('pre')].map((pre) => {
			const wrapper = document.createElement('div');

			wrapper.className = 'group relative';
			pre.replaceWith(wrapper);
			wrapper.appendChild(pre);
			const button = mount(DocsCodeCopyButton, {
				props: { getText: () => pre.innerText },
				target: wrapper
			});

			return { button, pre, wrapper };
		});

		return () => {
			for (const { button, pre, wrapper } of buttons) {
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

	/* The global prism theme strips pre box styling with !important (the
	   homepage install widget provides its own container), so docs code
	   blocks restore it here with higher specificity. */
	article :global(pre) {
		background: var(--code-background) !important;
		color: var(--code-foreground);
		border: 1px solid var(--border) !important;
		border-radius: calc(var(--radius) + 2px) !important;
		padding: 1rem !important;
	}
</style>
