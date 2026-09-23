<script lang="ts">
	// The homepage.
	//
	// What we're optimizing for: the 10M-users goal, which means most
	// visitors are *not* local-model enthusiasts. So the page speaks to a
	// newcomer first and a developer second, but it frames Llama as a
	// platform from the very top -- chat is shown as one app among several
	// that use the same local model, never as the product itself.
	//
	// Section order follows the questions a visitor asks, in order:
	//   1. What is this?            -- hero text: a tiny menu bar app, two uses
	//   2. What does it look like?  -- the real menu, with numbered callouts
	//   3. How is it a platform?    -- "Like OpenAI": chat for you, API for apps
	//   4. Is it hard?              -- "Nothing to set up": what Llama tunes
	//   5. Is it heavy?             -- 4 MB, menu bar, unloads when idle
	//   6. Will it run on my Mac?   -- models by memory tier
	//   7. Can I build on it?       -- the API, one changed line
	//   8. Why not bundle my own?   -- without/with diagram
	import {
		ArrowDown,
		ArrowRight,
		Braces,
		Check,
		ChevronRight,
		Code,
		Copy,
		FileText,
		Gauge,
		Image,
		Layers,
		MessageSquare,
		Package,
		ScrollText,
		Terminal,
		Video,
		Zap
	} from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import appleIcon from '$lib/assets/apple-icon.svg?raw';
	import { logoFor } from '$lib/assets/logos';
	import { displaySize, families, minMemGB, slugify } from '$lib/catalog';
	import { InstallCommand, Logo } from '$lib/components/app';
	import { Button } from '$lib/components/ui/button';
	import { MACOS_DOWNLOAD_URL } from '$lib/constants';
	import Prism from '$lib/prism';
	import { deviceInfo } from '$lib/stores/device/index.svelte';
	import { toast } from 'svelte-sonner';

	// -- Hero shot callouts ------------------------------------------------------
	//
	// Numbered to match the markers placed on the menu. Each one maps a part
	// of the menu to the OpenAI mental model or to the "easy" promise.
	const CALLOUTS = [
		{
			body: 'Chat with any model in your browser. Like ChatGPT, but on your Mac.',
			title: 'Open chat'
		},
		{
			body: 'Your apps connect here. It speaks the OpenAI API, so coding agents, editors, and scripts just work.',
			title: 'A local API'
		},
		{
			body: 'Models that fit your Mac, one click to install. Llama picks the settings.',
			title: 'Recommended for your Mac'
		}
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

	// -- Menu mock ------------------------------------------------------------------
	//
	// Rows as the shipping menu shows them (lowercase family names, a size
	// chip), with real download sizes from the catalog.
	type MenuModel = { brand: string; name: string; params: string; size: string };

	const MENU_INSTALLED: MenuModel[] = [
		{ brand: 'Qwen', name: 'Qwen3.8', params: '27B', size: '19.0 GB' },
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
	// The three "is it heavy?" facts. Not "no windows" or "no Dock icon":
	// Settings opens a window and shows a Dock icon while it's open. Model
	// storage is the stronger third point anyway -- models are the heavy
	// part, and other apps keep their own copies. Each card draws its fact
	// (see the snippets in the markup), so the copy here stays one line.
	const LIGHT = [
		{
			body: 'A native Mac app, and just a 1 MB download — smaller than a photo.',
			id: 'size',
			title: '4 MB app'
		},
		{
			body: 'Kept in the Hugging Face cache, shared with llama.cpp and other tools.',
			id: 'storage',
			title: 'Each model stored once'
		},
		{
			body: 'Models load when something asks for one and unload after 5 minutes idle.',
			id: 'idle',
			title: 'Nothing loaded when idle'
		}
	] as const;

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

	// -- API snippet ---------------------------------------------------------------
	//
	// Written so no line is wider than the card on desktop, and with the one
	// line that differs from plain OpenAI usage highlighted (`changed`).
	const SNIPPETS = [
		{
			changed: 3,
			code: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:9931/v1",
    api_key="local",
)

reply = client.chat.completions.create(
    model="ggml-org/gpt-oss-20b-GGUF:MXFP4",
    messages=[{"role": "user", "content": "Hi!"}],
)`,
			id: 'python',
			label: 'Python',
			lang: 'python'
		},
		{
			changed: 3,
			code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:9931/v1",
  apiKey: "local",
});

const reply = await client.chat.completions.create({
  model: "ggml-org/gpt-oss-20b-GGUF:MXFP4",
  messages: [{ role: "user", content: "Hi!" }],
});`,
			id: 'js',
			label: 'JavaScript',
			lang: 'javascript'
		},
		{
			changed: 0,
			code: `curl http://localhost:9931/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "ggml-org/gpt-oss-20b-GGUF:MXFP4",
    "messages": [{"role": "user", "content": "Hi!"}]
  }'`,
			id: 'curl',
			label: 'curl',
			lang: 'bash'
		}
	];

	// Highlighted once up front. The whole snippet is highlighted rather than
	// line by line because some tokens span lines (the curl JSON body is one
	// multi-line string), so the changed line is marked with a separate band
	// behind the text instead of by wrapping each line.
	const highlighted = Object.fromEntries(
		SNIPPETS.map((s) => [s.id, Prism.highlight(s.code, Prism.languages[s.lang], s.lang)])
	);

	let snippetId = $state('python');
	let copied = $state(false);

	const snippet = $derived(SNIPPETS.find((s) => s.id === snippetId)!);

	function copySnippet() {
		navigator.clipboard.writeText(snippet.code);
		toast.success('Copied to clipboard!');
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// -- Without / with diagram ----------------------------------------------------
	//
	// The per-app model size is a real download (Qwen 3.8 at Q4) rather than a
	// made-up number, so the waste it illustrates is honest.
	const DIAGRAM_APPS = ['Chat app', 'Coding agent', 'Your app'];
	const exampleModelSize = displaySize(
		families.find((f) => f.name === 'Qwen 3.8')?.sizes[0]?.builds.find((b) => b.quant === 'Q4_K_M')
			?.sizeBytes
	).replace(/\.\d+ GB$/, ' GB');
</script>

<svelte:head>
	<title>Llama · Your AI, on your computer</title>
	<meta
		name="description"
		content="Run the latest open models on your computer. Chat with them, or connect them to your coding agents, editors, and apps. Free, private, and nothing to configure."
	/>
</svelte:head>

<!-- Two text colors only. Content -- headings and the paragraphs under them --
     uses the default foreground. `text-muted-foreground` is for asides: small
     print, captions, labels, and the UI inside mockups. -->
<main class="mx-auto w-full max-w-5xl px-6 md:px-12">
	<!-- A numbered marker, shared by the menu and the callouts so the two
	     visibly refer to each other. -->
	{#snippet marker(n: number)}
		<span
			class="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white"
			>{n}</span
		>
	{/snippet}

	<!-- A marker pinned to the menu's edge, level with the text it labels,
	     so the menu's own layout isn't shifted to make room. It's placed
	     relative to the labeled text (wrap that text in a relative span):
	     the menu's padding (12px) + row padding (4px) + border (1px) put the
	     edge 17px from the text, and backing off by half the marker (10px)
	     centers it on the edge. Left-edge markers face the callouts; "Open
	     chat" is right-aligned, so its marker sits on the right edge where
	     it can't be mistaken for the "Llama" title. -->
	{#snippet edgeMarker(n: number, side: 'left' | 'right')}
		<span
			class="absolute top-1/2 -translate-y-1/2 {side === 'left'
				? 'right-[calc(100%+7px)]'
				: 'left-[calc(100%+7px)]'} rounded-full ring-2 ring-background"
		>
			{@render marker(n)}
		</span>
	{/snippet}

	<!-- One model row in the menu mock. Installed rows open a submenu
	     (chevron); recommended rows download (arrow). -->
	{#snippet menuModel(m: MenuModel, recommended: boolean)}
		<div class="flex items-center gap-2.5 px-1 py-1.5">
			<span
				class="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/6 [&_svg]:size-4"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html logoFor(m.brand)}
			</span>
			<span class="min-w-0 flex-1">
				<span class="flex items-center gap-1.5">
					{m.name}
					<span class="rounded border border-border px-1 text-[10px] text-muted-foreground"
						>{m.params}</span
					>
				</span>
				<span class="block text-xs text-muted-foreground">{m.size}</span>
			</span>
			{#if recommended}
				<ArrowDown class="size-3.5 text-muted-foreground" />
			{:else}
				<ChevronRight class="size-3.5 text-muted-foreground" />
			{/if}
		</div>
	{/snippet}

	<!-- 1. Hero. The headline stays emotional and short; the subline does
	     the explaining: what it physically is (a tiny menu bar app), what it
	     does (runs models), and the two ways to use it (chat, other apps).
	     The OpenAI comparison is left to section 3, where there's room to
	     explain it -- in one line it confuses anyone who knows OpenAI only
	     as ChatGPT. -->
	<section class="flex flex-col items-center gap-7 pt-10 pb-12 text-center md:pt-14">
		<span
			class="rounded-full border border-foreground/10 px-3 py-1 font-mono text-xs text-muted-foreground"
		>
			Built on llama.cpp and Hugging Face
		</span>

		<h1
			class="text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl md:text-7xl"
		>
			Your AI.<br />On your computer.
		</h1>

		<p class="max-w-3xl text-lg leading-relaxed text-balance md:text-xl">
			Llama is a tiny menu bar app that runs the latest open models on your Mac. Chat with them, or
			use them in your other apps.
		</p>

		<div class="flex flex-col items-center gap-3 sm:flex-row">
			<Button href={MACOS_DOWNLOAD_URL} size="lg" class="h-12 px-6 text-[15px]">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<span class="mb-0.5">{@html appleIcon}</span>
				Download for Mac
			</Button>

			<!-- The second button is the demo video, not "For developers":
			     developers scroll to their section anyway, while "what does it
			     actually do?" is the question most visitors still have here.
			     The length in the label tells people it's a video and a small
			     commitment -- keep it true when the video changes. No href yet
			     (so it renders as a plain button and does nothing): the current
			     intro predates the rename and is being replaced. Add the new
			     video's URL here, with target="_blank". -->
			<Button size="lg" variant="outline" class="h-12 px-6 text-[15px]">
				<Video class="size-4.5" />
				2-min demo
			</Button>
		</div>

		<!-- The reassurances sit right under the buttons, where the "should I
		     click this?" doubts arise: size, cost, and privacy. Size leads
		     because it annotates the Download button directly above it. The
		     rest used to end the subline as a sentence; as a list they scan
		     faster and leave the subline to say what Llama is. "Nothing to
		     set up" isn't here: it's a promise rather than a checkable fact,
		     and section 4 makes it properly. -->
		<p class="-mt-3 text-sm text-muted-foreground">
			1 MB download · Free and open source · Private
		</p>

		<!-- About half our visitors aren't on a Mac. Until there's a native
		     app for them, the CLI is the honest next step, not a dead end. -->
		{#if !deviceInfo.isMac}
			<div class="flex w-full max-w-2xl flex-col items-center gap-3">
				<p class="text-sm text-muted-foreground">Not on a Mac? Install from the terminal:</p>
				<InstallCommand />
			</div>
		{/if}
	</section>

	<!-- 2. Hero shot: the actual product. What you download is a menu bar
	     menu, so that's the picture -- modeled on the real one, with three
	     numbered callouts pointing at the parts that explain everything
	     else: "Open chat" (the ChatGPT part), the address (the API part),
	     and the recommendations (why it's easy). Chat is reached *from* the
	     menu, which is exactly the relationship we want people to see. -->
	<section class="pb-24">
		<div
			class="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(170deg,#b9c7d6_0%,#d8cfbf_70%,#cdb99a_100%)] dark:bg-[linear-gradient(170deg,#1c2530_0%,#2a2620_70%,#33291d_100%)]"
		>
			<!-- macOS menu bar. The Llama icon is "pressed", since its menu is
			     open. Sizes follow the real bar: status icons roughly as tall as
			     the clock's capitals. The Logo component sizes itself from
			     --logo-height (a utility class can't override it). Wi-Fi and
			     battery are drawn inline to match macOS's glyphs -- the Lucide
			     ones are thin outlines and read as a different OS. -->
			<div
				aria-hidden="true"
				class="flex items-center justify-end gap-3.5 bg-background/50 px-4 py-1 text-xs font-medium text-foreground/85 backdrop-blur"
			>
				<span class="flex h-5 items-center rounded bg-foreground/15 px-1.5">
					<Logo --logo-height="0.75rem" />
				</span>

				<!-- Wi-Fi: a filled wedge plus two thick arcs, like SF Symbols'
				     `wifi`. Arcs share the wedge's center and span ±45°. -->
				<svg viewBox="0 0 20 15" class="h-[12px] w-auto" fill="none">
					<path
						d="M1.87 5.87A11.5 11.5 0 0 1 18.13 5.87M4.84 8.84A7.3 7.3 0 0 1 15.16 8.84"
						stroke="currentColor"
						stroke-width="2.6"
						stroke-linecap="round"
					/>
					<path
						d="M10 14.2 7.31 11.31A3.8 3.8 0 0 1 12.69 11.31Z"
						fill="currentColor"
						stroke="currentColor"
						stroke-linejoin="round"
					/>
				</svg>

				<!-- Battery, charging: a solid body with the small unfilled share
				     dimmed, a dimmed terminal, and a large bolt knocked out of the
				     body. Proportions follow the macOS glyph (about 2:1). -->
				<svg viewBox="0 0 28 13" class="h-[12px] w-auto">
					<mask id="battery-bolt">
						<rect width="28" height="13" fill="white" />
						<path d="M13.3 1.4 7.8 7.4h3.4l-1.3 4.2 5.3-6h-3.4Z" fill="black" />
					</mask>
					<g mask="url(#battery-bolt)">
						<rect width="24.5" height="13" rx="4" fill="currentColor" opacity="0.35" />
						<path d="M4 0h16v13H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z" fill="currentColor" />
					</g>
					<rect x="25.6" y="4.2" width="2" height="4.6" rx="1" fill="currentColor" opacity="0.4" />
				</svg>

				<span>Wed 10:24</span>
			</div>

			<div class="grid grid-cols-1 gap-6 p-4 md:grid-cols-[1fr_21rem] md:gap-10 md:p-8 md:pt-2">
				<!-- Callouts. Written directly on the wallpaper -- no card, no
				     shadow -- so they read as annotations *about* the menu, not as
				     more UI. On desktop the column is centered in the space left of
				     the menu, both ways, so the margins around it are even. The
				     grid's padding is uneven (the menu hangs just under the bar, so
				     8px on top vs 32px below); md:mt-6 shifts the centered column
				     down by half that difference, centering it on the whole wallpaper
				     area rather than the padded cell. After the menu on phones. -->
				<ol
					class="order-2 flex max-w-sm flex-col gap-7 px-1 py-2 md:order-1 md:mt-6 md:self-center md:justify-self-center"
				>
					{#each CALLOUTS as c, i (c.title)}
						<li class="flex gap-3">
							{@render marker(i + 1)}
							<span>
								<span class="block text-sm font-medium">{c.title}</span>
								<span class="mt-0.5 block text-sm leading-relaxed text-foreground/70">
									{c.body}
								</span>
							</span>
						</li>
					{/each}
				</ol>

				<!-- The menu itself. Mirrors the shipping layout: name and
				     address, "Open chat", installed models, recommendations,
				     catalog link, footer. Quant and context chips are left out
				     on purpose: this page promises newcomers never see that jargon. -->
				<div
					aria-hidden="true"
					class="order-1 w-full rounded-xl border border-border bg-background/95 p-3 text-sm shadow-xl backdrop-blur md:order-2"
				>
					<div class="flex items-start justify-between px-1">
						<div>
							<p class="flex items-center gap-1.5 font-semibold">
								Llama <span class="size-1.5 rounded-full bg-foreground/30"></span>
							</p>
							<p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
								<span class="relative">
									{@render edgeMarker(2, 'left')}
									localhost:9931
								</span>
								<Copy class="size-3" />
							</p>
						</div>
						<p class="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
							<span class="relative">
								Open chat
								{@render edgeMarker(1, 'right')}
							</span>
						</p>
					</div>

					<p class="mt-3 border-t border-border px-1 pt-2 text-xs text-muted-foreground">
						Installed models
					</p>
					{#each MENU_INSTALLED as m (m.name + m.params)}
						{@render menuModel(m, false)}
					{/each}

					<p
						class="mt-2 flex items-center gap-1.5 border-t border-border px-1 pt-2 text-xs text-muted-foreground"
					>
						<span class="relative">
							{@render edgeMarker(3, 'left')}
							Recommended for your Mac
						</span>
					</p>
					{#each MENU_RECOMMENDED as m (m.name + m.params)}
						{@render menuModel(m, true)}
					{/each}

					<div
						class="mt-2 flex items-center justify-between border-t border-border px-1 pt-2 text-xs text-muted-foreground"
					>
						<span>llama.cpp</span>
						<span class="flex gap-2"><span>Settings</span><span>Quit</span></span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 3. The mental model, spelled out. Everyone knows OpenAI has an app
	     for people (ChatGPT) and an API for apps; Llama has the same two
	     halves, on your computer. This is the section that answers "how is
	     a menu bar app a platform?". -->
	<section class="py-20">
		<div class="mb-10 flex max-w-2xl flex-col gap-4">
			<h2 class="text-3xl font-semibold tracking-tight">Like OpenAI, but on your Mac</h2>
			<p class="leading-relaxed">
				OpenAI has ChatGPT for people and an API for the apps built on it. Llama gives you both,
				running on your own computer, with models you choose.
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
				<!-- A div, not a p: the global `p code` rule (prism-theme.css) adds
				     side margins and the accent color, which indents the address
				     when it wraps onto its own line. -->
				<div class="text-sm text-muted-foreground">
					Point any app that works with OpenAI at
					<code class="font-mono text-foreground">localhost:9931/v1</code>
				</div>
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
	     one model where every setting is already on "Auto". -->
	<section class="grid grid-cols-1 items-center gap-10 py-20 md:grid-cols-2 md:gap-12">
		<div class="flex flex-col gap-4">
			<h2 class="text-3xl font-semibold tracking-tight">Nothing to set up</h2>
			<p class="leading-relaxed">
				Running AI locally used to mean reading forum threads about settings. Llama checks your Mac
				and sets up each model to run well on it, based on how llama.cpp actually works. You only
				pick which model to talk to.
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
					<span class="rounded border border-border px-1 text-[10px] text-muted-foreground"
						>{EXAMPLE_MODEL.params}</span
					>
				</span>
				<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Check class="size-3.5 text-accent" /> Chosen by Llama, for your Mac
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
							class="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"
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
	     vertical center, so it reads as that file's size. -->
	{#snippet sizeArt()}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-3">
				<span
					class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground"
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
				<span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5">
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

	<!-- Stored once: three tools converging on a single model file. The
	     chips sit in a 3-column grid so their centers land near 1/6, 1/2,
	     and 5/6 of the width, where the connectors start. The connectors are right-angled, like a bus: each chip drops to a shared horizontal line, and one line drops from its middle to the file. The SVG stretches
	     to the panel's width (preserveAspectRatio="none"); non-scaling
	     strokes keep the lines 1px regardless. -->
	{#snippet storageArt()}
		<div class="flex flex-col items-center">
			<div class="grid w-full grid-cols-3 gap-1.5 text-center">
				{#each SHARED_BY as tool (tool)}
					<span class="truncate rounded-md border border-border px-1 py-1">{tool}</span>
				{/each}
			</div>
			<svg
				viewBox="0 0 120 28"
				preserveAspectRatio="none"
				class="h-7 w-full text-foreground/25"
				fill="none"
			>
				<path d="M20 0V14H100V0M60 0V28" stroke="currentColor" vector-effect="non-scaling-stroke" />
			</svg>
			<!-- Full width, spanning the three tools above, and laid out like
			     the file rows in the size drawing: the model and where it lives
			     on the left, its size on disk on the right, on the name's line. -->
			<span
				class="flex w-full items-center gap-2.5 rounded-lg border border-foreground/20 bg-foreground/3 py-1.5 pr-3 pl-2.5"
			>
				<span class="[&_svg]:size-4">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html logoFor(EXAMPLE_MODEL.brand)}
				</span>
				<span class="min-w-0 flex-1">
					<span class="flex items-baseline justify-between gap-3">
						<span class="font-medium">{EXAMPLE_MODEL.name} {EXAMPLE_MODEL.params}</span>
						<span class="font-mono text-muted-foreground">{EXAMPLE_MODEL.size}</span>
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
	     memory, so they're told apart by style: in use is solid, idle is a
	     paler fill under a dashed edge -- still loaded, just waiting. No axis
	     title ("memory used"): the block labels and the card's text already
	     say what's up and what's down. "Unloaded" is right-aligned rather
	     than centered in its stretch, which is too narrow for it. The
	     labels are positioned in % of the width, matching the chart's x
	     coordinates out of 200 (30 = 15%, 90 = 45%, 150 = 75%), and the
	     plateau spans y 8-110 of the 112px-tall box (h-28), hence pt-2 on the block labels and bottom-1.5 (2px baseline + 4px) on "Unloaded". -->
	{#snippet idleArt()}
		<div class="flex flex-col">
			<div class="relative h-28 text-[11px] whitespace-nowrap">
				<svg
					viewBox="0 0 200 112"
					preserveAspectRatio="none"
					class="absolute inset-0 size-full text-accent"
					fill="none"
				>
					<path d="M30 110V8H90V110Z" fill="currentColor" fill-opacity="0.22" />
					<path d="M90 110V8H150V110Z" fill="currentColor" fill-opacity="0.07" />
					<path
						d="M0 110H30V8H90M150 8V110H200"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linejoin="round"
						vector-effect="non-scaling-stroke"
					/>
					<path
						d="M90 8H150"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-dasharray="4 3"
						vector-effect="non-scaling-stroke"
					/>
				</svg>
				<span
					class="absolute inset-y-0 left-[15%] flex w-[30%] items-center justify-center pt-2 font-medium"
					>In use</span
				>
				<span class="absolute inset-y-0 left-[45%] flex w-[30%] items-center justify-center pt-2"
					>5 min idle</span
				>
				<span class="absolute right-0 bottom-1.5 text-muted-foreground">Unloaded</span>
			</div>
		</div>
	{/snippet}

	<section class="py-20">
		<h2 class="mb-10 text-3xl font-semibold tracking-tight">Light enough to forget it's there</h2>
		<!-- Three across only from lg: below that, the cards are too narrow
		     for the drawings (the "stored once" chips would truncate). -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			{#each LIGHT as l (l.id)}
				<!-- Text first, drawing pinned to the bottom (mt-auto). The grid
				     stretches every card to the tallest one, and the slack goes
				     into the gap between the two -- so the drawings keep their
				     natural heights instead of being boxed to a common one. -->
				<div class="flex flex-col gap-8 rounded-2xl border border-border bg-foreground/2 p-6">
					<div>
						<h3 class="font-medium">{l.title}</h3>
						<p class="mt-1 leading-relaxed text-muted-foreground">{l.body}</p>
					</div>
					<div aria-hidden="true" class="mt-auto text-xs">
						{#if l.id === 'size'}
							{@render sizeArt()}
						{:else if l.id === 'storage'}
							{@render storageArt()}
						{:else}
							{@render idleArt()}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</section>
	<!-- 6. Models by memory tier. Answers "will it run on my computer?" --
	     the most common newcomer worry -- with the one number they can check. -->
	<section class="py-20">
		<div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div class="flex max-w-xl flex-col gap-3">
				<h2 class="text-3xl font-semibold tracking-tight">A great model for every Mac</h2>
				<p>Llama suggests one that fits when you open it. Here's where to start.</p>
			</div>
			<a
				href={resolve('/models')}
				class="inline-flex shrink-0 items-center gap-1.5 text-sm underline underline-offset-4"
			>
				All models <ArrowRight class="size-3.5" />
			</a>
		</div>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{#each PICKS as p (p.family)}
				<a
					href={resolve(`/models/${slugify(p.f.name)}`)}
					class="flex flex-col gap-4 rounded-2xl border border-border bg-foreground/2 p-6 transition-colors hover:border-foreground/25"
				>
					{#if p.mem}
						<span class="text-sm text-muted-foreground">{p.mem} GB Mac or more</span>
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
	</section>

	<!-- 7. Developers: the API. The highlighted line makes "change one
	     line" shown, not claimed. -->
	<section
		id="developers"
		class="grid scroll-mt-8 grid-cols-1 items-center gap-12 py-24 md:grid-cols-5"
	>
		<div class="flex flex-col gap-5 md:col-span-2">
			<span class="font-mono text-xs font-medium tracking-widest text-accent uppercase">
				For developers
			</span>
			<h2 class="text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
				OpenAI-compatible.
			</h2>
			<p class="leading-relaxed">
				If your code works with OpenAI, it works with Llama. Change the base URL and keep everything
				else — no API keys, no usage bills.
			</p>
			<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
				<li class="flex gap-2">
					<Check class="mt-0.5 size-4 shrink-0" /> OpenAI- and Anthropic-compatible endpoints
				</li>
				<li class="flex gap-2">
					<Check class="mt-0.5 size-4 shrink-0" /> Streaming, tool calling, structured output, vision
				</li>
				<li class="flex gap-2">
					<Check class="mt-0.5 size-4 shrink-0" /> Already use llama.cpp? Your models show up automatically
				</li>
				<li class="flex gap-2">
					<Check class="mt-0.5 size-4 shrink-0" /> Reach it from your other devices over Tailscale
				</li>
			</ul>
			<a
				href={resolve('/docs/[...page]', { page: 'api' })}
				class="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
			>
				API reference <ArrowRight class="size-3.5" />
			</a>
		</div>

		<!-- Dark in both themes: it reads as
		     "code" at a glance and gives the page a strong focal point. -->
		<div
			class="overflow-hidden rounded-xl border border-border bg-[#111] text-[#e7e7e7] shadow-xl md:col-span-3"
		>
			<div class="flex items-center justify-between border-b border-white/10 px-2">
				<div class="flex" role="tablist">
					{#each SNIPPETS as s (s.id)}
						<button
							role="tab"
							aria-selected={snippetId === s.id}
							onclick={() => (snippetId = s.id)}
							class="cursor-pointer border-b px-3 py-3 text-xs {snippetId === s.id
								? 'border-white text-white'
								: 'border-transparent text-white/45 hover:text-white/80'}"
						>
							{s.label}
						</button>
					{/each}
				</div>
				<button
					onclick={copySnippet}
					aria-label="Copy code"
					class="cursor-pointer p-2 text-white/45 hover:text-white"
				>
					{#if copied}<Check class="size-4" />{:else}<Copy class="size-4" />{/if}
				</button>
			</div>

			<!-- `dark` opts the tokens into the dark Prism palette (prism-theme.css)
			     regardless of the page theme, since this card is dark in both.

			     The changed-line band is a neutral white rather than a color:
			     red reads as a removed line and green as an added one. It sits
			     at the line's offset (py-4 = 16px top padding, leading-6 = 24px
			     per line), and the code is `relative` so it paints above it.

			     The HTML is Prism's output for our own constant snippets. -->
			<!-- eslint-disable svelte/no-at-html-tags -->
			<pre
				class="dark relative overflow-x-auto py-4 font-mono text-[12px] leading-6 sm:text-[13px]"><div
					class="absolute inset-x-0 h-6 border-l-2 border-white/60 bg-white/[0.08]"
					style="top: {16 + snippet.changed * 24}px"
					aria-hidden="true"></div><code class="relative block px-5"
					>{@html highlighted[snippet.id]}</code
				></pre>
			<!-- eslint-enable svelte/no-at-html-tags -->
		</div>
	</section>

	<!-- 8. Developers: why depend on Llama instead of bundling a stack. The
	     platform argument, aimed at the people who'd make the choice. -->
	<section class="grid grid-cols-1 items-center gap-12 pb-24 md:grid-cols-5">
		<div class="flex flex-col gap-5 md:col-span-2">
			<h2 class="text-2xl leading-tight font-semibold tracking-tight">
				Build on Llama instead of bundling it
			</h2>
			<p class="leading-relaxed">
				Your app talks to Llama over the API, and a one-click link installs the model it needs. No
				engine to ship, no gigabytes in your download — and your users keep one copy of each model
				for all their apps.
			</p>
		</div>

		<div class="flex flex-col gap-3 md:col-span-3">
			<figure class="rounded-2xl border border-border p-5">
				<figcaption class="mb-4 text-sm text-muted-foreground">Without Llama</figcaption>
				<div class="grid grid-cols-3 gap-2 text-center text-xs">
					{#each DIAGRAM_APPS as a (a)}
						<div class="flex flex-col gap-1.5">
							<div class="rounded-lg bg-foreground/6 px-2 py-2.5 font-medium">{a}</div>
							<div
								class="rounded-lg border border-dashed border-foreground/20 px-2 py-2 text-muted-foreground"
							>
								own engine
							</div>
							<div
								class="rounded-lg border border-dashed border-foreground/20 px-2 py-2 text-muted-foreground"
							>
								own {exampleModelSize} copy
							</div>
						</div>
					{/each}
				</div>
			</figure>

			<figure class="rounded-2xl border border-accent/40 bg-accent/5 p-5">
				<figcaption class="mb-4 text-sm text-muted-foreground">With Llama</figcaption>
				<div class="flex flex-col gap-1.5 text-center text-xs">
					<div class="grid grid-cols-3 gap-2">
						{#each DIAGRAM_APPS as a (a)}
							<div class="rounded-lg bg-foreground/6 px-2 py-2.5 font-medium">{a}</div>
						{/each}
					</div>
					<div class="rounded-lg bg-foreground px-2 py-2.5 font-medium text-background">
						Llama · one engine, kept up to date
					</div>
					<div class="rounded-lg border border-foreground/20 px-2 py-2 text-muted-foreground">
						one {exampleModelSize} copy, in the Hugging Face cache
					</div>
				</div>
			</figure>
		</div>
	</section>

	<!-- Closing CTA. Back to the newcomer: one button, one sentence. -->
	<section class="flex flex-col items-center gap-6 py-24 text-center">
		<h2 class="text-4xl font-semibold tracking-tight">Local AI starts here</h2>
		<p>Free, open source, and yours to keep.</p>
		<Button href={MACOS_DOWNLOAD_URL} size="lg" class="h-12 px-6 text-[15px]">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<span class="mb-0.5">{@html appleIcon}</span>
			Download for Mac
		</Button>
		<!-- For the developers who scrolled this far: the install they'd
		     reach for anyway. -->
		<p class="text-sm text-muted-foreground">
			or <code class="font-mono text-foreground">brew install --cask llama-app</code>
		</p>
		{#if !deviceInfo.isMac}
			<div class="mt-2 flex w-full max-w-2xl flex-col items-center gap-3">
				<p class="text-sm text-muted-foreground">Not on a Mac? Install from the terminal:</p>
				<InstallCommand />
			</div>
		{/if}
	</section>
</main>
