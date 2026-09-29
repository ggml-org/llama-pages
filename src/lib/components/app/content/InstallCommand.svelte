<script lang="ts">
	import CopyButton from '../misc/CopyButton.svelte';
	import { deviceInfo } from '$lib/stores/device/index.svelte';

	const installCommand = $derived(
		deviceInfo.isWindows
			? 'irm https://llama.app/install.ps1 | iex'
			: 'curl -LsSf https://llama.app/install.sh | sh'
	);
</script>

<div class="w-full max-w-2xl">
	<div class="w-full overflow-hidden rounded-xl border border-secondary bg-foreground/4">
		<div class="flex items-stretch justify-between">
			<code
				class="block min-w-0 flex-1 overflow-x-auto p-4 font-mono text-[15px] whitespace-nowrap text-foreground/90"
			>
				{installCommand}
			</code>

			<CopyButton
				text={installCommand}
				what="command"
				class="flex shrink-0 items-center border-l border-secondary px-4 text-foreground/70 hover:text-foreground"
			/>
		</div>
	</div>

	<div
		class="mt-2 flex w-full flex-col items-center justify-center gap-1 text-xs text-foreground/60 sm:flex-row sm:gap-2"
	>
		<span>
			Prefer Brew or Winget?
			<a
				href="https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md"
				target="_blank"
				rel="noreferrer"
				class="font-medium underline underline-offset-4 hover:text-foreground"
			>
				Package managers
			</a>
		</span>

		<span class="hidden text-foreground/40 sm:inline">·</span>

		<span>
			Rather build from source?
			<a
				href="https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md"
				target="_blank"
				rel="noreferrer"
				class="font-medium underline underline-offset-4 hover:text-foreground"
			>
				Follow instructions
			</a>
		</span>
	</div>
</div>
