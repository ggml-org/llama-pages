<script lang="ts">
	import { connectLlamaModels } from '$lib/stores/llama-models';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(connectLlamaModels);
</script>

{@render children()}
