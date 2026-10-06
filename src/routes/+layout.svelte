<script lang="ts">
	import '../app.css';
	import 'prismjs/themes/prism.css';
	import 'prismjs/themes/prism-dark.css';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { DevOsSwitcher, SeoMetadata, SiteHeader } from '$lib/components/app';
	import * as deviceStore from '$lib/stores/device/index.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Auxiliary pages are dead ends people are redirected to, not places to
	// navigate from, so they render without the site chrome. If this list ever
	// grows past a couple of entries, move the header into a (site) route group
	// instead.
	const CHROMELESS_ROUTES = ['/subscribed'];

	// Trailing slash stripped because whether one is present depends on the
	// host, not on us -- Mailcoach redirects to the bare /subscribed, but a
	// host that normalises to /subscribed/ would otherwise show the header.
	const showHeader = $derived(
		!CHROMELESS_ROUTES.includes(page.url.pathname.replace(/\/$/, '') || '/')
	);

	onMount(() => {
		try {
			deviceStore.init();
		} catch (e) {
			console.error('[device] init failed:', e);
		}
	});
</script>

{#if showHeader}
	<SiteHeader />
{/if}

<SeoMetadata />

<ModeWatcher />

{@render children()}

{#if dev}
	<DevOsSwitcher />
{/if}
