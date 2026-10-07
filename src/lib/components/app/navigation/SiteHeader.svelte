<script lang="ts">
	import { Monitor, Moon, Sun } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { GitHubLink, Logo } from '$lib/components/app';
	import { LLAMA_CPP_REPO_URL, MACOS_REPO_URL, WINDOWS_REPO_URL } from '$lib/constants';
	import { setMode, userPrefersMode } from 'mode-watcher';

	// Keyed by repo URL (see +layout.server.ts).
	const stars = $derived(page.data.stars as Record<string, number | null> | undefined);

	// Whether we're anywhere in the Models section (the catalog index or a family
	// detail page), which highlights the permanent "Models" nav link.
	const onModels = $derived(
		page.url.pathname === '/models' || page.url.pathname.startsWith('/models/')
	);

	// Whether we're anywhere in the Docs section, which highlights the permanent
	// "Docs" nav link.
	const onDocs = $derived(page.url.pathname === '/docs' || page.url.pathname.startsWith('/docs/'));

	// The GitHub link goes to the source of what the page offers. The docs
	// describe llama.cpp, so there it's llama.cpp's repo. Elsewhere it's the
	// repo of the app offered to the visitor's OS, matching the homepage's
	// "View on GitHub" button: the Mac app's for Mac and everyone else
	// (phones, crawlers), the Windows app's for Windows. Linux has no app and
	// is offered the command-line install, which is llama.cpp. Switched with
	// `data-os-only` (see app.css), so the prerendered page never flashes the
	// wrong link.
	const APP_REPOS = [
		{ os: 'mac other', url: MACOS_REPO_URL },
		{ os: 'windows', url: WINDOWS_REPO_URL },
		{ os: 'linux', url: LLAMA_CPP_REPO_URL }
	];

	// Nav links are full-strength text, like the GitHub link on the right --
	// muted gray read as disabled. The current section sits on a soft gray
	// pill, the site's `bg-foreground/6` chip tint. Every link carries the
	// pill's padding, cancelled by equal negative margins, so the pill draws
	// around the text without moving it or the header's height. No hover
	// states: the pointer cursor already signals interactivity, and hover
	// does nothing on touch screens.
	function navLinkClass(active: boolean) {
		return `-mx-2 -my-1 rounded-md px-2 py-1 text-foreground${active ? ' bg-foreground/6' : ''}`;
	}

	const NEXT_MODE = { dark: 'system', light: 'dark', system: 'light' } as const;

	function cycleMode() {
		setMode(NEXT_MODE[userPrefersMode.current]);
	}
</script>

<header class="mx-auto flex w-full max-w-6xl items-center justify-between p-6 md:px-12">
	<!-- Left: the logo (home) plus permanent site nav. A vertical hairline after
	     the logo separates brand from nav, so the link doesn't read as part of
	     the wordmark. "Models" always links to the catalog and is highlighted while
	     you're anywhere in the section; the page itself names where you are
	     (each page leads with its own h1). Gaps widen from md up; phones keep
	     the tighter gap so both sides still fit on one row. -->
	<nav class="flex items-center gap-4 text-[15px] md:gap-6">
		<a href={resolve('/')}>
			<Logo --logo-height="1.5rem" />
		</a>

		<span aria-hidden="true" class="h-5 w-px bg-border"></span>

		<a
			href={resolve('/models')}
			aria-current={onModels ? 'page' : undefined}
			class={navLinkClass(onModels)}
		>
			Models
		</a>

		<a
			href={resolve('/docs')}
			aria-current={onDocs ? 'page' : undefined}
			class={navLinkClass(onDocs)}
		>
			Docs
		</a>
	</nav>

	<div class="flex items-center gap-4 md:gap-6">
		{#if onDocs}
			<GitHubLink href={LLAMA_CPP_REPO_URL} stars={stars?.[LLAMA_CPP_REPO_URL]} />
		{:else}
			{#each APP_REPOS as r (r.url)}
				<GitHubLink href={r.url} stars={stars?.[r.url]} os={r.os} />
			{/each}
		{/if}

		<button
			type="button"
			onclick={cycleMode}
			class="-m-1.5 inline-flex cursor-pointer items-center rounded-md p-1.5 text-foreground/70"
			aria-label="Theme: {userPrefersMode.current} (click to change)"
			title="Theme: {userPrefersMode.current}"
		>
			{#if userPrefersMode.current === 'light'}
				<Sun class="size-4" />
			{:else if userPrefersMode.current === 'dark'}
				<Moon class="size-4" />
			{:else}
				<Monitor class="size-4" />
			{/if}
		</button>
	</div>
</header>
