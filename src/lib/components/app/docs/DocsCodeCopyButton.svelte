<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';
	import { COPY_FEEDBACK_MS } from '$lib/constants';

	interface Props {
		getText: () => string;
	}

	let { getText }: Props = $props();

	let copied = $state(false);

	async function copy() {
		await navigator.clipboard.writeText(getText());
		copied = true;
		setTimeout(() => (copied = false), COPY_FEEDBACK_MS);
	}
</script>

<button
	type="button"
	onclick={copy}
	aria-label="Copy code"
	title="Copy code"
	class="absolute top-2 right-2 inline-flex cursor-pointer items-center rounded-md border border-border bg-background/80 p-1.5 text-foreground/60 backdrop-blur-sm transition-opacity hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
>
	{#if copied}
		<Check class="size-3.5 text-green-500" />
	{:else}
		<Copy class="size-3.5" />
	{/if}
</button>
