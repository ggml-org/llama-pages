<script lang="ts">
	import DocsSectionNav from './DocsSectionNav.svelte';
	import { Search } from '@lucide/svelte';
	import { searchState } from '$lib/docs/search.svelte';
	import type { TocItem } from '$lib/docs/types';

	interface Props {
		toctree: TocItem[];
		active: string;
	}

	let { active, toctree }: Props = $props();
</script>

<button
	type="button"
	onclick={() => (searchState.open = true)}
	class="flex w-full cursor-pointer items-center gap-2 rounded-lg bg-foreground/4 px-2.5 py-2 text-sm text-foreground/45 transition-colors hover:bg-foreground/7 hover:text-foreground/70"
>
	<Search class="size-3.5 shrink-0" />
	Search docs
	<kbd
		class="ml-auto rounded bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] text-foreground/40"
	>
		⌘K
	</kbd>
</button>

<nav class="mt-4 flex flex-col gap-0.5" aria-label="Documentation">
	{#key active}
		{#each toctree as item (item.title)}
			<DocsSectionNav {item} {active} />
		{/each}
	{/key}
</nav>
