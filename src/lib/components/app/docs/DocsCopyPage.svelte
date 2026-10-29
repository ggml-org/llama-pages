<script lang="ts">
	import { Check, ChevronDown, Copy, FileText } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { Logo } from '$lib/components/app';
	import { LLAMA_PROMPT_MAX_CHARS } from '$lib/constants';
	import { llamaServerLabel } from '$lib/docs/llama-app';
	import { llamaModels, showLlamaConnection } from '$lib/stores/llama-models';

	interface Props {
		local: string;
	}

	let { local }: Props = $props();

	// A prerendered static asset (see scripts/prepare-docs.js), not a route.
	const mdPath = $derived(`/docs/${local}.md` as Pathname);

	let open = $state(false);
	let copied = $state(false);
	let container = $state<HTMLElement>();
	let markdown = $state('');

	// The header's connection (see LlamaConnection), rather than a check of
	// its own: one place to connect, and the same state everywhere.
	const llamaBase = $derived($llamaModels.base);
	const llamaStatus = $derived($llamaModels.status);

	const LLAMA_STATUS_TITLE = {
		checking: 'Connecting to Llama…',
		off: 'Not connected to Llama',
		ready: 'Connected to Llama',
		unknown: 'Can’t reach Llama'
	} as const;

	const llamaHref = $derived.by(() => {
		const prompt = `Answer questions about this documentation page:\n\n${markdown}`;

		return `${llamaBase}/?q=${encodeURIComponent(prompt)}`;
	});

	async function fetchMarkdown(): Promise<string> {
		const res = await fetch(mdPath);

		return res.text();
	}

	async function copyMarkdown() {
		await navigator.clipboard.writeText(await fetchMarkdown());
		copied = true;
		setTimeout(() => (copied = false), 2000);
		open = false;
	}

	async function toggleMenu() {
		open = !open;

		if (!open) {
			return;
		}

		markdown = (await fetchMarkdown()).slice(0, LLAMA_PROMPT_MAX_CHARS);
	}

	/**
	 * Until the server is confirmed, opens the header's popover instead,
	 * where the visitor connects, fixes the port, or sees why it fails.
	 * Where the header doesn't show it (phones, Linux, Safari), the link
	 * opens anyway: whether a server answers is advisory only (see
	 * $lib/docs/llama-app).
	 */
	function openInLlama(event: MouseEvent) {
		open = false;

		if (llamaStatus !== 'ready' && showLlamaConnection()) {
			event.preventDefault();
			// This click would otherwise reach the header's click-outside
			// handler, closing the popover it just opened.
			event.stopPropagation();
		}
	}

	function onWindowClick(event: MouseEvent) {
		if (open && container && !container.contains(event.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={onWindowClick} />

<div bind:this={container} class="relative inline-flex text-sm">
	<button
		type="button"
		onclick={copyMarkdown}
		class="inline-flex cursor-pointer items-center gap-1.5 rounded-l-md border border-border px-2.5 py-1.5"
	>
		{#if copied}
			<Check class="size-3.5 text-green-500" />
		{:else}
			<Copy class="size-3.5" />
		{/if}
		Copy page
	</button>

	<button
		type="button"
		onclick={toggleMenu}
		aria-label="More page actions"
		aria-expanded={open}
		class="inline-flex cursor-pointer items-center rounded-r-md border border-l-0 border-border px-1.5 py-1.5"
	>
		<ChevronDown class="size-3.5 transition-transform {open ? 'rotate-180' : ''}" />
	</button>

	{#if open}
		<div
			class="absolute top-full right-0 z-50 mt-1 flex w-56 flex-col rounded-md border border-border bg-background p-1 shadow-md"
		>
			<button
				type="button"
				onclick={copyMarkdown}
				class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left"
			>
				<Copy class="size-3.5 shrink-0" />
				Copy page as Markdown
			</button>

			<a
				href={resolve(mdPath)}
				target="_blank"
				rel="noopener"
				onclick={() => (open = false)}
				class="flex items-center gap-2 rounded px-2 py-1.5"
			>
				<FileText class="size-3.5 shrink-0" />
				View as Markdown
			</a>

			<a
				href={llamaHref}
				target="_blank"
				rel="noopener external"
				onclick={openInLlama}
				class="flex min-w-0 items-center gap-2 rounded px-2 py-1.5"
			>
				<span class="flex size-3.5 shrink-0 items-center justify-center">
					<Logo --logo-height="0.875rem" --logo-gap="0" />
				</span>
				Open in Llama
				<span class="ml-auto truncate text-xs text-foreground/40">
					{llamaServerLabel(llamaBase)}
				</span>
				<!-- The header pill's dot, so both read the same: hollow until
				     connected, green once it is, orange when it can't reach. -->
				<span
					class="size-1.5 shrink-0 rounded-full {llamaStatus === 'off'
						? 'border border-muted-foreground'
						: llamaStatus === 'checking'
							? 'animate-pulse bg-muted-foreground'
							: llamaStatus === 'ready'
								? 'bg-green-500'
								: 'bg-orange-400'}"
					title={`${LLAMA_STATUS_TITLE[llamaStatus]} at ${llamaBase}`}
				></span>
			</a>
		</div>
	{/if}
</div>
