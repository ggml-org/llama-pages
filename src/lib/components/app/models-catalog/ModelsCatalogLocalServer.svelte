<script lang="ts">
	import Logo from '../misc/Logo.svelte';
	import { Pencil } from '@lucide/svelte';
	import {
		DEFAULT_LLAMA_SERVER_URL,
		llamaServerLabel,
		parseLlamaServerInput,
		saveLlamaServerUrl
	} from '$lib/docs/llama-app';
	import { llamaModels } from '$lib/stores/llama-models';

	const llamaBase = $derived($llamaModels.base);
	const detected = $derived($llamaModels.status === 'ready');
	let editing = $state(false);
	let serverInput = $state('');
	let inputError = $state('');

	function editServer() {
		serverInput = llamaBase === DEFAULT_LLAMA_SERVER_URL ? '9931' : llamaBase;
		inputError = '';
		editing = !editing;
	}

	function saveServer(event: SubmitEvent) {
		event.preventDefault();
		const base = parseLlamaServerInput(serverInput);

		if (!base) {
			inputError = 'Enter a valid port (1–65535) or server URL.';

			return;
		}

		saveLlamaServerUrl(base);
		editing = false;
	}

	function focusInput(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<div
	class="relative inline-flex max-w-full items-center rounded-lg border border-border bg-background p-0.5 text-sm shadow-sm"
>
	<a
		href={`${llamaBase}/v1/models`}
		target="_blank"
		rel="noopener noreferrer external"
		class="flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
	>
		<span aria-hidden="true" class="flex size-3.5 shrink-0 items-center justify-center">
			<Logo --logo-height="0.875rem" --logo-gap="0" />
		</span>
		<span class="whitespace-nowrap">List models in your Llama</span>
		<span class="ml-3 max-w-28 truncate text-xs text-foreground/40 tabular-nums">
			{llamaServerLabel(llamaBase)}
		</span>
		<span
			class="size-1.5 shrink-0 rounded-full {detected ? 'bg-green-500' : 'bg-orange-400'}"
			role="status"
			title={detected
				? `Llama server detected at ${llamaBase}`
				: `Couldn't verify a Llama server at ${llamaBase} — it may still be running (some browsers block local checks)`}
		>
			<span class="sr-only">{detected ? 'Server detected' : 'Server unverified'}</span>
		</span>
	</a>
	<button
		type="button"
		onclick={editServer}
		aria-label="Set Llama server port or URL"
		aria-expanded={editing}
		aria-controls="llama-models-server-settings"
		title="Set Llama server port or URL"
		class="shrink-0 cursor-pointer rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
	>
		<Pencil class="size-3.5" />
	</button>
	{#if editing}
		<form
			id="llama-models-server-settings"
			onsubmit={saveServer}
			class="absolute top-full right-0 z-20 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-border bg-background p-3 shadow-md"
		>
			<label for="llama-models-server-url" class="block font-medium">Server port or URL</label>
			<input
				id="llama-models-server-url"
				use:focusInput
				bind:value={serverInput}
				oninput={() => (inputError = '')}
				onkeydown={(event) => {
					if (event.key === 'Escape') {
						editing = false;
					}
				}}
				type="text"
				placeholder="9931 or https://llama.example.com"
				aria-invalid={!!inputError}
				aria-describedby={inputError ? 'llama-models-server-error' : undefined}
				class="mt-2 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
			/>
			{#if inputError}
				<p id="llama-models-server-error" role="alert" class="mt-2 text-xs text-destructive">
					{inputError}
				</p>
			{/if}
			<div class="mt-3 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => (editing = false)}
					class="cursor-pointer rounded-md px-3 py-1.5 hover:bg-muted"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/80"
				>
					Save
				</button>
			</div>
		</form>
	{/if}
</div>
