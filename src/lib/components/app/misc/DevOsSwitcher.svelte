<script lang="ts">
	// Dev-only switcher for previewing the per-OS content (`data-os-only`,
	// see app.css). It just overwrites `<html data-os>`, which app.html sets
	// from the user agent, so the switch is instant and needs no reload. A
	// reload goes back to the real OS. Rendered by +layout.svelte only when
	// `dev` is true, so it's left out of production builds. The number keys
	// 1-4 pick the OSes in the order shown, for flipping between them fast.
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

	// Ignored while typing (e.g. in the models page's search) or with a
	// modifier held, so it doesn't steal real input or browser shortcuts.
	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		const t = e.target as HTMLElement;

		if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;

		const os = OSES[Number(e.key) - 1];

		if (os) select(os);
	}
</script>

<svelte:window {onkeydown} />

<div
	class="fixed bottom-4 left-4 z-50 flex gap-0.5 rounded-lg border border-border bg-background p-0.5 font-mono text-xs shadow-lg"
>
	{#each OSES as os, i (os)}
		<button
			onclick={() => select(os)}
			class="cursor-pointer rounded-md px-2 py-1 {current === os
				? 'bg-foreground text-background'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			<span class="opacity-50">{i + 1}</span>
			{os}
		</button>
	{/each}
</div>
