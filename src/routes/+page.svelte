<script lang="ts">
	// The homepage.
	//
	// Who it's for: mostly developers, but developers who are new to local
	// AI. The 10M-users goal means most visitors are *not* local-model
	// enthusiasts, and being a developer doesn't change that -- they know
	// what an API is, not what quantization or context size to pick. So the
	// page assumes technical comfort but no local-AI knowledge, and it
	// frames Llama as a platform from the very top -- chat is shown as one
	// app among several that use the same local model, never as the product
	// itself.
	//
	// Section order follows the questions a visitor asks, in order:
	//   1. What is this?            -- hero text: a tiny menu bar app, two uses
	//   2. What does it look like?  -- the real menu, with numbered callouts
	//   3. How is it a platform?    -- "Like OpenAI": chat for you, API for apps
	//   4. Is it hard?              -- "Nothing to set up": what Llama tunes
	//   5. Is it heavy?             -- 4 MB, models stored once, unloads when idle
	//   6. Will it run on my Mac?   -- models by memory tier
	//   7. Can I build on it?       -- the API, one changed line
	//   8. Why not bundle my own?   -- without/with diagram
	//   9. How do I get it?         -- the app, or the engine on its own
	//
	// The page adapts to the visitor's OS: Mac visitors get the Mac app,
	// Windows visitors the Windows app, Linux visitors the CLI, and everyone
	// else (phones, crawlers) both apps. The hero shot has a Mac and a Windows
	// version; the other pictures and most of the facts are the Mac app's,
	// since that's the reference design the Windows app is following; for
	// other visitors the copy says "your computer" rather
	// than "your Mac". The switching is done with `data-os-only` (see
	// app.css) rather than in Svelte, so the prerendered page never flashes
	// the wrong OS's button before hydration.
	import {
		ArrowDown,
		ArrowRight,
		ArrowUpRight,
		BatteryCharging,
		Braces,
		Check,
		ChevronRight,
		ChevronUp,
		Code,
		Copy,
		FileText,
		Gauge,
		Image,
		Layers,
		LayoutGrid,
		MessageSquare,
		Package,
		ScrollText,
		Terminal,
		Volume2,
		Wifi,
		Zap
	} from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import appleIcon from '$lib/assets/apple-icon.svg?raw';
	import { logoFor } from '$lib/assets/logos';
	import windowsIcon from '$lib/assets/windows-icon.svg?raw';
	import { families, minMemGB, slugify } from '$lib/catalog';
	import { CopyButton, InstallCommand, Logo } from '$lib/components/app';
	import { Button } from '$lib/components/ui/button';
	import {
		MACOS_DOWNLOAD_URL,
		MACOS_REPO_URL,
		SITE_DESCRIPTION,
		SITE_TITLE,
		WINDOWS_REPO_URL
	} from '$lib/constants';
	import Prism from '$lib/prism';
	import type { Snippet } from 'svelte';

	let { data } = $props();

	// -- Hero GitHub button ---------------------------------------------------------
	//
	// One per OS (see the button's comment); `os` is its `data-os-only`.
	const GITHUB_REPOS = [
		{ os: 'mac other', url: MACOS_REPO_URL },
		{ os: 'windows', url: WINDOWS_REPO_URL }
	];

	// -- "Like OpenAI" clients ----------------------------------------------------
	//
	// Kinds of apps that use the API. Pi is the one integration named, since
	// it's the one we ship a plugin for.
	const CLIENTS = [
		{ example: 'Pi', icon: Terminal, label: 'Coding agents' },
		{ example: 'OpenAI-compatible', icon: Code, label: 'Editors' },
		{ example: 'OpenAI-compatible', icon: MessageSquare, label: 'Chat apps' },
		{ example: 'Any OpenAI SDK', icon: Braces, label: 'Your own code' }
	];

	// -- Menu frame -----------------------------------------------------------------
	//
	// The menu's material and edge, shared by the Mac menu and the Windows
	// flyout (see the Mac menu's comment); each adds its own corners. The
	// border stays at 1px, since the edge markers' offset counts it.
	const MENU_FRAME =
		'border border-white/70 bg-background/85 p-3 text-sm shadow-[0_0_0_1px_rgb(0_0_0/0.15),0_16px_40px_-8px_rgb(0_0_0/0.3)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/12 dark:shadow-[0_0_0_1px_rgb(0_0_0/0.7),0_16px_40px_-8px_rgb(0_0_0/0.6)]';

	// -- Menu mock ------------------------------------------------------------------
	//
	// Rows as the shipping menu shows them (lowercase family names, a size
	// chip), with real download sizes from the catalog. `loaded` marks the
	// model currently in memory, which the app shows as a solid blue logo
	// circle -- one touch of color that also says "it's running".
	type MenuModel = {
		brand: string;
		loaded?: boolean;
		name: string;
		params: string;
		size: string;
	};

	const MENU_INSTALLED: MenuModel[] = [
		{ brand: 'Qwen', loaded: true, name: 'Qwen3.8', params: '27B', size: '19.0 GB' },
		{ brand: 'OpenAI', name: 'gpt-oss', params: '20B', size: '12.1 GB' },
		{ brand: 'Gemma', name: 'gemma-4', params: 'E4B', size: '4.59 GB' }
	];

	const MENU_RECOMMENDED: MenuModel[] = [
		{ brand: 'Gemma', name: 'gemma-4', params: '12B', size: '7.22 GB' }
	];

	// -- Nothing to set up --------------------------------------------------------
	//
	// The settings Llama decides so users don't have to, each paired with how
	// it decides. Newcomers can skip the jargon and still get the point (it's
	// handled); enthusiasts, who know these settings, see that the choices
	// are real and sensible. Every rule here mirrors the app's code
	// (`ModelManager.generatedModelSections` and the catalog's quant pick),
	// so keep them in sync -- if the app stops doing one, drop the row.
	//
	// Each row gets an icon so the card reads as a settings screen at a
	// glance, before any of the jargon has to be parsed.
	const TUNED = [
		{ how: 'Highest precision that fits in memory', icon: Gauge, setting: 'Quantization' },
		{ how: 'Only sizes that fit in memory', icon: ScrollText, setting: 'Context size' },
		{ how: 'On for models that understand images', icon: Image, setting: 'Image input' },
		{ how: 'On for models that support it', icon: Zap, setting: 'Speculative decoding' },
		{ how: 'Larger on Macs with 32 GB or more', icon: Layers, setting: 'Batch size' }
	];

	// The model named in the card's header, and the shared file in the
	// "stored once" drawing below. The same Qwen as in the menu mock, so the
	// page keeps telling one story. It understands images, so no row in the
	// settings card is contradicted by the example.
	const EXAMPLE_MODEL = MENU_INSTALLED[0];

	// -- Lightweight ---------------------------------------------------------------
	//
	// The tools shown sharing one model file in the "stored once" drawing.
	const SHARED_BY = ['Llama', 'llama.cpp', 'Other tools'];

	// -- Models by memory --------------------------------------------------------
	//
	// Memory is the one spec a newcomer can look up (About This Mac), so the
	// picks are organized by it rather than by parameter count. The tier is
	// computed from the catalog, so it can't drift from what the app decides.
	const PICKS = [
		{ family: 'Gemma 4', note: 'Everyday questions, writing, and images' },
		{ family: 'GPT-OSS', note: 'Step-by-step reasoning from OpenAI' },
		{ family: 'Qwen 3.8', note: 'Strong at code, reasoning, and long documents' }
	].flatMap((p) => {
		const f = families.find((f) => f.name === p.family);

		return f ? [{ ...p, f, mem: minMemGB(f) }] : [];
	});

	// -- API call ------------------------------------------------------------------
	//
	// Drawn as a plain terminal command, not as a snippet in a tabbed panel:
	// it only has to show that the endpoint is OpenAI's, not teach the API in
	// several languages.
	// curl because it needs no SDK and reads the same to everyone. The model
	// is named because Llama serves more than one.
	const API_CALL = `curl http://localhost:9931/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "ggml-org/gpt-oss-20b-GGUF:MXFP4",
    "messages": [{"role": "user", "content": "Hi!"}]
  }'`;
	const API_CALL_HTML = Prism.highlight(API_CALL, Prism.languages.bash, 'bash');

	// -- Closing CTA ------------------------------------------------------------------
	//
	// The Mac app's cask, and the command-line install: llama.cpp's install
	// scripts (the same ones InstallCommand shows, one per OS, switched with
	// `data-os-only` so the prerendered page never shows the wrong one).
	const BREW_COMMAND = 'brew install --cask llama-app';
	const CLI_INSTALL = [
		{ command: 'curl -LsSf https://llama.app/install.sh | sh', os: 'mac linux other' },
		{ command: 'irm https://llama.app/install.ps1 | iex', os: 'windows' }
	];

	// Splits a one-line shell command into words for the command blocks'
	// highlighting: the program names (the first word, and the first after a
	// pipe), the flags, and the pipes. Not Prism: its bash grammar only knows
	// common programs, so it colors `curl` and `sh` but not `brew`, `llama` or
	// `irm`, and it colors `install` in `brew install` as if it were the
	// program. Our commands are simple enough that splitting on spaces is
	// exact. The spaces are kept as their own words so the text stays intact.
	function commandWords(text: string) {
		let expectProgram = true;

		return text.split(/( +)/).map((word) => {
			let kind = 'arg';

			if (word.trim() === '') kind = 'space';
			else if (word === '|') kind = 'pipe';
			else if (expectProgram) kind = 'program';
			else if (word.startsWith('-')) kind = 'flag';

			if (kind !== 'space') expectProgram = kind === 'pipe';

			return { kind, word };
		});
	}

	// -- Without / with diagram ----------------------------------------------------
	//
	// The per-app model size is the example model's real download, as the
	// menu mock shows it, rather than a made-up number, so the waste it
	// illustrates is honest. Rounded to whole GB, and also used by the
	// "stored once" drawing, which shows the same file -- only the menu mock
	// keeps the app's "19.0 GB" format.
	const DIAGRAM_APPS = ['Chat app', 'Coding agent', 'Your app'];
	const exampleModelGB = Math.round(parseFloat(EXAMPLE_MODEL.size));
	const exampleModelSize = `${exampleModelGB} GB`;
</script>

<svelte:head>
	<title>{SITE_TITLE}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
</svelte:head>

<!-- Two text colors only. Content -- headings and the paragraphs under them --
     uses the default foreground, softened to `text-foreground/70` for the
     short bodies under a callout's or card's title (never gray: they're
     still content). `text-muted-foreground` is for asides: small print,
     captions, labels, and the UI inside mockups. Section intros are
     `text-lg`, and h2s set their own leading, since the global `leading-7`
     heading rule (app.css) would otherwise cramp them when they wrap. -->
<main class="mx-auto w-full max-w-6xl px-6 md:px-12">
	<!-- "Mac" for Mac visitors and `other` for everyone else, for copy that
	     addresses the visitor's computer ("your Mac" / "your computer"). -->
	{#snippet macOr(other: string)}<span data-os-only="mac">Mac</span><span
			data-os-only="windows linux other">{other}</span
		>{/snippet}

	<!-- The download buttons, one per app, each shown on its own OS. Phones
	     and unrecognized systems get both, so visitors learn what there is
	     for their computer. Linux has no app yet and gets the CLI instead
	     (see the hero). The Windows link is resolved at build time (see
	     +page.server.ts). The Windows button names Windows 11 because the
	     app doesn't install on Windows 10: on the button, the requirement
	     can't be skimmed past, and it goes wherever the button goes (the
	     closing call to action, and the "other" visitors who get both). -->
	{#snippet downloadButtons()}
		<Button
			data-os-only="mac other"
			href={MACOS_DOWNLOAD_URL}
			size="lg"
			class="h-12 px-6 text-[15px]"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<span class="mb-0.5">{@html appleIcon}</span>
			Download for Mac
		</Button>
		<Button
			data-os-only="windows other"
			href={data.windowsDownloadUrl}
			size="lg"
			class="h-12 px-6 text-[15px]"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html windowsIcon}
			Download for Windows 11
		</Button>
	{/snippet}

	<!-- A numbered marker, shared by the menu and the callouts so the two
	     visibly refer to each other. In the text color rather than a hue:
	     the sky is already blue, and blue is taken inside the menu (the
	     link, the loaded model), so a colored marker either clashes or
	     reads as part of the app. Near-black stands out on both the sky
	     and the menu and reads as an annotation. -->
	{#snippet marker(n: number)}
		<span
			class="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[13px] font-semibold text-background"
			>{n}</span
		>
	{/snippet}

	<!-- A marker pinned to the menu's edge, level with the text it labels,
	     so the menu's own layout isn't shifted to make room. It's placed
	     relative to the labeled text (wrap that text in a relative span):
	     the menu's padding (12px) + row padding (4px) + border (1px) put the
	     edge 17px from the text, and backing off by half the marker (12px)
	     centers it on the edge. Left-edge markers face the callouts; "Open
	     chat" is right-aligned, so its marker sits on the right edge where
	     it can't be mistaken for the "Llama" title. -->
	{#snippet edgeMarker(n: number, side: 'left' | 'right')}
		<span
			class="absolute top-1/2 -translate-y-1/2 {side === 'left'
				? 'right-[calc(100%+5px)]'
				: 'left-[calc(100%+5px)]'} rounded-full ring-2 ring-background"
		>
			{@render marker(n)}
		</span>
	{/snippet}

	<!-- The parameter-count chip next to a model's name, styled like the
	     app's: a tinted, bordered capsule. -->
	{#snippet paramsChip(params: string)}
		<span
			class="rounded-[5px] border border-foreground/10 bg-foreground/4 px-1.5 text-[11px] leading-4 text-muted-foreground"
			>{params}</span
		>
	{/snippet}

	<!-- One model row in the menu mock. Installed rows open a submenu
	     (chevron); recommended rows download (arrow). Lines are set tight
	     (leading-4.5 / leading-4), as in the app, so the rows sit close
	     together; the trailing glyph is fainter than the secondary text. -->
	{#snippet menuModel(m: MenuModel, recommended: boolean)}
		<div class="flex items-center gap-2.5 px-1 py-1">
			<span
				class="flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-4 {m.loaded
					? 'bg-blue-500 text-white'
					: 'bg-foreground/6'}"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html logoFor(m.brand)}
			</span>
			<span class="min-w-0 flex-1">
				<span class="flex items-center gap-1.5 leading-4.5">
					{m.name}
					{@render paramsChip(m.params)}
				</span>
				<span class="block text-[13px] leading-4 text-muted-foreground">{m.size}</span>
			</span>
			{#if recommended}
				<ArrowDown class="size-3.5 text-foreground/35" />
			{:else}
				<ChevronRight class="size-3.5 text-foreground/35" />
			{/if}
		</div>
	{/snippet}

	<!-- The menu's contents, shared by the Mac menu and the Windows tray
	     flyout: the two apps show the same things, so the page shows them
	     the same way, in each OS's own frame. `machine` is the word for the
	     computer ("Mac" or "PC"). The edge markers assume the frame's 12px
	     padding and 1px border (see edgeMarker). -->
	{#snippet menuBody(machine: string)}
		<div class="px-1">
			<p class="flex items-center gap-1.5 text-[15px] leading-5 font-semibold">
				Llama <span class="size-1.5 rounded-full bg-green-500"></span>
			</p>
			<div class="mt-0.5 flex items-center justify-between text-[13px]">
				<span class="flex items-center gap-1.5 text-muted-foreground">
					<span class="relative">
						{@render edgeMarker(2, 'left')}
						localhost:9931
					</span>
					<Copy class="size-3.5" />
				</span>
				<span class="relative text-blue-600 dark:text-blue-400">
					Open chat
					{@render edgeMarker(1, 'right')}
				</span>
			</div>
		</div>

		<p class="mt-3 border-t border-border px-1 pt-2.5 pb-0.5 text-[13px] text-foreground/80">
			Installed models
		</p>
		{#each MENU_INSTALLED as m (m.name + m.params)}
			{@render menuModel(m, false)}
		{/each}

		<p class="mt-2 border-t border-border px-1 pt-2.5 pb-0.5 text-[13px] text-foreground/80">
			<span class="relative">
				{@render edgeMarker(3, 'left')}
				Recommended for this {machine}
			</span>
		</p>
		{#each MENU_RECOMMENDED as m (m.name + m.params)}
			{@render menuModel(m, true)}
		{/each}

		<!-- The catalog link, laid out like a model row. -->
		<div class="mt-2 flex items-center gap-2.5 border-t border-border px-1 pt-2 pb-1">
			<span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/6">
				<LayoutGrid class="size-3.5 text-foreground/70" />
			</span>
			<span class="min-w-0 flex-1">
				<span class="block leading-4.5">Browse models</span>
				<span class="block text-[13px] leading-4 text-muted-foreground">
					Full catalog on the web
				</span>
			</span>
			<ArrowUpRight class="size-3.5 text-foreground/35" />
		</div>

		<!-- Settings and Quit are small bordered buttons in the app. The
		     llama.cpp build is the one the Mac app pins (`floorVersion` in
		     LlamaBinaries.swift); it's hard-coded, so bump it now and then.
		     The app's own version, shown first in the real footer, is left
		     out: the llama.cpp build is the part that says what's inside. -->
		<div
			class="mt-2 flex items-center justify-between border-t border-border px-1 pt-2.5 text-[13px] text-muted-foreground"
		>
			<span>llama.cpp b9726</span>
			<span class="flex gap-1.5">
				<span class="rounded-md border border-foreground/15 px-1.5 leading-5">Settings</span>
				<span class="rounded-md border border-foreground/15 px-1.5 leading-5">Quit</span>
			</span>
		</div>
	{/snippet}

	<!-- 1. Hero. The headline stays emotional and short; the subline does
	     the explaining: what it physically is (a tiny menu bar app), what it
	     does (runs models), and the two ways to use it (chat, other apps).
	     The OpenAI comparison is left to section 3, where there's room to
	     explain it -- in one line it confuses anyone who knows OpenAI only
	     as ChatGPT.

	     The subline names the app the visitor can get: the Mac one on a Mac,
	     the Windows one on Windows, and both elsewhere. The Windows app isn't
	     tiny (it's a .NET app, tens of MB), so its line doesn't say so. -->
	<section class="flex flex-col items-center gap-7 pt-10 pb-12 text-center md:pt-14">
		<!-- Who makes it, not what it's built on: any local AI app can say
		     "built on llama.cpp", only Llama can say it's by the llama.cpp
		     team. Hugging Face stays, since newcomers are more likely to know
		     it than llama.cpp. "And Hugging Face", not "at": "the llama.cpp
		     team at Hugging Face" can read as Hugging Face's own team that
		     works on llama.cpp, apart from the main one. "And" names both as
		     makers, without the longer "now part of Hugging Face".
		     "Team", not "the makers of": the app didn't start with
		     llama.cpp's authors, but that team builds and maintains it now.
		     "llama.cpp" links to its repo, so the proof (the project itself,
		     its stars) is one click from the claim. Only that word is the link:
		     the whole badge would promise a page about the team. The link is
		     marked by an underline, not color: a brighter or blue word read
		     as emphasis rather than a link. Sans, not mono as on
		     llamacpp.org: it's prose, and mono reads as developer tooling to
		     newcomers. -->
		<span class="rounded-full border border-foreground/10 px-3 py-1 text-sm text-muted-foreground">
			By the <a
				href="https://github.com/ggml-org/llama.cpp"
				target="_blank"
				rel="noreferrer"
				class="underline">llama.cpp</a
			> team and Hugging Face
		</span>

		<h1
			class="text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl md:text-7xl"
		>
			Your AI.<br />On your computer.
		</h1>

		<p class="max-w-3xl text-lg leading-relaxed text-balance md:text-xl">
			<span data-os-only="mac">
				Llama is a tiny menu bar app that runs the latest open models on your Mac.
			</span>
			<span data-os-only="windows">
				Llama is a system tray app that runs the latest open models on your PC.
			</span>
			<span data-os-only="linux other">
				Llama is an app for Mac and Windows that runs the latest open models on your computer.
			</span>
			Chat with them, or use them in your other apps.
		</p>

		<!-- Hidden on Linux: there's no app to download or view the source of,
		     so the CLI install below stands in for the whole row. -->
		<div data-os-only="mac windows other" class="flex flex-col items-center gap-3 sm:flex-row">
			{@render downloadButtons()}

			<!-- The second button is the repo: most users are developers, and
			     for them the source is the natural next click and a trust signal.
			     Each OS gets the repo of the app it's offered, so Windows visitors
			     don't land on the Mac app's code. Everyone else gets the Mac app's,
			     matching the header's GitHub link. Linux gets none: there's no
			     Linux app, and linking llama.cpp would suggest there is. (It was
			     a demo video before; worth bringing back if one gets made.) -->
			{#each GITHUB_REPOS as r (r.url)}
				<Button
					data-os-only={r.os}
					href={r.url}
					target="_blank"
					rel="noreferrer"
					size="lg"
					variant="outline"
					class="h-12 px-6 text-[15px]"
				>
					View on GitHub
					<ArrowUpRight class="size-4" />
				</Button>
			{/each}
		</div>

		<!-- The reassurances sit right under the buttons, where the "should I
		     click this?" doubts arise: size, cost, source, and privacy. Size leads
		     because it annotates the Download button directly above it. The
		     rest used to end the subline as a sentence; as a list they scan
		     faster and leave the subline to say what Llama is. "Nothing to
		     set up" isn't here: it's a promise rather than a checkable fact,
		     and section 4 makes it properly. Privacy is put as "Works
		     offline" rather than "Private": a bare "Private" next to "open
		     source" reads as a private repo or beta, and "offline" is a fact
		     that implies privacy without claiming it. (Downloading models
		     still needs the internet; chat and the API don't.) The size is
		     the Mac app's, so it's left out elsewhere. (Windows' requirement
		     is on its button; see downloadButtons.) -->
		<p class="-mt-3 text-sm text-muted-foreground">
			<span data-os-only="mac">1 MB download ·</span>
			Free · Open source · Works offline
		</p>

		<!-- Linux's stand-in for the download buttons: the CLI, which is the
		     honest next step rather than a dead end until there's an app. -->
		<div data-os-only="linux" class="flex w-full max-w-2xl flex-col items-center gap-3">
			<p class="text-sm text-muted-foreground">On Linux? Install the command-line version:</p>
			<InstallCommand />
		</div>
	</section>

	<!-- 2. Hero shot: the actual product. What you download is a menu bar
	     menu, so that's the picture -- modeled on the real one, with three
	     numbered callouts pointing at the parts that explain everything
	     else: "Open chat" (the ChatGPT part), the address (the API part),
	     and the recommendations (why it's easy). Chat is reached *from* the
	     menu, which is exactly the relationship we want people to see.

	     Two versions of the picture, in one panel with the same callouts:
	     the Mac menu (for Mac visitors and "other", who were offered both
	     apps) and the Windows tray flyout, the same menu contents (see
	     menuBody) in each OS's own frame. The sky wallpaper is shared so
	     the two read as one picture, just on different systems. Linux gets
	     neither: it has no app, just the CLI, and a picture of an app it
	     can't get would only confuse. The Windows picture is a design
	     target rather than a copy of the shipping app: the app is to be
	     brought in line with it, "Open chat" and address included. -->
	<section data-os-only="mac windows other" class="pb-24">
		<!-- The wallpaper: a clear daytime sky, blue only -- deeper at the
		     top, paling toward the bottom right like a sky toward the
		     horizon. The top-left patch is only slightly brighter (still
		     clearly blue, so the panel's edge doesn't vanish into the white
		     page). No warm tones (they read as a sunset, i.e. sad), and no
		     pink, purple, or green -- so it reads upbeat without competing
		     with the menu. Kept pale so the callouts' text stays easy to
		     read; the dark version is the same sky at night.

		     From md, two columns: the callouts, then the picture (the menu
		     with its bar or tray, 21rem -- the menu's width). Both are
		     centered vertically, so the callouts are centered on the whole
		     picture, bar or tray included (they're part of the screen, like
		     the wallpaper). The panel's padding (p-12) insets the picture by
		     the same 48px on every side it has room, as if the picture were a
		     crop of a larger screen: the menu floats on the wallpaper instead
		     of being jammed into the corner. On phones it's one column, the
		     picture first. Only one picture shows (data-os-only), so the
		     grid only ever holds the two. -->
		<div
			class="grid gap-6 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_15%_10%,#dcecfb_0%,transparent_55%),radial-gradient(ellipse_at_90%_95%,#e8f2fc_0%,transparent_50%),linear-gradient(160deg,#c4ddf6_0%,#d0e4f7_55%,#dfecf9_100%)] p-4 md:grid-cols-[1fr_21rem] md:items-center md:gap-x-10 md:p-12 dark:bg-[radial-gradient(ellipse_at_15%_10%,#22385c_0%,transparent_55%),radial-gradient(ellipse_at_90%_95%,#1e3752_0%,transparent_50%),linear-gradient(160deg,#152238_0%,#172a42_55%,#1a3049_100%)]"
		>
			<!-- macOS menu bar. No background of its own: in current macOS the
			     bar is transparent, with the icons straight on the wallpaper.
			     The Llama icon is "pressed", since its menu is open. Sizes
			     follow the real bar: status icons roughly as tall as the
			     clock's capitals. The Logo component sizes itself from
			     --logo-height (a utility class can't override it). The status
			     icons are the real SF Symbols -- the Lucide ones are thin
			     outlines and read as a different OS. Each was exported with
			     `sfsymbols export <name> --format pdf --weight medium
			     --rendering-mode monochrome` (the app's CLI, in
			     /Applications/SF Symbols.app/Contents/Executables) and its
			     paths copied out of the PDF, y-flipped. (The CLI's SVG export
			     is an editable design template, not a drop-in icon.) Medium
			     matches the heft of the real bar. The viewBoxes are the PDFs'
			     page sizes, all at the same point size, so each icon's height
			     is its viewBox height x 1.2em / 100 -- that keeps their
			     relative sizes as macOS draws them, with Wi-Fi at 1em.

			     A status item's menu hangs from its icon: the menu's left edge
			     sits just left of the icon. So the bar is stacked right over
			     the menu, and its status items span exactly the menu's width
			     (the pl-1 is the small step in from the edge the real one
			     has). The icons' natural widths don't add up to the menu's, so
			     justify-between spreads the rest evenly; Spotlight, Control
			     Center, and sound are there so the gaps stay close to macOS's
			     rather than yawning. -->
			<div data-os-only="mac other" aria-hidden="true" class="flex flex-col gap-2.5">
				<div class="flex items-center justify-between pl-1 text-xs font-medium text-foreground/85">
					<span class="flex h-5 items-center rounded-full bg-foreground/15 px-2">
						<Logo --logo-height="0.75rem" />
					</span>

					<!-- Sound: `speaker.wave.2.fill`. -->
					<svg viewBox="0 0 114 88" class="h-[1.06em] w-auto" fill="currentColor">
						<path
							d="M96.57 78.34C98.77 79.72 101.46 79.24 102.97 76.99C109.33 68.04 113.04 55.99 113.04 43.65C113.04 31.31 109.37 19.18 102.97 10.32C101.46 8.06 98.77 7.58 96.57 8.96C94.27 10.41 93.92 13.25 95.62 15.81C100.87 23.4 103.82 33.35 103.82 43.65C103.82 53.96 100.78 63.86 95.62 71.5C93.96 74.05 94.27 76.9 96.57 78.34ZM77.07 65.33C79.13 66.65 81.83 66.2 83.32 64.07C87.23 58.81 89.59 51.38 89.59 43.65C89.59 35.92 87.23 28.53 83.32 23.22C81.83 21.1 79.13 20.66 77.07 22.02C74.74 23.58 74.28 26.42 76.15 29.17C78.87 32.99 80.36 38.19 80.36 43.65C80.36 49.11 78.83 54.28 76.15 58.14C74.32 60.93 74.74 63.72 77.07 65.33ZM53.42 87.37C57.02 87.37 59.7 84.7 59.7 81.08L59.7 6.55C59.7 2.97 57.02 0.05 53.33 0.05C50.86 0.05 49.1 1.08 46.4 3.61L25.96 22.73C25.68 23.01 25.3 23.18 24.87 23.18L11.03 23.18C3.89 23.18 0 27.13 0 34.71L0 52.83C0 60.36 3.89 64.35 11.03 64.35L24.86 64.35C25.29 64.35 25.67 64.47 25.95 64.75L46.4 84.06C48.87 86.35 50.91 87.37 53.42 87.37Z"
						/>
					</svg>

					<!-- Wi-Fi: `wifi`. -->
					<svg viewBox="0 0 110 83" class="h-[1em] w-auto" fill="currentColor">
						<path
							d="M2.47 31.72C5.39 34.67 9.81 34.17 13.45 30.93C24.88 20.73 39.15 15.42 55.02 15.42C70.85 15.42 85.21 20.82 96.6 30.93C100.18 34.17 104.61 34.59 107.58 31.67C110.56 28.64 110.92 24.12 107.9 20.98C95.65 8.52 75.64 0 55.02 0C34.41 0 14.35 8.56 2.15 21.02C-0.91 24.12-0.56 28.64 2.47 31.72ZM22.5 51.75C25.94 55.08 30.17 54.38 33.65 51.59C39.5 47.02 47.21 44.02 55.02 44.08C62.82 44.02 70.55 47.07 76.4 51.63C79.86 54.39 84.23 54.95 87.59 51.67C90.74 48.52 91.24 43.63 87.83 40.6C79.85 33.6 67.95 28.81 55.02 28.81C42.05 28.81 30.14 33.6 22.22 40.6C19.15 43.33 18.79 48.04 22.5 51.75ZM49.69 78.8C53.17 82.07 56.79 82.07 60.28 78.8L67.32 72.05C70.78 68.7 71.52 64.55 67.65 61.6C64.22 59.05 59.78 57.38 55.03 57.38C50.21 57.38 45.8 59.04 42.4 61.65C38.53 64.55 39.3 68.76 42.76 72.06Z"
						/>
					</svg>

					<!-- Battery, charging: `battery.100percent.bolt`. -->
					<svg viewBox="0 0 147 69" class="h-[0.83em] w-auto" fill="currentColor">
						<path
							d="M26.79 68.3L48.17 68.3C46.78 65.37 47.13 63.11 48.76 58.75L25.43 58.75C20.39 58.75 15.64 58.03 12.92 55.32C10.2 52.61 9.56 47.93 9.56 42.87L9.56 25.56C9.56 20.39 10.21 15.74 12.91 12.97C15.62 10.25 20.41 9.6 25.56 9.6L57 9.6L64.8 0L26.7 0C17.96 0 10.97 0.99 5.93 6.03C0.93 11.03 0 17.93 0 26.69L0 41.52C0 50.39 0.92 57.3 5.92 62.33C10.98 67.32 17.9 68.3 26.79 68.3ZM66.69 68.3L103.36 68.3C112.24 68.3 119.18 67.32 124.22 62.33C129.21 57.28 130.14 50.39 130.14 41.52L130.14 26.79C130.14 17.91 129.21 11 124.22 6.02C119.16 0.99 112.24 0 103.36 0L83.27 0C84.62 2.85 84.32 5.13 82.72 9.6L104.71 9.6C109.75 9.6 114.49 10.27 117.21 12.98C119.93 15.74 120.58 20.37 120.58 25.48L120.58 42.87C120.58 47.93 119.91 52.6 117.21 55.32C114.5 58.05 109.75 58.75 104.71 58.75L74.45 58.75ZM137.27 47.4C141.31 47.15 146.74 41.96 146.74 34.15C146.74 26.34 141.31 21.15 137.27 20.9ZM23.53 52.59L48.85 52.59L51.04 46.75L45.25 46.75C40.77 46.35 37.16 42.63 37.16 37.87C37.16 35.5 38.06 33.22 39.56 31.36L52.03 15.75L23.61 15.75C20.52 15.75 18.66 16.16 17.45 17.41C16.2 18.68 15.71 20.48 15.71 23.61L15.71 44.82C15.71 47.84 16.2 49.62 17.45 50.89C18.72 52.13 20.53 52.59 23.53 52.59ZM79.4 52.59L106.61 52.59C109.68 52.59 111.47 52.14 112.67 50.89C113.93 49.62 114.43 47.83 114.43 44.82L114.43 23.48C114.43 20.46 113.93 18.68 112.73 17.42C111.47 16.17 109.62 15.75 106.61 15.75L82.58 15.75L80.4 21.6L86.16 21.6C90.68 21.99 94.28 25.72 94.28 30.44C94.28 32.8 93.39 35.12 91.88 36.94ZM44.21 37.87C44.21 39.21 45.34 40.23 46.76 40.23L63.23 40.23L54.45 63.73C53.17 67.16 56.86 69.06 59.07 66.31L86.27 32.55C86.8 31.85 87.1 31.14 87.1 30.44C87.1 29.09 86.01 28.07 84.6 28.07L68.12 28.07L76.9 4.61C78.18 1.18 74.51-0.76 72.29 1.99L45.09 35.76C44.56 36.46 44.21 37.16 44.21 37.87Z"
						/>
					</svg>

					<!-- Spotlight: `magnifyingglass`. -->
					<svg viewBox="0 0 97 98" class="h-[1.18em] w-auto" fill="currentColor">
						<path
							d="M0 39.74C0 61.68 17.81 79.45 39.75 79.45C47.88 79.45 55.36 76.97 61.6 72.72L84.03 95.21C85.46 96.6 87.32 97.27 89.24 97.27C93.38 97.27 96.38 94.12 96.38 90.03C96.38 88.1 95.65 86.31 94.36 84.93L72.05 62.58C76.72 56.16 79.45 48.29 79.45 39.74C79.45 17.81 61.68 0 39.75 0C17.81 0 0 17.81 0 39.74ZM10.16 39.74C10.16 23.4 23.4 10.16 39.75 10.16C56.06 10.16 69.33 23.4 69.33 39.74C69.33 56.05 56.06 69.33 39.75 69.33C23.4 69.33 10.16 56.05 10.16 39.74Z"
						/>
					</svg>

					<!-- Control Center: `switch.2`. -->
					<svg viewBox="0 0 95 96" class="h-[1.15em] w-auto" fill="currentColor">
						<path
							d="M21.56 94.88L72.61 94.88C84.63 94.88 94.21 86.42 94.21 74.13C94.21 61.84 84.63 53.38 72.61 53.38L21.56 53.38C9.53 53.38 0 61.84 0 74.13C0 86.42 9.53 94.88 21.56 94.88ZM58.69 86.13C51.82 86.13 46.28 81.23 46.28 74.08C46.28 66.97 51.82 62.07 58.69 62.07L73.46 62.07C80.38 62.07 85.87 66.97 85.87 74.12C85.87 81.23 80.38 86.13 73.46 86.13ZM23.69 45.88L70.48 45.88C83.83 45.88 94.21 36.63 94.21 22.94C94.21 9.25 83.83 0 70.48 0L23.69 0C10.38 0 0 9.25 0 22.94C0 36.63 10.38 45.88 23.69 45.88ZM23.69 37.1C15.53 37.1 9.07 31.43 9.07 22.94C9.07 14.45 15.53 8.78 23.69 8.78L70.48 8.78C78.67 8.78 85.1 14.46 85.1 22.94C85.1 31.42 78.67 37.1 70.48 37.1ZM23.69 33.91L37.69 33.91C43.95 33.91 49.03 29.45 49.03 22.94C49.03 16.39 43.95 11.92 37.69 11.92L23.69 11.92C17.42 11.92 12.35 16.39 12.35 22.9C12.35 29.45 17.42 33.91 23.69 33.91Z"
						/>
					</svg>

					<!-- The date only where there's room for it. -->
					<span>Wed <span class="max-sm:hidden">Sep 23&nbsp;</span>10:24</span>
				</div>

				<!-- The menu itself. Mirrors the shipping layout: name and
				     address, "Open chat", installed models, recommendations,
				     catalog link, footer. Quant and context chips are left out
				     on purpose: this page promises newcomers never see that jargon. -->
				<!-- Translucent, like a real menu's material: the wallpaper
				     tints it through the blur. The green dot is the server's
				     running state, as in the app. "Open chat" sits on the
				     address's line, not the title's, as it does in the app.

				     The edge is drawn like a macOS menu's: a light "shine" hairline
				     on the menu's edge (the border -- kept as a border, since the
				     edge markers' offset counts its 1px) and a dark hairline just
				     outside it (a 1px spread shadow), on top of the soft drop
				     shadow. -->
				<div class="rounded-xl {MENU_FRAME}">
					{@render menuBody('Mac')}
				</div>
			</div>

			<!-- The Windows picture: the flyout over the taskbar's tray, the
			     tray the flyout's width and right under it, as the Mac bar is
			     over the menu. A full-bleed taskbar under an inset flyout mixed
			     two framings and looked off. The tray strip is the taskbar's
			     material but fades in over its left half, so it reads as the
			     end of a taskbar that carries on off-picture rather than as a
			     floating card; that's also why only its right corners are
			     rounded. The fade is a mask, so it takes the border and the
			     blur along. -->
			<div data-os-only="windows" aria-hidden="true" class="flex flex-col gap-3">
				<!-- The Mac menu's edge (shine, dark hairline, drop shadow -- see
				     there): Windows 11's own flatter edge, a single faint hairline,
				     was tried and looked weaker against the wallpaper. Only the
				     corners are Windows' (8px).
				     Segoe UI for Windows visitors (who are the only ones who see
				     this), so the flyout's text looks like theirs. -->
				<div
					class="rounded-lg font-['Segoe_UI_Variable_Text','Segoe_UI',system-ui,sans-serif] {MENU_FRAME}"
				>
					{@render menuBody('PC')}
				</div>

				<!-- The tray: "show hidden icons", then Llama's icon, pressed since
				     its flyout is open, then the usual network, sound, and battery,
				     and the two-line clock. Lucide's outline icons are close to
				     Windows 11's own (Fluent) ones. -->
				<div
					class="flex h-12 items-center justify-end rounded-r-lg border border-l-0 border-white/60 bg-white/70 mask-[linear-gradient(to_right,transparent,black_45%)] px-1 text-xs text-foreground/85 backdrop-blur-xl dark:border-white/10 dark:bg-black/45"
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
			</div>

			<!-- The callouts. Numbered to match the markers placed on the
			     menu; each one maps a part of the menu to the OpenAI mental
			     model or to the "easy" promise. Written directly on the
			     wallpaper -- no card, no shadow -- so they read as annotations
			     *about* the menu, not as more UI. After the picture on phones;
			     on desktop, left of it, centered in the space left of the
			     menu, both ways, so the margins around it are even. The third
			     title quotes the pictured menu exactly ("Mac" or "PC"). The
			     menu says "this Mac", not "your Mac": the picks are based on
			     this machine's hardware, and "your" could read as picked for
			     your taste. -->
			<ol class="flex max-w-md flex-col gap-8 md:order-first md:justify-self-center">
				<li class="flex gap-3">
					{@render marker(1)}
					<span>
						<span class="block text-base leading-6 font-medium">Open chat</span>
						<span class="mt-1 block text-base leading-relaxed text-foreground/70">
							Chat with any model in your browser. Like ChatGPT, but on your {@render macOr(
								'computer'
							)}.
						</span>
					</span>
				</li>
				<li class="flex gap-3">
					{@render marker(2)}
					<span>
						<span class="block text-base leading-6 font-medium">A local API</span>
						<span class="mt-1 block text-base leading-relaxed text-foreground/70">
							Your apps connect here. It speaks the OpenAI API, so coding agents, editors, and
							scripts just work.
						</span>
					</span>
				</li>
				<li class="flex gap-3">
					{@render marker(3)}
					<span>
						<span class="block text-base leading-6 font-medium">
							Recommended for this
							<span data-os-only="mac other">Mac</span>
							<span data-os-only="windows">PC</span>
						</span>
						<span class="mt-1 block text-base leading-relaxed text-foreground/70">
							Models that fit your {@render macOr('computer')}, one click to install. Llama picks
							the settings.
						</span>
					</span>
				</li>
			</ol>
		</div>
	</section>

	<!-- 3. The mental model, spelled out. Everyone knows OpenAI has an app
	     for people (ChatGPT) and an API for apps; Llama has the same two
	     halves, on your computer. This is the section that answers "how is
	     a menu bar app a platform?". -->
	<section class="py-20">
		<div class="mb-10 flex max-w-2xl flex-col gap-4">
			<h2 class="text-3xl leading-tight font-semibold tracking-tight">
				Like OpenAI, but on your {@render macOr('computer')}
			</h2>
			<p class="text-lg leading-relaxed text-pretty">
				OpenAI has ChatGPT to chat with and an API to build on. Llama gives you both, running on
				your own computer, with models you choose.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- For you: the chat. A private document, because that's where
			     "it stays on your computer" obviously matters. -->
			<div class="flex flex-col gap-5 rounded-2xl border border-border bg-foreground/2 p-6">
				<div>
					<p class="text-xs tracking-wide text-muted-foreground uppercase">For you</p>
					<h3 class="mt-1 text-xl font-semibold">
						Chat <span class="font-normal text-muted-foreground">· like ChatGPT</span>
					</h3>
				</div>
				<div
					aria-hidden="true"
					class="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-background p-4 text-sm"
				>
					<div class="ml-auto flex max-w-[85%] flex-col items-end gap-1.5">
						<span
							class="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
						>
							<FileText class="size-3" /> lease-agreement.pdf
						</span>
						<p class="rounded-2xl bg-muted px-3 py-2">Summarize this and flag anything unusual.</p>
					</div>
					<p class="leading-relaxed text-foreground/85">
						It's a standard 12-month lease. Two things stand out: it renews automatically unless you
						give 90 days' notice, and…
					</p>
				</div>
				<p class="text-sm text-muted-foreground">
					Click “Open chat” in the menu. Nothing to set up.
				</p>
			</div>

			<!-- For your apps: the API. Categories, not a logo wall -- Pi is
			     the only integration we can name with confidence today. -->
			<div class="flex flex-col gap-5 rounded-2xl border border-border bg-foreground/2 p-6">
				<div>
					<p class="text-xs tracking-wide text-muted-foreground uppercase">For your apps</p>
					<h3 class="mt-1 text-xl font-semibold">
						API <span class="font-normal text-muted-foreground">· like the OpenAI API</span>
					</h3>
				</div>
				<div class="flex flex-1 flex-col gap-2 text-sm">
					{#each CLIENTS as c (c.label)}
						<div
							class="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
						>
							<c.icon class="size-4 text-muted-foreground" />
							<span class="flex-1">{c.label}</span>
							<span class="text-xs text-muted-foreground">{c.example}</span>
						</div>
					{/each}
				</div>
				<p class="text-sm text-muted-foreground">
					Point any app that works with OpenAI at
					<code class="font-mono text-foreground">localhost:9931/v1</code>
				</p>
			</div>
		</div>

		<!-- The shared foundation: one set of models under both halves. The
		     connectors and the full-width block make "same models for both"
		     visible as a stack rather than a footnote. Connectors are hidden
		     on mobile, where the cards stack and there's no "both" to join. -->
		<div aria-hidden="true" class="hidden grid-cols-2 gap-4 md:grid">
			<div class="mx-auto h-4 w-px bg-border"></div>
			<div class="mx-auto h-4 w-px bg-border"></div>
		</div>
		<div
			class="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-foreground/2 px-6 py-4 md:mt-0 md:flex-row md:items-center md:justify-between"
		>
			<!-- One line, body size: this is the base, not a third feature
			     card, so it shouldn't outweigh the chips beside it. The
			     connectors already say "underneath both", so no eyebrow. -->
			<h3 class="font-semibold">
				Your models <span class="font-normal text-muted-foreground"
					>· download once, use everywhere</span
				>
			</h3>
			<!-- The same models as in the menu mock above, so the page tells
			     one consistent story. -->
			<div class="flex flex-wrap gap-2 text-sm">
				{#each MENU_INSTALLED as m (m.name + m.params)}
					<span
						class="flex items-center gap-2 rounded-full border border-border bg-background py-1 pr-3 pl-1"
					>
						<span
							class="flex size-6 items-center justify-center rounded-full bg-foreground/6 [&_svg]:size-3.5"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html logoFor(m.brand)}
						</span>
						{m.name}
						<span class="text-xs text-muted-foreground">{m.params}</span>
					</span>
				{/each}
			</div>
		</div>
	</section>

	<!-- 4. Nothing to set up. The core promise, and the thing users say
	     draws them to Llama. The card shows the configuration happening
	     rather than just claiming it: it's drawn as a settings screen for
	     one model where every setting is already on "Auto".

	     Same gap as the two-up grid above, so the card is exactly as wide
	     as the cards there and its edge lines up with theirs (a wider gap
	     made it slightly narrower, which read as a mistake). The text
	     column's right padding keeps it clear of the card. -->
	<section class="grid grid-cols-1 items-center gap-10 py-20 md:grid-cols-2 md:gap-4">
		<div class="flex flex-col gap-4 md:pr-8">
			<h2 class="text-3xl leading-tight font-semibold tracking-tight">Nothing to set up</h2>
			<p class="text-lg leading-relaxed text-pretty">
				Running AI locally used to mean reading forum threads about settings. Llama checks your {@render macOr(
					'computer'
				)}
				and sets up each model to run well on it, based on how llama.cpp actually works. You only pick
				which model to talk to.
			</p>
			<!-- Reassurance for enthusiasts: simple by default doesn't mean
			     locked down. -->
			<p class="text-sm leading-relaxed text-muted-foreground">
				Know what you're doing? Every llama.cpp setting is still there, in one plain-text file.
			</p>
		</div>

		<div class="flex flex-col gap-4 rounded-2xl border border-border bg-foreground/2 p-5">
			<!-- Header: which model, and that the work is done. -->
			<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
				<span class="flex items-center gap-2 text-sm font-medium">
					<span
						aria-hidden="true"
						class="flex size-6 items-center justify-center rounded-full bg-foreground/6 [&_svg]:size-3.5"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html logoFor(EXAMPLE_MODEL.brand)}
					</span>
					{EXAMPLE_MODEL.name}
					{@render paramsChip(EXAMPLE_MODEL.params)}
				</span>
				<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Check class="size-3.5 text-sky-600 dark:text-sky-400" />
					<!-- One span, so the flex gap doesn't also land between
					     "your" and "Mac". -->
					<span>Chosen by Llama, for your {@render macOr('computer')}</span>
				</span>
			</div>

			<!-- A list rather than a <dl>: each row also holds an icon and a
			     pill, which a <dl>'s row wrapper isn't allowed to contain.
			     Setting names are in the body font, not mono -- they're
			     labels here, not something to type. -->
			<ul class="divide-y divide-border rounded-xl border border-border bg-background">
				{#each TUNED as t (t.setting)}
					<li class="flex items-center gap-3 px-4 py-3">
						<span
							aria-hidden="true"
							class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5"
						>
							<t.icon class="size-4 text-muted-foreground" />
						</span>
						<span class="min-w-0 flex-1">
							<span class="block text-sm font-medium">{t.setting}</span>
							<span class="block text-sm text-muted-foreground">{t.how}</span>
						</span>
						<!-- Hidden from screen readers: the header already says
						     Llama chose all of these, so "Auto" five times over is
						     just noise when read aloud. -->
						<span
							aria-hidden="true"
							class="shrink-0 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400"
							>Auto</span
						>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- 5. Lightweight. The sharpest contrast with every alternative. The
	     menu itself is already on screen in the hero, so this is just the
	     facts. Two sizes on purpose: 4 MB is the installed app, 1 MB is the
	     (compressed) download the hero quotes. The 5-minute unload is the
	     app's default (`UserSettings.sleepIdleTime`); keep it in sync.

	     Each fact gets a small drawing of itself instead of a big number, so
	     no single fact shouts, and instead of an icon, which says nothing
	     the title doesn't. -->

	<!-- 4 MB: the two files a user actually handles, which also explains
	     why the card says 4 MB while the hero and body say 1 MB. The size
	     shares the file name's line (baseline-aligned), not the row's
	     vertical center, so it reads as that file's size. The icon tiles
	     are white with the standard border, like the chips and file in the
	     "stored once" drawing beside it -- gray tiles on the gray panel
	     looked muddy. -->
	{#snippet sizeArt()}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-3">
				<span
					class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground"
				>
					<Package class="size-4" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="flex items-baseline justify-between gap-3 text-sm">
						<span class="font-medium">Llama.dmg</span>
						<span class="font-mono">1 MB</span>
					</span>
					<span class="block text-muted-foreground">Download</span>
				</span>
			</div>
			<div class="flex items-center gap-3">
				<span
					class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background"
				>
					<Logo --logo-height="0.875rem" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="flex items-baseline justify-between gap-3 text-sm">
						<span class="font-medium">Llama.app</span>
						<span class="font-mono">4 MB</span>
					</span>
					<span class="block text-muted-foreground">Installed</span>
				</span>
			</div>
		</div>
	{/snippet}

	<!-- Stored once: three tools pointing at a single model file. The
	     connectors converge: the middle chip drops straight down, and the
	     side chips drop, turn inward, and drop again just short of the
	     middle line -- so all three land together near the file's center,
	     which reads as "one shared file" rather than three separate slots,
	     without any line crossing another (a bus joining all three did
	     cross, where the middle drop ran through it).

	     Drawn with absolutely positioned borders rather than a stretched
	     SVG, so the lines stay 1px and line up with the chips exactly.
	     The chips sit in a 3-column grid with a 6px gap (gap-1.5), so the
	     side chips' centers are (100% - 12px) / 6 in from each edge. The
	     side lines land 8px either side of center; the turn is 10px down. -->
	{#snippet storageArt()}
		<div class="flex flex-col items-center">
			<div class="grid w-full grid-cols-3 gap-1.5 text-center">
				{#each SHARED_BY as tool (tool)}
					<span class="truncate rounded-md border border-border bg-background px-1 py-1"
						>{tool}</span
					>
				{/each}
			</div>
			<div aria-hidden="true" class="relative h-7 w-full">
				<!-- Left chip: down and right (└), then down (the 1px line
				     starts on the turn's bottom border so the corner joins). -->
				<div
					class="absolute top-0 right-[calc(50%+8px)] left-[calc((100%-12px)/6)] h-2.5 border-b border-l border-border"
				></div>
				<div class="absolute top-[9px] right-[calc(50%+8px)] bottom-0 w-px bg-border"></div>
				<!-- Middle chip: straight down. -->
				<div class="absolute inset-y-0 left-1/2 w-px bg-border"></div>
				<!-- Right chip: the mirror image of the left one. -->
				<div
					class="absolute top-0 right-[calc((100%-12px)/6)] left-[calc(50%+8px)] h-2.5 border-r border-b border-border"
				></div>
				<div class="absolute top-[9px] bottom-0 left-[calc(50%+8px)] w-px bg-border"></div>
			</div>
			<!-- Full width, spanning the three tools above, and laid out like
			     the file rows in the size drawing: the model and where it lives
			     on the left, its size on disk on the right, on the name's line.
			     Same border and fill as the chips: the layout and connectors already
			     say which one is the file. -->
			<span
				class="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background py-1.5 pr-3 pl-2.5"
			>
				<span class="[&_svg]:size-4">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html logoFor(EXAMPLE_MODEL.brand)}
				</span>
				<span class="min-w-0 flex-1">
					<span class="flex items-baseline justify-between gap-3">
						<span class="font-medium">{EXAMPLE_MODEL.name} {EXAMPLE_MODEL.params}</span>
						<span class="font-mono text-muted-foreground">{exampleModelSize}</span>
					</span>
					<span class="block text-[11px] text-muted-foreground">In the Hugging Face cache</span>
				</span>
			</span>
		</div>
	{/snippet}

	<!-- Idle: memory over time. Nothing, then a request loads the model,
	     it's used, sits idle for 5 minutes, and is unloaded.

	     Each stretch is labeled inside itself rather than on an axis below,
	     so there's nothing to match up. "In use" and "idle" hold the same
	     memory, so they share one solid edge and are told apart by fill
	     alone: idle is paler. Not a dashed edge for idle -- in a chart,
	     dashed reads as projected or not quite real, and the idle memory is
	     as real as the in-use memory. In use, idle, and unloaded are equally
	     wide, after a short unloaded lead-in: width is time, and nothing
	     says any stage is the shorter. Together with the lead-in, the
	     drawing is 40% unloaded, so it doesn't read as mostly loaded under
	     a title that promises nothing loaded.
	     The three stage labels share one color and weight -- they're peers.
	     "Unloaded" sits down by its line rather than mid-height, since it
	     has no block to sit in.
	     No axis title ("memory used"): the block labels and the card's text
	     already say what's up and what's down. The labels are positioned in
	     % of the width, matching the chart's x coordinates out of 200 (20 =
	     10%, 80 = 40%, 140 = 70%), and the chart is 112 units tall to match
	     its 112px box (h-28), so y units are pixels. The line is 1px, like
	     the page's other drawings, and sits on half-pixels (top 8.5,
	     baseline 111.5) so it covers exactly one pixel row instead of
	     blurring across two. The fills run to the box's bottom edge, under
	     the baseline -- stopping at the line's center left them a
	     half-line short of the baseline beside them. The plateau spans
	     y 8-112, hence pt-2 on the block labels to center them in it, and
	     bottom-1.5 on "Unloaded" (1px baseline + 5px gap). -->
	{#snippet idleArt()}
		<div class="relative h-28 text-[11px] whitespace-nowrap">
			<svg
				viewBox="0 0 200 112"
				preserveAspectRatio="none"
				class="absolute inset-0 size-full text-sky-600 dark:text-sky-400"
				fill="none"
			>
				<path d="M20 112V8.5H80V112Z" fill="currentColor" fill-opacity="0.22" />
				<path d="M80 112V8.5H140V112Z" fill="currentColor" fill-opacity="0.08" />
				<path
					d="M0 111.5H20V8.5H140V111.5H200"
					stroke="currentColor"
					stroke-linejoin="round"
					vector-effect="non-scaling-stroke"
				/>
			</svg>
			<span class="absolute inset-y-0 left-[10%] flex w-[30%] items-center justify-center pt-2"
				>In use</span
			>
			<span class="absolute inset-y-0 left-[40%] flex w-[30%] items-center justify-center pt-2"
				>5 min idle</span
			>
			<span class="absolute bottom-1.5 left-[70%] w-[30%] text-center">Unloaded</span>
		</div>
	{/snippet}

	<!-- One fact's card: text first, drawing pinned to the bottom (mt-auto).
	     The grid stretches every card to the tallest one, and the slack goes
	     into the gap between the two -- so the drawings keep their natural
	     heights instead of being boxed to a common one. -->
	{#snippet lightCard(title: string, body: string, art: Snippet)}
		<div class="flex flex-col gap-8 rounded-2xl border border-border bg-foreground/2 p-6">
			<div>
				<h3 class="font-semibold">{title}</h3>
				<p class="mt-1 leading-relaxed text-foreground/70">{body}</p>
			</div>
			<div aria-hidden="true" class="mt-auto text-xs">
				{@render art()}
			</div>
		</div>
	{/snippet}

	<!-- Mac and "other" only: the facts are the Mac app's. The Windows app
	     isn't a 1 MB download and keeps models loaded by default. Linux has
	     no app, and like the hero shot, a section about the Mac app's files
	     (Llama.dmg, Llama.app) would only confuse there. -->
	<section data-os-only="mac other" class="py-20">
		<!-- The intro names the worry (local AI is heavy) rather than listing
		     the cards, so it doesn't read as the cards' titles said twice. -->
		<div class="mb-10 flex max-w-2xl flex-col gap-4">
			<h2 class="text-3xl leading-tight font-semibold tracking-tight">
				Light enough to forget it's there
			</h2>
			<p class="text-lg leading-relaxed text-pretty">
				Local AI has a reputation for eating disk space and memory. Llama keeps both to a minimum.
			</p>
		</div>
		<!-- Three across only from lg: below that, the cards are too narrow
		     for the drawings (the "stored once" chips would truncate). Not "no
		     windows" or "no Dock icon": Settings opens a window and shows a
		     Dock icon while it's open. Model storage is the stronger third
		     point anyway -- models are the heavy part, and other apps keep
		     their own copies. -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			{@render lightCard(
				'4 MB app',
				'A native Mac app, and just a 1 MB download — smaller than a photo.',
				sizeArt
			)}
			{@render lightCard(
				'Each model stored once',
				'Kept in the Hugging Face cache, shared with llama.cpp and other tools.',
				storageArt
			)}
			{@render lightCard(
				'Nothing loaded when idle',
				'Models load when something asks for one and unload after 5 minutes idle.',
				idleArt
			)}
		</div>
	</section>
	<!-- 6. Models by memory tier. Answers "will it run on my computer?" --
	     the most common newcomer worry -- with the one number they can check. -->
	<section class="py-20">
		<div class="mb-10 flex max-w-2xl flex-col gap-4">
			<h2 class="text-3xl leading-tight font-semibold tracking-tight">
				A great model for every {@render macOr('computer')}
			</h2>
			<p class="text-lg leading-relaxed text-pretty">
				Llama suggests one that fits when you open it. Here's where to start.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each PICKS as p (p.family)}
				<a
					href={resolve(`/models/${slugify(p.f.name)}`)}
					class="flex flex-col gap-4 rounded-2xl border border-border bg-foreground/2 p-6"
				>
					{#if p.mem}
						<span class="text-sm text-muted-foreground"
							>{p.mem} GB {@render macOr('of memory')} or more</span
						>
					{/if}
					<span class="flex items-center gap-2 text-xl font-medium [&>span>svg]:size-5">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<span aria-hidden="true">{@html logoFor(p.f.brand)}</span>
						{p.f.name}
					</span>
					<span class="text-sm text-muted-foreground">{p.note}</span>
				</a>
			{/each}
		</div>

		<!-- The way onward, placed where the eye lands after the cards. It used
		     to sit small at the header's right, while the line under the cards
		     linked to Hugging Face -- so the most visible next step left the
		     site. The Hugging Face route ("Use this model") now lives at the
		     end of the models page, for people who didn't find what they
		     wanted in the catalog. -->
		<a
			href={resolve('/models')}
			class="mt-8 inline-flex items-center gap-1.5 font-medium underline underline-offset-4"
		>
			Browse models <ArrowRight class="size-4" />
		</a>
	</section>

	<!-- 7. Developers. One chapter with a single h2, like every other
	     section, and two equal-weight h3 rows under it (the same h2 → h3
	     pattern as "Like OpenAI, but on your Mac"). Before, these were two
	     sections with mismatched heading sizes and an eyebrow on only the
	     first, so it wasn't clear whether they were peers or parent/child. -->
	<section id="developers" class="scroll-mt-8 py-20">
		<div class="mb-12 flex max-w-2xl flex-col gap-4">
			<h2 class="text-3xl leading-tight font-semibold tracking-tight">Build on Llama</h2>
			<p class="text-lg leading-relaxed text-pretty">
				Your apps get a local AI API they can all share, and Llama takes care of the engine and the
				models.
			</p>
		</div>

		<!-- The API. Same gap as the "Nothing to bundle" comparison below,
		     so the terminal is exactly as wide as the cards there -- see the
		     "Nothing to set up" section. The text column's right padding
		     keeps it clear of the terminal. -->
		<div class="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-4">
			<div class="flex flex-col gap-5 md:pr-8">
				<h3 class="text-xl font-semibold">OpenAI-compatible API</h3>
				<p class="leading-relaxed">
					If your code works with OpenAI, it works with Llama. Change the base URL and keep
					everything else — no API keys, no usage bills.
				</p>
				<!-- Selling points, not fine print, so the text keeps the normal
				     color; the smaller size already ranks it below the paragraph.
				     Only the checks are muted, to keep them from competing. -->
				<ul class="flex flex-col gap-2 text-sm">
					<li class="flex gap-2">
						<Check class="mt-0.5 size-4 shrink-0 text-muted-foreground" /> OpenAI- and Anthropic-compatible
						endpoints
					</li>
					<li class="flex gap-2">
						<Check class="mt-0.5 size-4 shrink-0 text-muted-foreground" /> Streaming, tool calling, structured
						output, vision
					</li>
					<li class="flex gap-2">
						<Check class="mt-0.5 size-4 shrink-0 text-muted-foreground" /> Already use llama.cpp? Your
						models show up automatically
					</li>
					<!-- The app installs the same `llama` binary as the install
					     scripts, linked onto PATH, so the command line comes with it.
					     Said here, among the developer features, so the closing
					     card's "includes the command line" recalls something the page
					     has already shown. Not on Linux: there's no app there, and
					     the command line is all you get. -->
					<li data-os-only="mac windows other" class="flex gap-2">
						<Check class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<span
							>The <code class="font-mono">llama</code> command too:
							<code class="font-mono">llama cli</code>, <code class="font-mono">llama serve</code>,
							and more</span
						>
					</li>
					<!-- Mac app only, for now, so not on Windows, and not on
					     Linux, where there's no app. -->
					<li data-os-only="mac other" class="flex gap-2">
						<Check class="mt-0.5 size-4 shrink-0 text-muted-foreground" /> Reach it from your other devices
						over Tailscale
					</li>
				</ul>
				<div class="flex flex-wrap gap-x-6 gap-y-2">
					<a
						href={resolve('/docs/[...page]', { page: 'api' })}
						class="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
					>
						API reference <ArrowRight class="size-3.5" />
					</a>
					<a
						href={resolve('/docs/[...page]', { page: 'cli' })}
						class="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
					>
						Command line <ArrowRight class="size-3.5" />
					</a>
				</div>
			</div>

			<!-- A terminal window, dark in both themes: it reads as "code" at a
			     glance and gives the page a strong focal point. -->
			<div
				class="overflow-hidden rounded-xl border border-border bg-[#111] font-mono text-[12px] leading-6 text-[#e7e7e7] sm:text-[13px]"
			>
				<div class="flex h-9.75 items-center justify-between border-b border-white/10 pr-1.5 pl-4">
					<span aria-hidden="true" class="flex gap-1.5">
						<span class="size-2.5 rounded-full bg-white/15"></span>
						<span class="size-2.5 rounded-full bg-white/15"></span>
						<span class="size-2.5 rounded-full bg-white/15"></span>
					</span>
					<CopyButton text={API_CALL} what="code" class="p-2 text-white/45" />
				</div>
				<!-- `terminal-code` gives the tokens a palette made for panels that
				     are dark in both themes (prism-theme.css).
				     Kept to its line breaks, and scrolls sideways on phones rather
				     than wrapping the JSON. The HTML is Prism's output for our own
				     constant. -->
				<!-- eslint-disable svelte/no-at-html-tags -->
				<div class="terminal-code overflow-x-auto p-5">
					<p class="whitespace-pre">
						<span class="mr-[1ch] text-accent select-none">$</span>{@html API_CALL_HTML}
					</p>
				</div>
				<!-- eslint-enable svelte/no-at-html-tags -->
			</div>
		</div>

		<!-- Why depend on Llama instead of bundling a stack. The platform
		     argument, aimed at the people who'd make the choice.

		     Text above rather than beside the diagrams, so the two diagrams
		     can sit side by side and read as a before/after. Beside the text
		     they'd only get ~290px each, too narrow for the chips. -->
		<div class="mt-20 flex flex-col gap-8">
			<div class="flex max-w-2xl flex-col gap-5">
				<h3 class="text-xl font-semibold">Nothing to bundle</h3>
				<p class="leading-relaxed">
					Your app talks to Llama over the API, and a one-click link installs the model it needs. No
					engine to ship, no gigabytes in your download — and your users keep one copy of each model
					for all their apps.
				</p>
			</div>

			<!-- A shared layer. The same 3-column grid on both sides. Without
			     Llama, each app stands on its own engine and model, three times
			     over; with Llama, the apps stand on one slab spanning all three
			     -- a shared foundation, so no connector lines are needed. One 8px
			     gap between all the pieces, across and down, so the drawing reads
			     as a single grid. The slab's Llama label sits beside the rows, not
			     above them, so the two sides come out equally tall. The rule
			     between them is inset 12px top and bottom (my-3), like the rule
			     between the rows is inset 12px either side (px-3), so neither
			     touches the slab's edge. The slab is
			     the one touch of sky, rather than a solid bar that outshouts the
			     page.

			     Each caption carries its side's disk use, so the saving is a
			     number and not just a count of boxes. Set like the caption
			     itself -- sans, muted -- so it doesn't compete with the drawing. -->
			<!-- Engine and model are peers -- two things the app relies on --
			     so they share one weight and color, split by a rule. -->
			{#snippet layerRows()}
				<span class="py-3">Engine</span>
				<!-- Wraps the size under the name on phones rather than overflowing. -->
				<span class="flex flex-wrap justify-between gap-x-2 py-3">
					Model <span class="font-mono whitespace-nowrap">{exampleModelSize}</span>
				</span>
			{/snippet}
			<div class="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
				<figure class="rounded-2xl border border-border bg-foreground/2 p-5">
					<figcaption class="mb-4 flex justify-between gap-3 text-sm text-muted-foreground">
						Without Llama
						<span>{3 * exampleModelGB} GB on disk</span>
					</figcaption>
					<div class="grid grid-cols-3 gap-2">
						{#each DIAGRAM_APPS as a (a)}
							<div class="flex flex-col gap-2">
								<span
									class="flex h-12 items-center justify-center rounded-lg border border-border bg-background text-center font-medium"
									>{a}</span
								>
								<div
									class="flex flex-col divide-y divide-border rounded-lg border border-border bg-foreground/3 px-3"
								>
									{@render layerRows()}
								</div>
							</div>
						{/each}
					</div>
				</figure>
				<figure class="rounded-2xl border border-border bg-foreground/2 p-5">
					<figcaption class="mb-4 flex justify-between gap-3 text-sm text-muted-foreground">
						With Llama
						<span>{exampleModelSize} on disk</span>
					</figcaption>
					<div class="flex flex-col gap-2">
						<div class="grid grid-cols-3 gap-2">
							{#each DIAGRAM_APPS as a (a)}
								<span
									class="flex h-12 items-center justify-center rounded-lg border border-border bg-background text-center font-medium"
									>{a}</span
								>
							{/each}
						</div>
						<div class="flex rounded-lg border border-sky-500/40 bg-sky-500/8">
							<span
								class="my-3 flex items-center gap-1.5 border-r border-sky-500/25 px-4 font-medium"
							>
								<Logo --logo-height="0.625rem" /> Llama
							</span>
							<div class="flex flex-1 flex-col divide-y divide-sky-500/25 px-3">
								{@render layerRows()}
							</div>
						</div>
					</div>
				</figure>
			</div>
		</div>
	</section>

	<!-- A command to copy: a subtle chip, so it reads as something for a
	     terminal. It wraps at spaces on narrow screens rather than scrolling:
	     a clipped command hides its end (`| sh`), and the copy button is
	     there for copying it right. `min-h-10` is a minimum rather than a
	     height, so a wrapped command still grows. -->
	{#snippet command(text: string)}
		<div
			class="flex min-h-10 min-w-0 items-center gap-1 rounded-lg bg-foreground/6 py-1 pr-1 pl-3 text-[13px]"
		>
			<!-- Programs in the page's sky highlight, flags and pipes muted, so
			     the parts you'd change or read -- the package, the URL, the
			     model -- stay in the plain foreground. No whitespace between the
			     spans, so the copied selection matches the text. -->
			<code class="min-w-0 flex-1 font-mono wrap-break-word text-foreground"
				>{#each commandWords(text) as { kind, word }, i (i)}<span
						class={{
							'text-muted-foreground': kind === 'flag' || kind === 'pipe',
							'text-sky-700 dark:text-sky-400': kind === 'program'
						}}>{word}</span
					>{/each}</code
			>
			<CopyButton
				{text}
				what="command"
				iconClass="size-3.5"
				class="shrink-0 rounded-md p-1.5 text-muted-foreground"
			/>
		</div>
	{/snippet}

	<!-- 9. Closing CTA: how to get Llama. The page's ending, so it's
	     centered like the hero and mirrors it: heading, the download
	     button, small print. No cards: two cards side by side read as two
	     equal choices, and needed a "Recommended" label to say which one to
	     pick. Here the app is first and biggest, so it's plainly the main
	     way in.

	     The command line follows as a question, "Just want the command
	     line?" -- "just" implies the app already includes it (it installs
	     the same `llama` binary, linked onto PATH, as "Build on Llama"
	     says), so the button needs no caption saying so. That frees the
	     small print under the button for Homebrew, the install Mac users in
	     the terminal would reach for anyway (Mac only: the cask is the Mac
	     app). The command line gets just its install command: running a
	     model is the docs' job. Command blocks are as wide as their command,
	     not a fixed column.

	     Linux has no app, so it gets the command line alone, as a plain
	     instruction rather than a question.

	     The page has no footer, so this section's bottom padding is the
	     page's end. `pb-60` (240px) leaves more room below than the 176px
	     above the heading (the previous section's `py-20` plus this one's
	     `pt-24`): about as much as above still felt like the page stopped
	     short. -->
	<section class="flex flex-col items-center gap-10 pt-24 pb-60 text-center">
		<!-- Heading and subheading grouped with the same gap-4 as every other
		     section's header, so they read as a pair rather than the subheading
		     floating halfway between the heading and what follows. -->
		<div class="flex flex-col gap-4">
			<h2 class="text-4xl leading-tight font-semibold tracking-tight">Local AI starts here</h2>
			<p class="text-lg leading-relaxed text-pretty">Free, open source, and yours to keep.</p>
		</div>

		<!-- The hero's buttons, at the hero's size. Homebrew is small print
		     with a copy button rather than a command block, so it reads as an
		     aside to the button rather than a second option beside it. The
		     command sits in a small chip, which also keeps the lead-in "or"
		     from reading as the command's first word -- as plain text in the
		     same gray, it did. A lowercase "or" with no colon continues the
		     button ("Download for Mac, or ..."); the command itself says
		     Homebrew, so the lead-in doesn't need to. -->
		<div data-os-only="mac windows other" class="flex flex-col items-center gap-3">
			<div class="flex flex-col items-center gap-3 sm:flex-row">
				{@render downloadButtons()}
			</div>
			<p
				data-os-only="mac"
				class="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground"
			>
				or
				<span
					class="inline-flex items-center gap-0.5 rounded-md bg-foreground/6 py-0.5 pr-0.5 pl-2"
				>
					<code class="font-mono text-[13px] text-foreground/80">{BREW_COMMAND}</code>
					<CopyButton
						text={BREW_COMMAND}
						what="command"
						iconClass="size-3.5"
						class="rounded-md p-1 text-muted-foreground"
					/>
				</span>
			</p>
		</div>

		<div class="mt-6 flex max-w-full flex-col items-center gap-4">
			<p class="leading-relaxed text-pretty text-foreground/70">
				<span data-os-only="mac windows other">Just want the command line?</span><span
					data-os-only="linux">Install the command line:</span
				>
			</p>
			{#each CLI_INSTALL as c (c.command)}
				<div data-os-only={c.os} class="w-fit max-w-full text-left">
					{@render command(c.command)}
				</div>
			{/each}
		</div>
	</section>
</main>
