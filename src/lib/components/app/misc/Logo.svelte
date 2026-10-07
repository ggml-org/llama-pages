<script lang="ts">
	import logoSvg from '$lib/assets/brand/icon-light.svg?raw';

	interface Props {
		showName?: boolean;
	}

	let { showName }: Props = $props();
</script>

<span class="logo flex items-center text-foreground">
	<!-- logoSvg is a trusted static SVG asset imported via ?raw -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<span class="mark text-foreground">{@html logoSvg}</span>

	{#if showName}
		<span class="font-mono font-medium">llama<span class="text-accent">.cpp</span></span>
	{/if}
</span>

<style>
	.logo {
		gap: var(--logo-gap, 0.75rem);

		.mark :global(svg) {
			height: var(--logo-height, 1.375rem) !important;
			width: auto;

			:global(path) {
				fill: currentColor;
			}
		}

		span {
			font-size: var(--logo-font-size, 1rem);
		}
	}
</style>
