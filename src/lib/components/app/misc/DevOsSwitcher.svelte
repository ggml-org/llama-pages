<script lang="ts">
	// Dev-only switcher for previewing the per-OS content (`data-os-only`,
	// see app.css). It just overwrites `<html data-os>`, which app.html sets
	// from the user agent, so the switch is instant and needs no reload. A
	// reload goes back to the real OS. Rendered by +layout.svelte only when
	// `dev` is true, so it's left out of production builds.
	import { onMount } from 'svelte';

	const OSES = ['mac', 'windows', 'linux', 'other'];

	let current = $state('');

	onMount(() => {
		current = document.documentElement.dataset.os ?? '';
	});

	function select(os: string) {
		document.documentElement.dataset.os = os;
		current = os;
	}
</script>

<div
	class="fixed bottom-4 left-4 z-50 flex gap-0.5 rounded-lg border border-border bg-background p-0.5 font-mono text-xs shadow-lg"
>
	{#each OSES as os (os)}
		<button
			onclick={() => select(os)}
			class="cursor-pointer rounded-md px-2 py-1 {current === os
				? 'bg-foreground text-background'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			{os}
		</button>
	{/each}
</div>
