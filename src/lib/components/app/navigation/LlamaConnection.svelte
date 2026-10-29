<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		isLoopback,
		llamaServerLabel,
		localAccessPermission,
		parseLlamaServerInput,
		saveLlamaServerUrl
	} from '$lib/docs/llama-app';
	import {
		connectLlama,
		disconnectLlama,
		llamaModels,
		watchLlamaModels
	} from '$lib/stores/llama-models';
	import { onMount } from 'svelte';

	// The header is on every page, so mounting the watcher here keeps the
	// inventory (and the marks it drives in the catalog) current site-wide.
	onMount(watchLlamaModels);

	const base = $derived($llamaModels.base);
	const status = $derived($llamaModels.status);
	const problem = $derived($llamaModels.problem);
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

	const FIREFOX_HELP_URL =
		'https://support.mozilla.org/kb/control-personal-device-local-network-permissions-firefox';

	// Where to allow the site again once the browser's permission is set to
	// Block. Neither browser opens its settings from a link on a web page,
	// so the popover offers the address to paste instead.
	const settings = $derived(problem === 'blocked' ? settingsFor(base) : null);

	let open = $state(false);
	let serverInput = $state('');
	let inputError = $state('');
	let copied = $state(false);
	let container: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();

	function hostOf(url: string): string {
		try {
			return new URL(url).host;
		} catch {
			return url;
		}
	}

	function settingsFor(server: string) {
		const device = localAccessPermission(server) !== 'local-network';
		const ua = navigator.userAgent;

		if (/Firefox\//.test(ua)) {
			return {
				address: 'about:preferences#privacy-permissions',
				firefox: true,
				setting: device ? 'Device apps and services' : 'Local network devices'
			};
		}

		if (/Chrome\//.test(ua)) {
			const scheme = /Edg\//.test(ua) ? 'edge' : 'chrome';

			return {
				address: `${scheme}://settings/content/siteDetails?site=${encodeURIComponent(location.origin)}`,
				firefox: false,
				setting: device ? 'Apps on device' : 'Local network'
			};
		}

		return null;
	}

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// The address is selectable on its own.
		}
	}

	function toggle() {
		open = !open;
		inputError = '';
		// A local server is entered as just its port, the way the app's
		// Settings show it; a remote one as its full URL.
		serverInput = local ? llamaServerLabel(base).slice(1) : base;
	}

	function close() {
		open = false;
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
						{:else if problem === 'blocked'}
							Your browser is blocking this site from reaching {local
								? 'apps on this computer'
								: 'devices on your network'}.
						{:else if problem === 'rejected'}
							Something answers at this address, but it doesn’t let this site in.
						{:else}
							{#if problem === 'not-running'}
								Nothing answers at this address.
							{/if}
							{#if local}
								Make sure the app is running. If you changed its port in Settings, enter the new one
								here.
							{:else}
								Make sure the server is running, or enter a different address here.
							{/if}
						{/if}
					</p>
				{/if}
			</div>

			<!-- The address form shows up only when a check fails, which is when
			     a changed port (or a stopped app) matters -- including a port
			     changed in the app after connecting, which fails the next check.
			     While connected, there's nothing to change. When the browser
			     blocks the site, no address would help, so the form gives way
			     to where to allow it. -->
			{#if status === 'unknown' && problem === 'blocked'}
				{#if settings}
					<p class="mt-2.5 text-[13px] leading-relaxed text-foreground/80">
						{#if settings.firefox}
							Paste this into a new tab, click <strong class="font-medium"
								>{settings.setting}</strong
							>, and set {location.host} to Allow:
						{:else}
							Paste this into a new tab and set <strong class="font-medium"
								>{settings.setting}</strong
							> to Allow:
						{/if}
					</p>
					<div class="mt-1.5 flex items-start gap-2">
						<code
							class="min-w-0 flex-1 rounded-lg border border-border px-2.5 py-1.5 font-mono text-xs break-all select-all"
							>{settings.address}</code
						>
						<button
							type="button"
							onclick={() => copy(settings.address)}
							class="h-8 cursor-pointer rounded-lg bg-muted px-3.5 text-[13px]"
						>
							{copied ? 'Copied' : 'Copy'}
						</button>
					</div>
					<p class="mt-2.5 text-xs leading-relaxed text-muted-foreground">
						Then come back to this tab{#if settings.firefox}, or see
							<a href={FIREFOX_HELP_URL} target="_blank" rel="noopener noreferrer" class="underline"
								>Firefox’s help</a
							>{/if}.
					</p>
				{:else}
					<p class="mt-2.5 text-xs leading-relaxed text-muted-foreground">
						Allow it in this site’s settings, then come back to this tab.
					</p>
				{/if}
			{:else if status === 'unknown'}
				{@render serverForm()}
				{#if problem === 'rejected'}
					<p class="mt-2.5 text-xs leading-relaxed text-muted-foreground">
						If it’s your own llama-server, its <code class="font-mono">--cors-origins</code> has to
						allow {location.origin}.
					</p>
				{:else if !problem}
					<p class="mt-2.5 text-xs leading-relaxed text-muted-foreground">
						Blocked your browser’s prompt? Allow it in this site’s settings.
					</p>
				{/if}
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
					<button
						type="button"
						onclick={disconnect}
						class="h-8 cursor-pointer rounded-lg bg-muted px-3.5 text-[13px]"
					>
						Disconnect
					</button>
				{/if}
				{#if status === 'off' || (status === 'unknown' && local && (!problem || problem === 'not-running'))}
					<span class="text-[13px] text-muted-foreground">
						Don’t have it? <a href={resolve('/')} onclick={close} class="underline">Get Llama</a>
					</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
