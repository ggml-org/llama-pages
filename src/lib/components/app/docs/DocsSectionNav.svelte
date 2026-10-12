<script lang="ts">
	import Self from './DocsSectionNav.svelte';
	import { resolve } from '$app/paths';
	import type { TocItem } from '$lib/docs/types';

	interface Props {
		item: TocItem;
		active: string;
	}

	let { active, item }: Props = $props();

	const isActive = $derived(item.local === active);
</script>

<!-- A group is a plain label over its pages, always open: with a handful of
     pages, collapsing groups only hides where things are. Labels are small
     and muted (secondary nav, per llama-design); page links are full-strength
     text, like the header's nav, since muted gray reads as disabled. The
     current page sits on the same soft `bg-foreground/6` pill as the
     header's current section. No hover states (see llama-design). -->
{#if item.sections}
	<div class="flex flex-col gap-0.5">
		<p class="px-2 pb-1 text-[13px] text-muted-foreground">{item.title}</p>
		{#each item.sections as section (section.title)}
			<Self item={section} {active} />
		{/each}
	</div>
{:else if item.local}
	<a
		href={resolve('/docs/[...page]', { page: item.local })}
		aria-current={isActive ? 'page' : undefined}
		class="rounded-md px-2 py-1 text-sm text-foreground {isActive
			? 'bg-foreground/6 font-medium'
			: ''}"
	>
		{item.title}
		{#if item.new}
			<span class="ml-1 text-xs font-medium text-highlight">New</span>
		{/if}
	</a>
{/if}
