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
	     release date as a byline under it and the one-line summary last --
	     headline / byline / standfirst. The brand isn't repeated here: the
	     title contains it and the summary opens by naming the publisher. -->
	<header>
		<h1 class="text-[30px] font-semibold tracking-tight">{family.name}</h1>
		<div class="mt-2.5 text-[13px] text-muted-foreground">
			<span class="tabular-nums">{releasedFor(family)}</span>
		</div>
		<p class="mt-3 max-w-xl text-[15px] text-muted-foreground">{family.description}</p>
		<!-- Decision models don't chat, and nothing else on the page says so --
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
		{/if}
	</header>

	<section class="mt-10">
		<!-- Section header line: a heading on the left anchors the row, with the
		     quantization toggle as the right-aligned control. The toggle's full
		     explanation lives in the info icon's tooltip -- the one place the
		     site explains what quantization is. -->
		<div class="mb-2 flex items-center justify-between">
			<h2 class="text-[13px] text-muted-foreground">Sizes</h2>
			{#if hasQuantized}
				<div class="flex items-center gap-1.5">
					<label class="flex cursor-pointer items-baseline gap-2 text-[13px] text-muted-foreground">
						<input type="checkbox" bind:checked={showQuantized} class="accent-sky-500" />
						<span>Show smaller quantizations</span>
					</label>
					<!-- Info icon carrying the quantization explainer. A native title
					     tooltip on hover; explicit rather than hiding the hint on the
					     label itself, so it's discoverable. -->
					<span
						class="cursor-help text-muted-foreground/70"
						title="Quantized further to run in less memory, at a small cost in quality."
					>
						<svg
							aria-label="What are smaller quantizations?"
							role="img"
							viewBox="0 0 16 16"
							class="h-3.5 w-3.5"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						>
							<circle cx="8" cy="8" r="6.5" />
							<path d="M6.3 6.2a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.5-.7 1v.3" />
							<circle cx="8" cy="11.3" r="0.1" stroke-width="1.6" />
						</svg>
					</span>
				</div>
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
