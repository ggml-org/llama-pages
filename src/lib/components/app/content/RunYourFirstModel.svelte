<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { families } from '$lib/catalog';
	import { ModelsCatalogFamilyCard } from '$lib/components/app';

	// A teaser of the catalog on the homepage: a handpicked set of families,
	// newest first (`families` is already in that order), as a grid of tiles.
	// The full, browsable catalog lives at /models.
	//
	// Picked here rather than from the catalog's own `featured` flag: that flag
	// is part of the published API, and what we choose to put on the homepage
	// shouldn't change what the apps highlight. Six names, because the grid is
	// three columns at desktop width and six fills two rows exactly.
	const HOMEPAGE_FAMILIES = [
		'Qwen 3.8',
		'Laguna XS 2.1',
		'DeepSeek V4',
		'Gemma 4',
		'GLM 4.7',
		'GPT-OSS'
	];

	const featured = families.filter((f) => HOMEPAGE_FAMILIES.includes(f.name));
</script>

<section class="py-24">
	<h2 class="mb-8 text-2xl font-semibold text-foreground">Run your first model</h2>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each featured as f (f.name)}
			<ModelsCatalogFamilyCard family={f} />
		{/each}
	</div>

	<div class="mt-6 flex justify-center">
		<a
			href={resolve('/models')}
			class="inline-flex items-center gap-1.5 text-sm text-foreground/70 underline underline-offset-4 transition-colors hover:text-foreground"
		>
			Browse all models
			<ArrowUpRight class="size-3.5" />
		</a>
	</div>
</section>
