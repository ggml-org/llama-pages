<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { localModelLabel } from '$lib/models/local-models';
	import { llamaModels } from '$lib/stores/llama-models';

	let { loaded = false, quants }: { loaded?: boolean; quants?: string } = $props();
</script>

<span
	class="inline-flex items-center gap-1 text-xs font-normal whitespace-nowrap {loaded
		? 'text-blue-700 dark:text-blue-400'
		: 'text-green-700 dark:text-green-400'}"
>
	<Check class="size-3" aria-hidden="true" />
	{localModelLabel($llamaModels.base, loaded)}{quants ? `: ${quants}` : ''}
</span>
