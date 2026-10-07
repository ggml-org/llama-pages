<script lang="ts">
	import Self from './DocsSectionNav.svelte';
	import { ChevronRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { TocItem } from '$lib/docs/types';

	interface Props {
		item: TocItem;
		active: string;
		depth?: number;
	}

	let { active, depth = 0, item }: Props = $props();

	function hasActive(node: TocItem): boolean {
		return node.local === active || (node.sections?.some(hasActive) ?? false);
	}

	const isActive = $derived(item.local === active);
	const containsActive = $derived(hasActive(item));

	let expanded = $state(true);
	$effect(() => {
		if (containsActive) expanded = true;
	});
</script>

{#if item.sections}
	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="flex w-full cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
	>
		<ChevronRight class="size-3.5 shrink-0 transition-transform {expanded ? 'rotate-90' : ''}" />
		{item.title}
	</button>

	{#if expanded}
		<div class="ml-3 flex flex-col border-l pl-1">
			{#each item.sections as section (section.title)}
				<Self item={section} {active} depth={depth + 1} />
			{/each}
		</div>
	{/if}
{:else if item.local}
	<a
		href={resolve('/docs/[...page]', { page: item.local })}
		aria-current={isActive ? 'page' : undefined}
		class="rounded-md px-2 py-1.5 text-sm transition-colors {isActive
			? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
			: 'text-foreground/60 hover:bg-sidebar-accent/50 hover:text-foreground'}"
	>
		{item.title}
		{#if item.new}
			<span class="ml-1 text-xs font-medium text-accent">New</span>
		{/if}
	</a>
{/if}
