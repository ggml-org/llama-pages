<script lang="ts">
	// An icon button that copies `text` and confirms by swapping its icon for
	// a check for a moment. No toast: the check is right where the visitor is
	// looking, and a toast in the corner would only repeat it. `what` names
	// the thing copied, for the screen-reader label ("Copy command" / "Copied
	// command"). The styling is left to the caller, since each place sits it
	// in a different frame.
	import { Check, Copy } from '@lucide/svelte';
	import { COPY_FEEDBACK_MS } from '$lib/constants';

	interface Props {
		class?: string;
		iconClass?: string;
		text: string;
		what: string;
	}

	let { class: className = '', iconClass = 'size-4', text, what }: Props = $props();

	let copied = $state(false);

	function copy() {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), COPY_FEEDBACK_MS);
	}
</script>

<button
	onclick={copy}
	aria-label={copied ? `Copied ${what}` : `Copy ${what}`}
	class="cursor-pointer {className}"
>
	{#if copied}<Check class={iconClass} />{:else}<Copy class={iconClass} />{/if}
</button>
