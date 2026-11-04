<script lang="ts">
	import ModelsCatalogVisionBadge from './ModelsCatalogVisionBadge.svelte';
	import type { InputModality } from '$lib/catalog';

	let { modalities }: { modalities: InputModality[] } = $props();
</script>

{#if modalities.includes('image')}
	<ModelsCatalogVisionBadge />
{/if}
{#if modalities.includes('audio')}
	<span class="text-[11px] text-sky-600" title="Supports audio input">Audio</span>
{/if}
{#if modalities.includes('video')}
	<span class="text-[11px] text-sky-600" title="Supports video input">Video</span>
{/if}
