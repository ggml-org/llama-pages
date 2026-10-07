<script lang="ts">
	import { CornerDownLeft, Search } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { searchState } from '$lib/docs/search.svelte';
	import MiniSearch from 'minisearch';

	interface Section {
		id: number;
		local: string;
		title: string;
		heading: string;
		anchor: string;
		text: string;
	}

	interface Result {
		id: string;
		page: string;
		hash: string;
		title: string;
		heading: string;
		fragment: { text: string; match: boolean }[];
	}

	let dialog = $state<HTMLDialogElement>();
	let input = $state<HTMLInputElement>();
	let query = $state('');
	let active = $state(0);

	let mini: MiniSearch<Section> | null = null;
	const sections: Record<number, Section> = {};

	async function ensureIndex() {
		if (mini) return;

		const res = await fetch('/docs/search-index.json');
		const docs: Section[] = await res.json();

		for (const doc of docs) sections[doc.id] = doc;
		mini = new MiniSearch<Section>({ fields: ['title', 'heading', 'text'] });
		mini.addAll(docs);
		// Re-run the current query once the index is ready.
		query = query.trim();
	}

	function escapeRegExp(term: string): string {
		return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/** A short window of `text` around the first matched term, split for <mark>. */
	function fragmentParts(text: string, terms: string[]): { text: string; match: boolean }[] {
		if (terms.length === 0 || !text) return [{ match: false, text: text.slice(0, 140) }];

		const re = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
		const first = text.search(re);
		const start = first === -1 ? 0 : Math.max(0, first - 40);
		const window = (start > 0 ? '…' : '') + text.slice(start, start + 160);

		return window.split(re).map((part, i) => ({ match: i % 2 === 1, text: part }));
	}

	const results: Result[] = $derived.by(() => {
		const q = query.trim();

		if (!mini || !q) return [];

		return mini
			.search(q, { boost: { heading: 2, title: 3 }, fuzzy: 0.2, prefix: true })
			.slice(0, 10)
			.map((hit) => {
				const section = sections[hit.id as number];

				return {
					fragment: fragmentParts(section.text, hit.terms),
					hash: section.anchor ? `#${section.anchor}` : '',
					heading: section.heading,
					id: `docs-search-result-${hit.id}`,
					page: section.local,
					title: section.title
				};
			});
	});

	$effect(() => {
		void results;
		active = 0;
	});

	$effect(() => {
		if (!dialog) return;

		if (searchState.open && !dialog.open) {
			query = '';
			dialog.showModal();
			ensureIndex();
			input?.focus();
		} else if (!searchState.open && dialog.open) {
			dialog.close();
		}
	});

	function onWindowKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
			event.preventDefault();
			searchState.open = !searchState.open;
		}
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();

			if (results.length === 0) return;

			const delta = event.key === 'ArrowDown' ? 1 : -1;

			active = (active + delta + results.length) % results.length;
			// Keyboard-only: pointer hover also sets `active` and must not scroll.
			document.getElementById(results[active].id)?.scrollIntoView({ block: 'nearest' });
		} else if (event.key === 'Enter' && results[active]) {
			event.preventDefault();
			open(results[active]);
		}
	}

	function open(result: Result) {
		searchState.open = false;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() can't express the #anchor fragment
		goto(resolve('/docs/[...page]', { page: result.page }) + result.hash);
	}

	function onDialogClick(event: MouseEvent) {
		// Clicks on the backdrop land on the <dialog> element itself.
		if (event.target === dialog) searchState.open = false;
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<dialog
	bind:this={dialog}
	onclose={() => (searchState.open = false)}
	onclick={onDialogClick}
	class="mx-auto mt-[12vh] w-full max-w-lg rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-xs"
>
	<div class="flex flex-col">
		<div class="flex items-center gap-2 border-b border-border px-4">
			<Search class="size-4 shrink-0 text-foreground/40" />
			<input
				bind:this={input}
				bind:value={query}
				onkeydown={onInputKeydown}
				type="text"
				placeholder="Search docs…"
				aria-label="Search docs"
				role="combobox"
				aria-expanded={results.length > 0}
				aria-controls="docs-search-results"
				aria-activedescendant={results[active]?.id}
				class="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-foreground/40"
			/>
			<kbd
				class="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground/40"
			>
				esc
			</kbd>
		</div>

		<div id="docs-search-results" role="listbox" class="max-h-80 overflow-y-auto p-2">
			{#if query.trim() && results.length === 0}
				<p class="px-2 py-6 text-center text-sm text-foreground/50">
					No results for “{query.trim()}”
				</p>
			{/if}

			{#each results as result, i (result.id)}
				<!-- resolve() can't express the #anchor fragment: -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					id={result.id}
					role="option"
					aria-selected={i === active}
					href={resolve('/docs/[...page]', { page: result.page }) + result.hash}
					onclick={() => (searchState.open = false)}
					onpointerenter={() => (active = i)}
					class="flex flex-col gap-0.5 rounded-md px-3 py-2 {i === active
						? 'bg-sidebar-accent text-sidebar-accent-foreground'
						: ''}"
				>
					<span class="flex items-center gap-1.5 text-sm font-medium">
						{result.title}
						{#if result.heading}
							<span class="text-foreground/40">›</span>
							{result.heading}
						{/if}
						{#if i === active}
							<CornerDownLeft class="ml-auto size-3.5 shrink-0 text-foreground/30" />
						{/if}
					</span>
					<span class="truncate text-xs text-foreground/50">
						{#each result.fragment as part, j (j)}
							{#if part.match}
								<mark class="rounded-xs bg-transparent font-medium text-accent">{part.text}</mark>
							{:else}
								{part.text}
							{/if}
						{/each}
					</span>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/each}
		</div>

		<div
			class="flex items-center gap-3 border-t border-border px-4 py-2 text-xs text-foreground/40"
		>
			<span><kbd class="font-mono">↑↓</kbd> navigate</span>
			<span><kbd class="font-mono">↵</kbd> open</span>
		</div>
	</div>
</dialog>
