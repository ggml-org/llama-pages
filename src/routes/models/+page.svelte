<script lang="ts">
	import { Check, ChevronRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { logoFor } from '$lib/assets/logos';
	import { families, minMemGB, releasedFor, slugify } from '$lib/catalog';
	import {
		ModelsCatalogLocalBadge,
		ModelsCatalogLocalServer,
		ModelsCatalogVisionBadge
	} from '$lib/components/app';
	import { localModelLabel, modelsForSize } from '$lib/models/local-models';
	import { llamaModels } from '$lib/stores/llama-models';

	// Decision and embedding models get their own sections below the main
	// list: they don't chat, so mixed into a newest-first list of chat models
	// (where, being recent, they'd lead) they'd read as ordinary picks.
	const chatFamilies = families.filter((f) => !f.decision && !f.embedding);
	const decisionFamilies = families.filter((f) => f.decision);
	const embeddingFamilies = families.filter((f) => f.embedding);

	// Starting points, from the catalog's `featured` flag -- the same families
	// the app suggests, so the web and the app recommend the same models. The
	// list below holds the rest, so each family appears once -- on a page this
	// short, a repeat sits on the same screen as the original and reads as a bug.
	const featuredFamilies = chatFamilies.filter((f) => f.featured);
	const otherFamilies = chatFamilies.filter((f) => !f.featured);
</script>

<svelte:head>
	<title>Models — llama.app</title>
	<meta name="description" content="Curated open models you can run locally with llama.cpp." />
</svelte:head>

<main class="mx-auto w-full max-w-6xl px-6 pt-8 pb-24 md:px-12">
	<!-- Header, mirroring the model detail pages: headline / byline / standfirst.
	     The byline carries the one catalog-level fact not visible in the list
	     itself: how fresh the curation is (the newest family's release month).
	     The standfirst states what the catalog is (a curated shortlist,
	     everything runs in the app) so the list below reads as a
	     recommendation, not an attempt at completeness. -->
	<header class="mb-10">
		<div class="flex flex-col items-start gap-5 sm:flex-row sm:justify-between sm:gap-6">
			<div>
				<h1 class="text-[30px] font-semibold tracking-tight">Models</h1>
				<p class="mt-2.5 text-[13px] text-muted-foreground tabular-nums">
					Updated {releasedFor(families[0])}
				</p>
			</div>
			<ModelsCatalogLocalServer />
		</div>
		<p class="mt-3 max-w-2xl text-[15px] text-muted-foreground">
			A curated selection of open models — every one runs in llama.app.
		</p>
	</header>

	<!-- Starting points first: a newest-first list puts whatever shipped last at
	     the top, which isn't necessarily a good first model. -->
	<section>
		<h2 class="mb-2 text-[20px] font-semibold tracking-tight">Good places to start</h2>
		{@render familyList(featuredFamilies)}
	</section>

	<!-- The remaining chat model families in one flat list, newest first. The
	     publisher is already legible from each row's name and icon, so we don't
	     group by publisher. Flush full-width rows separated by subtle hairlines. -->
	<section class="mt-14">
		<h2 class="mb-2 text-[20px] font-semibold tracking-tight">More models</h2>
		{@render familyList(otherFamilies)}
	</section>

	<!-- Decision models: a short explainer, since the concept is new and the
	     only way to use one is the API, then the same rows. -->
	{#if decisionFamilies.length > 0}
		<section class="mt-14">
			<h2 class="text-[20px] font-semibold tracking-tight">Decision models</h2>
			<p class="mt-2 mb-4 max-w-2xl text-[15px] text-muted-foreground">
				Models that take a document and typed questions, and return a probability for each option --
				route a ticket, moderate content, pick an agent’s next step. They don’t chat; apps call them
				through the API.
				<a
					href="https://huggingface.co/blog/ggml-org/decision-models-in-llamacpp"
					target="_blank"
					rel="noopener"
					class="whitespace-nowrap underline hover:text-foreground">How to use ↗</a
				>
			</p>
			{@render familyList(decisionFamilies)}
		</section>
	{/if}

	<!-- Embedding models: same shape as the decision section -- what they're
	     for, that the API is the way in, then the rows. -->
	{#if embeddingFamilies.length > 0}
		<section class="mt-14">
			<h2 class="text-[20px] font-semibold tracking-tight">Embedding models</h2>
			<p class="mt-2 mb-4 max-w-2xl text-[15px] text-muted-foreground">
				Models that turn text — and, for some, images and audio — into vectors, for search,
				retrieval, and clustering. They don’t chat; apps call them through the API.
				<a
					href="https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#post-v1embeddings-openai-compatible-embeddings-api"
					target="_blank"
					rel="noopener"
					class="whitespace-nowrap underline hover:text-foreground">How to use ↗</a
				>
			</p>
			{@render familyList(embeddingFamilies)}
		</section>
	{/if}

	<!-- Closing escape hatch: the catalog is curated, not exhaustive, so after
	     the list ends we point at the full GGUF ecosystem for anything we
	     don't carry. On a Mac it also says how to install one: Llama is
	     listed under "Use this model" on a model's page (as `llama-app` in
	     huggingface.js's local-apps.ts, which opens the app's
	     `llama://install` deep link). Mac only: the HF entry is macOS-only,
	     and the Windows app doesn't handle the deep link yet. -->
	<p class="mt-10 text-[15px] text-muted-foreground">
		Find thousands more GGUF models on
		<!-- whitespace-nowrap so the link never breaks across lines ("Hugging /
		     Face ↗" reads badly and strands the arrow). -->
		<a
			href="https://huggingface.co/models?library=gguf"
			target="_blank"
			rel="noopener"
			class="whitespace-nowrap underline hover:text-foreground"
		>
			Hugging Face ↗</a
		><span data-os-only="mac">, then choose Llama under “Use this model” on a model’s page</span>.
	</p>
</main>

{#snippet familyList(list: typeof families)}
	<div class="flex flex-col">
		{#each list as f, i (f.name)}
			{@const localSizes = f.sizes.map((size) => modelsForSize(size, $llamaModels.models))}
			{#if i > 0}
				<div aria-hidden="true" class="border-t border-border/40"></div>
			{/if}
			<a href={resolve(`/models/${slugify(f.name)}`)} class="group flex items-start gap-3.5 py-3.5">
				<!-- Brand mark in its own leading column, like a bullet: fixed width
				     so every row's text block starts at the same x, vertically
				     centered against the 16px name line. -->
				<span
					aria-hidden="true"
					class="mt-0.5 flex h-6 w-4.5 shrink-0 items-center [&>svg]:h-4.5 [&>svg]:w-4.5"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html logoFor(f.brand)}
				</span>
				<div class="min-w-0 flex-1">
					<!-- Name line: family name followed inline by its size pills, so
					     "name + configurations" reads as one unit and each row stays
					     two lines tall. The pills are one bounded chip per size so
					     they read as discrete configurations rather than a run-on
					     string; fully rounded rather than rounded-md, because the
					     rounded-md filled chip is the quant badge on the detail
					     pages and sizes get a distinct silhouette. -->
					<h3 class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[16px] font-medium">
						<span class="mr-0.5">{f.name}</span>
						{#if f.sizes.some((s) => s.vision)}
							<ModelsCatalogVisionBadge />
						{/if}
						{#each f.sizes as s, sizeIndex (s.name)}
							{@const localModels = localSizes[sizeIndex]}
							{@const loaded = localModels.some((model) => model.loaded)}
							<span
								class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] leading-none font-normal tabular-nums {loaded
									? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
									: localModels.length
										? 'bg-green-500/10 text-green-700 dark:text-green-400'
										: 'bg-muted text-muted-foreground'}"
								title={localModels.length
									? `${s.name} — ${localModels.map((model) => `${localModelLabel($llamaModels.base, model.loaded)}: ${model.quant ?? 'unspecified quantization'}`).join('; ')}`
									: undefined}
							>
								{#if localModels.length}
									<Check class="size-2.5" aria-hidden="true" />
								{/if}
								{s.params ?? s.name}
							</span>
						{/each}
						{#if localSizes.some((models) => models.length > 0)}
							<ModelsCatalogLocalBadge
								loaded={localSizes.some((models) => models.some((model) => model.loaded))}
							/>
						{/if}
						<!-- The family's memory floor -- what the smallest build needs --
						     so "will it run on my computer?" is answered while scanning,
						     without opening every detail page (which lists each build's
						     own requirement). Phrased like those ("16 GB+ memory") so the
						     two read as one system, and as plain text rather than a pill,
						     so it doesn't pass for another size. -->
						{#if minMemGB(f)}
							<span class="ml-1 text-[12px] font-normal text-muted-foreground tabular-nums">
								{minMemGB(f)} GB+ memory
							</span>
						{/if}
						<!-- Flagged here, where people pick a model, rather than only in
						     the detail page's license line: "CC BY-NC 4.0" doesn't read
						     as a restriction to most visitors, and the description that
						     spells it out is clamped to one line on this list. Plain amber
						     text, not a pill, so it doesn't pass for another size. -->
						{#if f.nonCommercial}
							<span class="ml-1 text-[12px] font-normal text-amber-700 dark:text-amber-400">
								Non-commercial
							</span>
						{/if}
					</h3>
					<p class="mt-0.5 line-clamp-1 text-[15px] text-muted-foreground">
						{#each f.description.split(/(\*\*[^*]+\*\*)/g) as part, i (i)}
							{#if part.startsWith('**') && part.endsWith('**')}
								<strong class="font-semibold">{part.slice(2, -2)}</strong>
							{:else}
								{part}
							{/if}
						{/each}
					</p>
				</div>
				<!-- Trailing chevron: signals each row is a link to a detail page.
				     Centered against the whole row (self-center overrides the row's
				     items-start). -->
				<ChevronRight
					aria-hidden="true"
					class="h-5 w-5 shrink-0 self-center text-muted-foreground/50"
				/>
			</a>
		{/each}
	</div>
{/snippet}
