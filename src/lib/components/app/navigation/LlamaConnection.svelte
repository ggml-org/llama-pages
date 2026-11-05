<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		isLoopback,
		llamaServerLabel,
		parseLlamaServerInput,
		saveLlamaServerUrl
	} from '$lib/docs/llama-app';
	import {
		connectLlama,
		disconnectLlama,
		LLAMA_CONNECTION_SHOW_EVENT,
		llamaModels,
		watchLlamaModels
	} from '$lib/stores/llama-models';
	import { onMount } from 'svelte';

	// The header is on every page, so mounting the watcher here keeps the
	// inventory (and the marks it drives in the catalog) current site-wide.
	onMount(watchLlamaModels);

	// Other parts of the site open this popover rather than asking about the
	// server themselves (see showLlamaConnection).
	onMount(() => {
		window.addEventListener(LLAMA_CONNECTION_SHOW_EVENT, onShow);

		return () => window.removeEventListener(LLAMA_CONNECTION_SHOW_EVENT, onShow);
	});

	const base = $derived($llamaModels.base);
	const status = $derived($llamaModels.status);
	const local = $derived(isLoopback(base));
	// The local app goes by its name; a remote llama-server by its hostname.
	const name = $derived(local ? 'Llama' : llamaServerLabel(base));
	// The address in full (`localhost:9931`), set in mono like other literals.
	const address = $derived(hostOf(base));

	// The dot's color carries the state, so screen readers get it in words.
	const STATUS_TEXT = {
		checking: ', connecting',
		off: '',
		ready: ', connected',
		unknown: ', can’t reach'
	} as const;

	let open = $state(false);
	let serverInput = $state('');
	let inputError = $state('');
	// Where to go once connected, when something sent the visitor here to
	// connect first (see showLlamaConnection). Dropped when the popover closes.
	let then = $state<string | null>(null);
	let thenBlocked = $state(false);
	let container: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();

	$effect(() => {
		if (status !== 'ready' || then === null || thenBlocked) {
			return;
		}

		// No 'noopener' feature: it makes window.open return null even on
		// success, which would hide a blocked popup.
		const popup = window.open(`${base}${then}`, '_blank');

		if (popup) {
			popup.opener = null;
			close();
		} else {
			// Blocked, as popups are when the click that connected was a while
			// ago (say, a slow answer to the browser's prompt): offer the link.
			thenBlocked = true;
		}
	});

	function hostOf(url: string): string {
		try {
			return new URL(url).host;
		} catch {
			return url;
		}
	}

	function toggle() {
		if (open) {
			close();

			return;
		}

		open = true;
		inputError = '';
		// A local server is entered as just its port, the way the app's
		// Settings show it; a remote one as its full URL.
		serverInput = local ? llamaServerLabel(base).slice(1) : base;
	}

	function close() {
		open = false;
		then = null;
		thenBlocked = false;
	}

	function onShow(event: Event) {
		// Hidden on this device (no offsetParent), so the caller falls back.
		if (!container?.offsetParent) {
			return;
		}

		event.preventDefault();

		if (!open) {
			toggle();
		}

		then = (event as CustomEvent<{ then?: string }>).detail?.then ?? null;
		thenBlocked = false;

		// Brings the header into view too, if the page is scrolled.
		trigger?.focus();
	}

	function connect() {
		// The popover stays open, so the visitor sees "Connecting…" while the
		// browser's prompt is up, then the result.
		void connectLlama();
	}

	function disconnect() {
		disconnectLlama();
		close();
	}

	function saveServer(event: SubmitEvent) {
		event.preventDefault();
		const next = parseLlamaServerInput(serverInput);

		if (!next) {
			inputError = 'Enter a valid port (1–65535) or server URL.';

			return;
		}

		// Saving announces the change, and the watcher re-checks the new
		// address; the popover stays open to show how that went.
		saveLlamaServerUrl(next);
	}

	// The composed path rather than contains(event.target): several buttons
	// here (Connect, Save) remove themselves when clicked, and a
	// detached target would read as a click outside, closing the popover.
	function onWindowClick(event: MouseEvent) {
		if (open && container && !event.composedPath().includes(container)) {
			close();
		}
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			close();
			trigger?.focus();
		}
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

{#snippet dot()}
	<span
		aria-hidden="true"
		class="size-1.75 shrink-0 rounded-full {status === 'off'
			? 'border-[1.5px] border-muted-foreground'
			: status === 'checking'
				? 'animate-pulse bg-muted-foreground'
				: status === 'ready'
					? 'bg-green-500'
					: 'bg-orange-400'}"
	></span>
{/snippet}

{#snippet serverForm()}
	<form onsubmit={saveServer} class="mt-3">
		<label for="llama-connection-server" class="block text-xs text-muted-foreground">
			Port or server URL
		</label>
		<div class="mt-1.5 flex gap-2">
			<input
				id="llama-connection-server"
				bind:value={serverInput}
				oninput={() => (inputError = '')}
				type="text"
				placeholder="9931"
				aria-invalid={!!inputError}
				aria-describedby={inputError ? 'llama-connection-server-error' : undefined}
				class="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 font-mono text-[13px] focus-visible:outline-2 focus-visible:outline-ring"
			/>
			<button type="submit" class="h-8 cursor-pointer rounded-lg bg-muted px-3.5 text-[13px]">
				Save
			</button>
		</div>
		{#if inputError}
			<p id="llama-connection-server-error" role="alert" class="mt-1.5 text-xs text-destructive">
				{inputError}
			</p>
		{/if}
	</form>
{/snippet}

<!-- The site's one connection to the visitor's Llama app, in the header the
     way a "Connect wallet" button sits on sites that talk to a wallet: off
     by default, one place to connect, check and disconnect, and every page
     just reads the result (the catalog marks downloaded models). Nothing
     contacts the server until "Connect" is clicked, so Chrome's Local
     Network Access prompt follows that click instead of greeting visitors.
     A pill with a status dot rather than a nav link, so it reads as a
     control with a state; the popover is where the explaining happens.
     Hidden on phones and on Linux, which can't run the app; on Windows, the
     app's server answers on the same port. Hidden in Safari too: it blocks
     an https page's requests to http://localhost outright, with no prompt
     to allow them, so connecting could only ever fail there. -->
<div
	bind:this={container}
	data-os-only="mac windows"
	data-hidden-in-safari
	class="relative hidden sm:block"
>
	<button
		bind:this={trigger}
		type="button"
		onclick={toggle}
		aria-expanded={open}
		aria-controls="llama-connection-popover"
		class="inline-flex h-7.5 cursor-pointer items-center gap-2 rounded-full border border-border px-3 text-[13px] whitespace-nowrap {status ===
		'off'
			? 'text-muted-foreground'
			: 'text-foreground'} {open ? 'bg-foreground/6' : ''}"
	>
		<!-- The dot follows the name, like the star count after "GitHub" next
		     to it and the status dot in the app's own menu. Hollow while not
		     connected, so the pill keeps one shape in every state and only the
		     dot changes as it connects. -->
		<span
			>{status === 'off' ? 'Connect Llama' : name}<span class="sr-only">{STATUS_TEXT[status]}</span
			></span
		>
		{@render dot()}
	</button>

	{#if open}
		<div
			id="llama-connection-popover"
			class="absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-background p-4 text-left shadow-md"
		>
			<div aria-live="polite">
				{#if status === 'off'}
					<p class="text-sm font-semibold">Connect Llama</p>
					<p class="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
						See which models you’ve already downloaded, and start a chat with any of them from this
						site.
					</p>
					<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
						Llama needs to be running on this computer. Your browser will ask you to allow the
						connection.
					</p>
				{:else}
					<!-- The state in words, with the pill's dot trailing it -- a
					     touch of color that leaves the address lined up under the
					     title. -->
					<p class="flex items-center gap-2 text-sm font-semibold">
						{#if status === 'checking'}
							Connecting to {name}…
						{:else if status === 'ready'}
							Connected to {name}
						{:else}
							Can’t reach {name}
						{/if}
						{@render dot()}
					</p>
					<p class="mt-1 font-mono text-xs text-muted-foreground">{address}</p>
					<p class="mt-2.5 text-[13px] leading-relaxed text-foreground/80">
						{#if status === 'checking'}
							If your browser asks, allow the connection.
						{:else if status === 'ready'}
							Models you’ve downloaded are marked in the catalog.
						{:else if local}
							Make sure the app is running. If you changed its port in Settings, enter the new one
							here.
						{:else}
							Make sure the server is running, or enter a different address here.
						{/if}
					</p>
				{/if}
			</div>

			<!-- The address form shows up only when a check fails, which is when
			     a changed port (or a stopped app) matters -- including a port
			     changed in the app after connecting, which fails the next check.
			     While connected, there's nothing to change. -->
			{#if status === 'unknown'}
				{@render serverForm()}
				<p class="mt-2.5 text-xs leading-relaxed text-muted-foreground">
					Blocked your browser’s prompt? Allow it in this site’s settings.
				</p>
			{/if}

			<!-- One action, as a button at the bottom: a popover about the
			     connection, not a menu of items. Connect is the primary button;
			     Disconnect is secondary, like the form's Save. The "Get Llama"
			     link rides along wherever the app may simply be missing. -->
			<div class="mt-3.5 flex items-center gap-3">
				{#if status === 'off'}
					<button
						type="button"
						onclick={connect}
						class="h-8 cursor-pointer rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground"
					>
						Connect
					</button>
				{:else}
					{#if status === 'ready' && then !== null && thenBlocked}
						<a
							href={`${base}${then}`}
							target="_blank"
							rel="noopener noreferrer external"
							onclick={close}
							class="flex h-8 items-center rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground"
						>
							Open in Llama
						</a>
					{/if}
					<button
						type="button"
						onclick={disconnect}
						class="h-8 cursor-pointer rounded-lg bg-muted px-3.5 text-[13px]"
					>
						Disconnect
					</button>
				{/if}
				{#if status === 'off' || (status === 'unknown' && local)}
					<span class="text-[13px] text-muted-foreground">
						Don’t have it? <a href={resolve('/')} onclick={close} class="underline">Get Llama</a>
					</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
