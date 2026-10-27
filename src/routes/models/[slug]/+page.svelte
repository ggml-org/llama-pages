<script lang="ts">
	import type { PageData } from './$types';
	import { type Build, releasedFor, type Size } from '$lib/catalog';
	import { ModelsCatalogInstallDialog, ModelsCatalogSizeRow } from '$lib/components/app';

	let { data }: { data: PageData } = $props();
	const family = $derived(data.family);

	// The build (plus its size, for the title) the install dialog is showing;
	// null when closed. Same modal on every platform -- it varies its own copy
	// by platform, see InstallDialog.
	let run = $state<{ build: Build; size: Size } | null>(null);

	// Whether to also show each size's smaller quantized builds. Off by default:
	// every size leads with its canonical (highest-precision) build, and lower
	// quants are opt-in -- mirroring the app, where they're strictly fallbacks.
	let showQuantized = $state(false);
	const hasQuantized = $derived(family.sizes.some((s) => s.builds.length > 1));
</script>

<svelte:head>
	<title>{family.name} — llama.app</title>
	<meta name="description" content={family.description} />
</svelte:head>

<!-- Same outer container as the rest of the site so the pages share margins and
     left edge. The per-size download table spans the full width, followed by
     the family prose. -->
<main class="mx-auto w-full max-w-6xl px-6 pt-8 pb-24 md:px-12">
	<!-- Header, title-first: the family name leads at full size, with the
	     release date and license as a byline under it and the one-line summary
	     last -- headline / byline / standfirst. The brand isn't repeated here:
	     the title contains it and the summary opens by naming the publisher.
	     The license is labeled, since a bare "OpenMDW 1.1" or "MIT" after a
	     date doesn't say what it is. -->
	<header>
		<h1 class="text-[30px] font-semibold tracking-tight">{family.name}</h1>
		<div class="mt-2.5 text-[13px] text-muted-foreground">
			<span class="tabular-nums">{releasedFor(family)}</span>
			<span aria-hidden="true" class="mx-1">·</span>
			<span>License: {family.license}</span>
			{#if family.nonCommercial}
				<span>(non-commercial)</span>
			{/if}
		</div>
		<p class="mt-3 max-w-xl text-[15px] text-muted-foreground">
			{#each family.description.split(/(\*\*[^*]+\*\*)/g) as part, i (i)}
				{#if part.startsWith('**') && part.endsWith('**')}
					<strong class="font-semibold">{part.slice(2, -2)}</strong>
				{:else}
					{part}
				{/if}
			{/each}
		</p>
		<!-- Decision and embedding models don't chat, and nothing else on the page says so --
		     without this, installing one and finding no way to talk to it reads
		     as a broken install. Names what it is and where to learn the API. -->
		{#if family.decision}
			<p class="mt-3 max-w-xl text-[15px] text-muted-foreground">
				A decision model: it doesn’t chat — apps call it through the API to score the options of
				typed questions.
				<a
					href="https://huggingface.co/blog/ggml-org/decision-models-in-llamacpp"
					target="_blank"
					rel="noopener"
					class="whitespace-nowrap underline hover:text-foreground">How to use ↗</a
				>
			</p>
		{:else if family.embedding}
			<p class="mt-3 max-w-xl text-[15px] text-muted-foreground">
				An embedding model: it doesn’t chat — apps call it through the API to turn input into
				vectors for search and retrieval.
				<a
					href="https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#post-v1embeddings-openai-compatible-embeddings-api"
					target="_blank"
					rel="noopener"
					class="whitespace-nowrap underline hover:text-foreground">How to use ↗</a
				>
			</p>
		{/if}
	</header>

	<section class="mt-10">
		<!-- Section header line: a heading on the left anchors the row, with the
		     quantization toggle as the right-aligned control -- the one place the
		     site explains what quantization is. The explanation sits on a second
		     line under the label, always visible: it used to hide in an info
		     icon's tooltip, which few people found. A switch rather than a
		     checkbox, at the right edge and sized to span both lines, so the
		     control and the two lines read as one unit, settings-row style. The
		     whole thing is the label, so a click anywhere on it toggles. The
		     heading sits at the bottom, level with the second line, just above
		     the table it names. -->
		<div class="mb-2 flex items-end justify-between gap-4">
			<h2 class="text-[13px] text-muted-foreground">Sizes</h2>
			{#if hasQuantized}
				<label class="flex cursor-pointer items-center gap-3 text-right select-none">
					<span class="flex flex-col">
						<span class="text-[13px] text-muted-foreground">Show smaller quantizations</span>
						<span id="quantized-hint" class="text-[12px] text-muted-foreground/70">
							Less memory, at a small cost in quality
						</span>
					</span>
					<!-- The switch: a visually hidden native checkbox (role="switch" so
					     assistive tech announces on/off) drives the drawn track and thumb
					     through peer-checked / peer-focus-visible. -->
					<input
						type="checkbox"
						role="switch"
						bind:checked={showQuantized}
						aria-describedby="quantized-hint"
						class="peer sr-only"
					/>
					<span
						aria-hidden="true"
						class="relative h-8 w-13 shrink-0 rounded-full bg-muted-foreground/25 transition-colors peer-checked:bg-sky-500 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500/50 peer-focus-visible:ring-offset-2 peer-checked:[&>span]:translate-x-5"
					>
						<span
							class="absolute top-0.5 left-0.5 h-7 w-7 rounded-full bg-white transition-transform"
						></span>
					</span>
				</label>
			{/if}
		</div>

		<table class="w-full text-left">
			<tbody>
				{#each family.sizes as s (s.name)}
					<ModelsCatalogSizeRow
						size={s}
						{showQuantized}
						oninstall={(build, size) => (run = { build, size })}
					/>
				{/each}
			</tbody>
		</table>
	</section>
</main>

<ModelsCatalogInstallDialog bind:run />
