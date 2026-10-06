<script lang="ts">
	// Where the homepage's download buttons lead. It starts the download
	// itself, then uses the moment for what someone who just clicked
	// Download needs next, and for the newsletter, since this is when
	// visitors are most interested in hearing more.
	//
	// Two steps, each a picture: getting the app installed, and finding it
	// afterwards. The second is where people get lost -- Llama has no window,
	// so opening it looks like nothing happened unless you know to look in
	// the menu bar or the tray.
	//
	// One page per app (see +page.server.ts). The steps are per OS, not per
	// visitor: someone on a phone who taps "Download for Mac" gets the Mac
	// steps.
	import { ArrowRight, BatteryCharging, ChevronUp, Folder, Volume2, Wifi } from '@lucide/svelte';
	import { dev } from '$app/environment';
	import macAppIcon from '$lib/assets/brand/app-icon-mac.png';
	import { Logo, MacStatusIcon, NewsletterSignup } from '$lib/components/app';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	// Started from the page rather than by the button, so the button can
	// bring people here. The file is served as an attachment, so the browser
	// saves it and stays on this page.
	//
	// Once per tab: without the guard, every reload or Back-and-Forward
	// downloads another copy, which the browser saves as `Llama (1).dmg` --
	// no longer the file the steps tell people to open. Retrying is what the
	// "Download it directly" link is for. sessionStorage can throw (blocked
	// storage); then the download just starts every time, as without it.
	//
	// (If the Windows file couldn't be resolved at build time, this goes to
	// the release page instead, as the button used to.)
	//
	// Skipped in development (`npm run dev`), so working on the page doesn't
	// fill Downloads with copies; `vite preview` serves the production build
	// and still downloads.
	onMount(() => {
		if (dev) {
			console.info('[download] skipped in dev:', data.downloadUrl);

			return;
		}

		const key = `download-started:${data.os}`;

		try {
			if (sessionStorage.getItem(key)) {
				return;
			}

			sessionStorage.setItem(key, '1');
		} catch {
			// storage unavailable -- start the download anyway
		}

		window.location.href = data.downloadUrl;
	});
</script>

<svelte:head>
	<title>Download Llama — llama.app</title>
	<!-- Opening this page starts a download, which would be a surprise for
	     someone arriving from a search result. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- A step: the picture on top, then the numbered title and its text.
     Picture first, unlike the homepage's cards (text first, see its
     lightCard): here the pictures carry the steps -- you can follow them
     from the pictures alone -- and the text is the detail. Cards and type
     are the homepage's (see its primitives comment).

     The pictures share one height (h-48), each filling it, so the two
     side by side read as a pair; it's about the install window's natural
     height. -->
{#snippet step(picture: Snippet, title: string, body: Snippet)}
	<div
		class="flex flex-col gap-6 rounded-xl border border-border/30 bg-muted/30 p-6 shadow-sm dark:border-border/20"
	>
		<div aria-hidden="true" class="h-48">{@render picture()}</div>

		<div class="flex flex-col">
			<h2 class="font-semibold">{title}</h2>
			<p class="leading-relaxed text-pretty text-foreground/70">{@render body()}</p>
		</div>
	</div>
{/snippet}

<!-- The pictures' wallpaper: the homepage hero shot's sky, simplified. -->
{#snippet wallpaper(children: Snippet, cls: string)}
	<div
		class="flex h-full flex-col rounded-lg bg-[linear-gradient(160deg,#c4ddf6_0%,#d0e4f7_55%,#dfecf9_100%)] p-4 dark:bg-[linear-gradient(160deg,#152238_0%,#172a42_55%,#1a3049_100%)] {cls}"
	>
		{@render children()}
	</div>
{/snippet}

<!-- Mac, step 1: the dmg's window, Llama's icon and an arrow to the
     Applications folder, as the real dmg lays them out. The icon is the
     app's own artwork (copied from the Llama repo's AppIcon.appiconset, the
     256px one, for 2x screens), so it's what people will see in Finder;
     it includes macOS's standard margin around the tile, as the folder
     icon has its own. -->
{#snippet macInstallPicture()}
	<div class="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
		<div class="flex items-center gap-1.5 border-b border-border px-3 py-2">
			<span class="size-2.5 rounded-full bg-[#ff5f57]"></span>
			<span class="size-2.5 rounded-full bg-[#febc2e]"></span>
			<span class="size-2.5 rounded-full bg-[#28c840]"></span>
			<span class="flex-1 text-center text-[11px] text-muted-foreground">Llama</span>
			<!-- Balances the traffic lights, so the title is centered -->
			<span class="w-[42px]"></span>
		</div>

		<!-- A grid rather than three columns of icon-over-label, so the arrow
		     centers on the icons' row instead of on icon and label together,
		     which put it below the icons' middle -->
		<div
			class="grid flex-1 grid-cols-[auto_auto_auto] content-center items-center justify-center justify-items-center gap-x-6 gap-y-2 px-6"
		>
			<!-- The app's real icon, as Finder shows it in the dmg -->
			<img src={macAppIcon} alt="" class="size-16" />
			<ArrowRight class="size-6 text-highlight" />
			<Folder class="size-16 fill-sky-300 stroke-sky-500" strokeWidth={1} />

			<!-- Finder's labels are full-strength text, not dimmed -->
			<span class="text-[11px] text-foreground">Llama</span>
			<span></span>
			<span class="text-[11px] text-foreground">Applications</span>
		</div>
	</div>
{/snippet}

<!-- Mac, step 2: the menu bar with Llama's icon and the "Hello, I'm Llama"
     hint the app shows under it on first launch (MenuController).

     Llama's icon sits in the middle of the picture, with the hint hanging
     under it, and the system's status icons and the clock to its right, as
     in a real bar, where apps' icons come before the system's. Status icons
     and type are the homepage hero shot's (see its menu bar). The grid's
     equal outer columns center the icon (minmax(0,1fr), so a crowded right
     column can't push it off center); the right one spreads the system
     items across its width (justify-between), with an empty first item so
     the gap after Llama's icon matches the others.

     Half the picture leaves little room for the system items, and how
     little depends on the picture's width, so the set follows it (container
     queries on the wallpaper), keeping the gaps close to macOS's: Wi-Fi,
     battery and the time in narrow pictures (phones, and two columns on
     small tablets); Spotlight and Control Center added in the two columns
     on wider screens; sound and the day too in the wide single-column
     pictures on large phones and small tablets. -->
{#snippet macBar()}
	<div
		class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center text-xs font-medium text-foreground/85"
	>
		<span></span>

		<span class="relative flex h-5 items-center rounded-full bg-foreground/15 px-2">
			<Logo --logo-height="0.75rem" />

			<!-- The app's hint is a plain NSPopover, which macOS draws translucent
			     white in light mode and translucent dark gray (not black) in dark
			     mode, with a hairline edge that keeps it apart from the wallpaper.

			     The arrow is a rotated square with the same edge on its two outer
			     sides, drawn over the bubble's edge where they meet. Both are solid
			     and the layer holding them is made translucent as a whole
			     (opacity), so where the arrow overlaps the bubble doesn't show as
			     a darker patch. The text sits outside that layer, so it stays
			     opaque. No backdrop blur: the wallpaper is near-flat, so it would
			     have nothing to blur. -->
			<span
				class="absolute top-full left-1/2 mt-3 -translate-x-1/2 px-4 py-2.5 text-sm font-normal whitespace-nowrap text-foreground"
			>
				<span class="absolute inset-0 opacity-80">
					<span
						class="absolute inset-0 rounded-xl bg-white dark:border dark:border-white/15 dark:bg-neutral-700"
					></span>
					<span
						class="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-white dark:border-t dark:border-l dark:border-white/15 dark:bg-neutral-700"
					></span>
				</span>
				<span class="relative">Hello, I’m Llama</span>
			</span>
		</span>
		<span class="flex items-center justify-between">
			<span></span>
			<MacStatusIcon name="sound" class="@max-[28rem]:hidden" />
			<MacStatusIcon name="wifi" />
			<MacStatusIcon name="battery" />
			<MacStatusIcon name="spotlight" class="@max-[20rem]:hidden" />
			<MacStatusIcon name="controlCenter" class="@max-[20rem]:hidden" />
			<span><span class="@max-[28rem]:hidden">Wed&nbsp;</span>10:24</span>
		</span>
	</div>
{/snippet}

{#snippet macFindPicture()}
	{@render wallpaper(macBar, '@container')}
{/snippet}

<!-- Windows, step 1: App Installer's prompt, reduced to the app and its
     Install button. -->
{#snippet windowsInstallPicture()}
	<div
		class="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background font-['Segoe_UI_Variable_Text','Segoe_UI',system-ui,sans-serif]"
	>
		<div
			class="flex items-center border-b border-border px-3 py-2 text-[11px] text-muted-foreground"
		>
			<span class="flex-1">App Installer</span>
			<span class="tracking-[0.5em]">– ☐ ✕</span>
		</div>

		<div class="flex flex-1 items-center gap-4 px-6">
			<span
				class="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-background"
			>
				<Logo --logo-height="1.5rem" />
			</span>
			<span class="flex-1 text-lg font-semibold">Install Llama?</span>
			<span class="rounded-md bg-[#0067c0] px-5 py-1.5 text-sm text-white">Install</span>
		</div>
	</div>
{/snippet}

<!-- Windows, step 2: the taskbar's tray, as on the homepage (see its
     Windows picture): "show hidden icons", Llama, then network, sound,
     battery and the clock. -->
{#snippet windowsTray()}
	<div
		class="flex h-12 items-center justify-end rounded-r-lg border border-l-0 border-white/60 bg-white/70 mask-[linear-gradient(to_right,transparent,black_45%)] px-1 font-['Segoe_UI_Variable_Text','Segoe_UI',system-ui,sans-serif] text-xs text-foreground/85 backdrop-blur-xl dark:border-white/10 dark:bg-black/45"
	>
		<span class="flex items-center gap-1">
			<ChevronUp class="mx-1 size-4" />
			<span class="flex h-9 items-center rounded-md bg-foreground/10 px-2">
				<Logo --logo-height="0.75rem" />
			</span>
			<span class="flex h-9 items-center gap-2.5 rounded-md px-2">
				<Wifi class="size-4" />
				<Volume2 class="size-4" />
				<BatteryCharging class="size-4" />
			</span>
			<span class="flex flex-col items-end px-1 leading-4">
				<span>10:24 AM</span>
				<span>9/23/2026</span>
			</span>
		</span>
	</div>
{/snippet}

{#snippet windowsFindPicture()}
	{@render wallpaper(windowsTray, 'justify-end')}
{/snippet}

{#snippet macInstallBody()}
	Open <span class="font-mono text-[0.9em]">Llama.dmg</span> from your Downloads folder, then drag Llama
	onto the Applications folder.
{/snippet}

{#snippet macFindBody()}
	Open Llama from Applications. It has no window, so click its icon in the menu bar and pick a
	model.
{/snippet}

{#snippet windowsInstallBody()}
	Open the <span class="font-mono text-[0.9em]">.msixbundle</span> file from your Downloads folder, then
	click Install. Windows sets Llama up and opens it.
{/snippet}

{#snippet windowsFindBody()}
	Llama has no window. It lives in the system tray, next to the clock. Don’t see it? Click the
	<span class="font-mono text-[0.9em]">^</span> arrow there to show hidden icons.
{/snippet}

<main class="mx-auto w-full max-w-6xl px-6 md:px-12">
	<section class="flex flex-col items-center gap-4 pt-16 pb-12 text-center md:pt-24">
		<h1 class="text-4xl leading-tight font-semibold tracking-tight">Your download is starting</h1>

		<!-- For when the browser blocked or dropped the automatic download,
		     and for downloading again (the automatic one runs once per tab).
		     A plain link to the file, so it's also what to right-click to
		     copy the download's address. Muted, as a fallback most won't
		     need; the link is marked by its underline alone, in the line's
		     color, as links in text are on the homepage. -->
		<p class="text-sm text-muted-foreground">
			Didn’t start?
			<a href={data.downloadUrl} rel="external" class="underline">Download it directly</a>
		</p>
	</section>

	<div class="mx-auto flex max-w-4xl flex-col gap-4 pb-40">
		<section class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#if data.os === 'mac'}
				{@render step(macInstallPicture, '1. Drag Llama to Applications', macInstallBody)}
				{@render step(macFindPicture, '2. Find it in the menu bar', macFindBody)}
			{:else}
				{@render step(windowsInstallPicture, '1. Install Llama', windowsInstallBody)}
				{@render step(windowsFindPicture, '2. Find it in the tray', windowsFindBody)}
			{/if}
		</section>

		<!-- Right under the cards, same width and gap, so it reads as part of
		     the page's main group rather than a footer. -->
		<NewsletterSignup />
	</div>
</main>
