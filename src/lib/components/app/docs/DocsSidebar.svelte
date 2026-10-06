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
	class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border/30 bg-muted/60 px-3 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-border/20 dark:bg-muted/75 dark:hover:bg-muted"
>
	<Search class="size-3.5 shrink-0" />
	Search docs
	<kbd
		class="ml-auto rounded border border-border/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground dark:border-border/20"
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
