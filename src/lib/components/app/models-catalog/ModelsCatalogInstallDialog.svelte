<script lang="ts">
	// What every install click leads to, on both platforms. A modal rather
	// than a corner toast because in both cases the click's payoff is
	// something the user has to *act* on, and neither case can be confirmed
	// from the browser:
	//
	//   Mac      -- the row already fired the `llama://` deeplink, but the app
	//                is new and most visitors don't have it yet, so the common
	//                outcome is that nothing happened. That makes "download
	//                Llama" the main event, not a footnote in a toast that
	//                auto-dismisses in a corner.
	//   non-Mac  -- the app can't exist, so the CLI command *is* the result of
	//                the click; the user asked to see it.
	//
	// Sheet-style content: the title echoes exactly which build was clicked
	// (with quantizations expanded, neighboring rows differ only by quant, so
	// the confirmation guards against copying or installing the wrong one),
	// and both variants end with the CLI command, which works either way.
	//
	// Built on the native <dialog> element: focus trapping, Escape-to-close
	// and the backdrop come for free, no dialog dependency needed.
	import { Check, Copy, X } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { type Build, cliCommand, displaySize, minMemForBuild, type Size } from '$lib/catalog';
	import { MACOS_DOWNLOAD_URL } from '$lib/constants';
	import { deviceInfo } from '$lib/stores/device/index.svelte';

	// The build being installed plus its size (for the title), or null when the
	// dialog is closed. Owned by the page (bindable) so closing the dialog
	// clears it there too.
	let { run = $bindable() }: { run: { build: Build; size: Size } | null } = $props();

	let dialog = $state<HTMLDialogElement | null>(null);

	// Open/close the native dialog as `run` comes and goes.
	$effect(() => {
		if (!dialog) return;

		if (run && !dialog.open) dialog.showModal();

		if (!run && dialog.open) dialog.close();
	});

	// The byline under the title: quant, download size, and memory bar --
	// the same facts as the table row, echoed so the dialog stands alone.
	const byline = $derived.by(() => {
		if (!run) return '';

		const parts = [];

		if (run.build.quant) parts.push(run.build.quant.toUpperCase());

		if (run.build.sizeBytes) parts.push(displaySize(run.build.sizeBytes));

		const mem = minMemForBuild(run.build);

		if (mem) parts.push(`requires ${mem} GB+ memory`);

		return parts.join(' · ');
	});

	// Transient check-mark feedback on the copy button, same convention as the
	// homepage install snippet.
	let copied = $state(false);

	async function copyCli(cmd: string) {
		await navigator.clipboard.writeText(cmd);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<!-- onclose catches every way out (Escape, close button) and syncs `run`;
     clicking the backdrop closes too -- a click straight on the <dialog>
     element can only be the backdrop, since the inner div covers the rest. -->
<dialog
	bind:this={dialog}
	onclose={() => (run = null)}
	onclick={(e) => e.target === dialog && dialog?.close()}
	class="m-auto w-full max-w-xl rounded-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/10"
>
	{#if run}
		<div class="relative px-8 pt-8 pb-7">
			<button
				type="button"
				aria-label="Close"
				onclick={() => dialog?.close()}
				class="absolute top-4 right-4 cursor-pointer text-muted-foreground hover:text-foreground"
			>
				<X class="size-4" />
			</button>

			<h2 class="text-[17px] font-semibold tracking-tight">
				{deviceInfo.isMac ? 'Install' : 'Run'}
				{run.size.name}
			</h2>
			{#if byline}
				<p class="mt-1 text-[13px] text-muted-foreground tabular-nums">{byline}</p>
			{/if}

			{#if deviceInfo.isMac}
				<!-- The deeplink is already away by the time this renders. Whether
				     anything caught it is unobservable here, so the copy states the
				     send (past tense, no promise) and then leads with the download,
				     which is what the majority still needs. -->
				<p class="mt-5 text-[13px] text-muted-foreground">
					Sent to Llama. If you have the app, it’s downloading now.
				</p>

				<!-- Tagged as the "Download" goal; source separates this click from
				     the hero banner's download link -->
				<a
					href={MACOS_DOWNLOAD_URL}
					rel="external"
					class="plausible-event-name=Download plausible-event-source=dialog mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/80"
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 16 16"
						class="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M8 2v8" />
						<path d="M4.5 7L8 10.5 11.5 7" />
						<path d="M3 13.5h10" />
					</svg>
					Download Llama for Mac
				</a>

				<p class="mt-5 text-[13px] text-muted-foreground">
					Or use the <code class="mx-1 rounded bg-muted px-1 py-0.5 text-accent">llama</code> CLI:
				</p>
			{:else}
				<p class="mt-5 text-[13px] text-muted-foreground">In your terminal:</p>
			{/if}

			<div class="mt-2 w-full overflow-hidden rounded-xl border border-secondary bg-foreground/4">
				<div class="flex items-stretch justify-between">
					<code
						class="block min-w-0 flex-1 overflow-x-auto px-4 py-3 text-left font-mono text-[13px] whitespace-nowrap text-foreground/90"
					>
						{cliCommand(run.build)}
					</code>
					<button
						class="flex shrink-0 cursor-pointer items-center border-l border-secondary px-4 text-foreground/70 hover:text-foreground"
						aria-label={copied ? 'Copied command' : 'Copy command'}
						onclick={() => run && copyCli(cliCommand(run.build))}
					>
						{#if copied}
							<Check class="size-4" />
						{:else}
							<Copy class="size-4" />
						{/if}
					</button>
				</div>
			</div>

			<p class="mt-4 text-[13px] text-muted-foreground">
				Downloads the model on first run, then serves it locally.
			</p>
			{#if !deviceInfo.isMac}
				<!-- Answers the newcomer's actual next question -- "I don't have the
				     llama command" -- with a link home, where the CLI install command
				     is front and center. Not on a Mac, where the download button above
				     is already the answer and a second install link only competes. -->
				<p class="mt-1 text-[13px] text-muted-foreground">
					Don’t have the CLI?
					<a href={resolve('/')} class="text-foreground underline underline-offset-4"
						>Install it first</a
					>.
				</p>
			{/if}
		</div>
	{/if}
</dialog>

<style>
	/* Quick fade (plus a slight rise) on open and close. Native <dialog>
	   toggles `display`, which normally can't transition; `allow-discrete`
	   plus `@starting-style` make both directions animate in modern browsers,
	   and older ones just get the previous instant toggle. */
	dialog,
	dialog::backdrop {
		opacity: 0;
		transition:
			opacity 0.15s ease,
			transform 0.15s ease,
			overlay 0.15s allow-discrete,
			display 0.15s allow-discrete;
	}

	dialog {
		transform: translateY(4px);
	}

	dialog[open],
	dialog[open]::backdrop {
		opacity: 1;
	}

	dialog[open] {
		transform: translateY(0);
	}

	/* Where the open transition starts from: matches the closed state. */
	@starting-style {
		dialog[open],
		dialog[open]::backdrop {
			opacity: 0;
		}

		dialog[open] {
			transform: translateY(4px);
		}
	}
</style>
