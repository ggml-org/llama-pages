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
	class="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-foreground/60 hover:text-foreground"
>
	{#if copied}
		<Check class="size-3.5 text-green-500" />
	{:else}
		<Copy class="size-3.5" />
	{/if}
</button>
