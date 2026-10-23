<script lang="ts">
	// The homepage hero's "Watch the intro" button, and the player it opens.
	//
	// The video plays in a modal rather than on YouTube, so watching it
	// doesn't take the visitor away from the Download button (and into
	// YouTube's suggestions). The player is the youtube-nocookie embed, and
	// it's only added to the page while the modal is open: nothing is loaded
	// from YouTube until someone clicks, and closing the modal removes the
	// player, which stops playback.
	//
	// Built on the native <dialog> element, like ModelsCatalogInstallDialog:
	// focus trapping, Escape-to-close and the backdrop come for free.
	import { Play, X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	const VIDEO_ID = 'w6dSNCg9I5k';

	// Shown on the button: knowing it's short makes the click an easy yes.
	const DURATION = '0:36';

	// The OSes to show the button on, as its `data-os-only` (see app.css).
	let { os }: { os: string } = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let open = $state(false);

	function show() {
		open = true;
		dialog?.showModal();
	}
</script>

<Button data-os-only={os} onclick={show} size="lg" variant="outline">
	<Play class="size-4" />
	Watch the intro
	<span class="text-muted-foreground tabular-nums">{DURATION}</span>
</Button>

<!-- onclose catches every way out (Escape, the close button, a click) and
     drops the player. Any click that reaches the dialog closes it: clicks
     inside the player stay in the iframe and never get here, so what's left
     is the backdrop and the space around the video.

     Sized as large as the window allows: it's a screen recording, and the
     app's text in it is small. The width is capped by the height (16:9, with
     room for the close button and a margin), so the video is never cut off,
     and by 100rem, past which it's big enough. -->

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={() => dialog?.close()}
	aria-label="Llama intro video"
	class="m-auto w-[calc(100%-2rem)] max-w-[min(100rem,calc((100dvh-8rem)*16/9))] bg-transparent p-0 backdrop:bg-black/80"
>
	<div class="flex justify-end pb-2">
		<button
			type="button"
			aria-label="Close"
			class="cursor-pointer p-1 text-white/70 hover:text-white"
		>
			<X class="size-5" />
		</button>
	</div>

	<div class="aspect-video overflow-hidden rounded-xl bg-black">
		{#if open}
			<iframe
				src="https://www.youtube-nocookie.com/embed/{VIDEO_ID}?autoplay=1&rel=0&playsinline=1"
				title="Llama intro video"
				allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
				allowfullscreen
				class="size-full"
			></iframe>
		{/if}
	</div>
</dialog>

<style>
	/* Quick fade on open and close, as in ModelsCatalogInstallDialog: native
	   <dialog> toggles `display`, which `allow-discrete` plus
	   `@starting-style` make animatable in modern browsers. */
	dialog,
	dialog::backdrop {
		opacity: 0;
		transition:
			opacity 0.15s ease,
			overlay 0.15s allow-discrete,
			display 0.15s allow-discrete;
	}

	dialog[open],
	dialog[open]::backdrop {
		opacity: 1;
	}

	@starting-style {
		dialog[open],
		dialog[open]::backdrop {
			opacity: 0;
		}
	}
</style>
