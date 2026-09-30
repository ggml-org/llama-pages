<script lang="ts">
	// `os` is passed through as `data-os-only` (see app.css), for the
	// header's per-OS links.
	let { href, os, stars }: { href: string; stars: number | null | undefined; os?: string } =
		$props();

	// Counts under 100 are hidden: a tiny number reads as "nobody uses this"
	// rather than "this is new" (the Windows app's repo had 33 when this was
	// written), and no badge is neutral. The badge appears on its own once
	// the repo passes the threshold.
	const MIN_STARS_SHOWN = 100;

	const formatted = $derived(
		typeof stars === 'number' && stars >= MIN_STARS_SHOWN
			? new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(stars)
			: null
	);
</script>

<!-- External GitHub URLs; resolve() is for the app's own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	{href}
	data-os-only={os}
	target="_blank"
	rel="noreferrer"
	class="inline-flex items-center gap-2 text-[15px] text-foreground"
>
	<!-- No underline, like the other non-current nav links: in the header, a
	     solid underline marks the current section. -->
	<span>GitHub</span>

	{#if formatted}
		<span
			class="inline-flex items-center gap-1 rounded-md bg-foreground/8 px-1.5 py-0.5 text-xs text-foreground/70"
		>
			<span aria-hidden="true">★</span>
			{formatted}
		</span>
	{/if}
</a>
