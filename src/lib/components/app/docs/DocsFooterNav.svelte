<script lang="ts">
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { FlatTocEntry } from '$lib/docs/types';

	interface Props {
		prev?: FlatTocEntry;
		next?: FlatTocEntry;
	}

	let { next, prev }: Props = $props();
</script>

<!-- Two cards, each labelled with its direction, so "Next" is findable
     without reading the titles. The empty span keeps "Next" in the right
     column on the first page. -->
{#if prev || next}
	<nav class="mt-16 grid grid-cols-2 gap-4 text-sm" aria-label="Pagination">
		{#if prev}
			<a
				href={resolve('/docs/[...page]', { page: prev.local })}
				class="flex flex-col gap-1 rounded-xl border p-4"
			>
				<span class="flex items-center gap-1 text-muted-foreground">
					<ArrowLeft class="size-3.5" /> Previous
				</span>
				<span class="font-medium">{prev.title}</span>
			</a>
		{:else}
			<span></span>
		{/if}

		{#if next}
			<a
				href={resolve('/docs/[...page]', { page: next.local })}
				class="flex flex-col items-end gap-1 rounded-xl border p-4 text-right"
			>
				<span class="flex items-center gap-1 text-muted-foreground">
					Next <ArrowRight class="size-3.5" />
				</span>
				<span class="font-medium">{next.title}</span>
			</a>
		{/if}
	</nav>
{/if}
