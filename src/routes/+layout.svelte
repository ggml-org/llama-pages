<script lang="ts">
	import '../app.css';
	import 'prismjs/themes/prism.css';
	import 'prismjs/themes/prism-dark.css';
	import { dev } from '$app/environment';
	import { DevOsSwitcher, SeoMetadata, SiteHeader } from '$lib/components/app';
	import * as deviceStore from '$lib/stores/device/index.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		try {
			deviceStore.init();
		} catch (e) {
			console.error('[device] init failed:', e);
		}
	});
</script>

<SiteHeader />

<SeoMetadata />

<ModeWatcher />

{@render children()}

{#if dev}
	<DevOsSwitcher />
{/if}
