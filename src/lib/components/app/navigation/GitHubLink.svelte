<script lang="ts">
	let { stars }: { stars: number | null | undefined } = $props();

	const formatted = $derived(
		typeof stars === 'number'
			? new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(stars)
			: null
	);
</script>

<a
	href="https://github.com/ggml-org/Llama-macOS"
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
