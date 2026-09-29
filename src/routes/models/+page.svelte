<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { logoFor } from '$lib/assets/logos';
	import { families, releasedFor, slugify } from '$lib/catalog';
	import { ModelsCatalogVisionBadge } from '$lib/components/app';
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
		<h1 class="text-[30px] font-semibold tracking-tight">Models</h1>
		<p class="mt-2.5 text-[13px] text-muted-foreground tabular-nums">
			Updated {releasedFor(families[0])}
		</p>
		<p class="mt-3 max-w-2xl text-[15px] text-muted-foreground">
			A curated selection of open models — every one runs in llama.app.
		</p>
	</header>

	<!-- All families in one flat list, newest first. The publisher is already
	     legible from each row's name and icon, so we don't group by publisher.
	     Flush full-width rows separated by subtle hairlines. -->
	<div class="flex flex-col">
		{#each families as f, i (f.name)}
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
					     pages and sizes get a distinct silhouette. Memory
					     requirements live on the detail page. -->
					<h3 class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[16px] font-medium">
						<span class="mr-0.5">{f.name}</span>
						{#if f.sizes.some((s) => s.vision)}
							<ModelsCatalogVisionBadge />
						{/if}
						{#each f.sizes as s (s.name)}
							<span
								class="rounded-full bg-muted px-2 py-1 text-[11px] leading-none font-normal text-muted-foreground tabular-nums"
							>
								{s.params ?? s.name}
							</span>
						{/each}
					</h3>
					<p class="mt-0.5 line-clamp-1 text-[15px] text-muted-foreground">{f.description}</p>
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

	<!-- Closing escape hatch: the catalog is curated, not exhaustive, so after
	     the list ends we point at the full GGUF ecosystem for anything we
	     don't carry. -->
	<p class="mt-10 text-[15px] text-muted-foreground">
		Find thousands more GGUF models on
		<!-- whitespace-nowrap so the link never breaks across lines ("Hugging /
		     Face ↗" reads badly and strands the arrow). -->
		<a
			href="https://huggingface.co/models?library=gguf"
			target="_blank"
			rel="noopener"
			class="whitespace-nowrap underline underline-offset-4 hover:text-foreground"
		>
			Hugging Face ↗
		</a>
	</p>
</main>
