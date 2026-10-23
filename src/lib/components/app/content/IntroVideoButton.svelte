<script lang="ts">
	// The homepage hero's "Watch the intro" button, and the player it opens.
	//
	// The video plays in a modal rather than on another page, so watching it
	// doesn't take the visitor away from the Download button. It's
	// self-hosted (static/intro/) and played by the browser's own <video>
	// rather than embedded from YouTube: the YouTube embed can't be stripped
	// of its title bar, logo and "More videos" overlay, and it turned
	// captions on for every new viewer, with no embed setting that reliably
	// turned them off. Here captions are a track the viewer can turn on, off
	// by default.
	//
	// Built on the native <dialog> element, like ModelsCatalogInstallDialog:
	// focus trapping, Escape-to-close and the backdrop come for free.
	import { Play, X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	// Shown on the button: knowing it's short makes the click an easy yes.
	const DURATION = '0:36';

	// The OSes to show the button on, as its `data-os-only` (see app.css).
	let { os }: { os: string } = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let video = $state<HTMLVideoElement | null>(null);

	function show() {
		dialog?.showModal();

		// The dialog focuses its first focusable element, the close button,
		// so Space -- which viewers expect to pause -- would close the modal.
		// Focusing the player instead gives Space to its built-in controls.
		video?.focus();

		// Started right here in the click handler, not with the `autoplay`
		// attribute: browsers (Safari especially) only allow playback with
		// sound from within a user gesture. If it's refused anyway, the play
		// control is there to start it by hand. A finished video starts over.
		// No poster: playback starts as the modal opens, so it would only
		// flash by.
		video?.play().catch(() => {});
	}

	// Clicking the player's timeline leaves focus on the timeline slider,
	// which ignores Space, so Space stopped pausing after a seek (Chrome).
	// Handing focus back to the player after each seek fixes that; it waits
	// for `seeked` rather than the click so a drag along the timeline isn't
	// interrupted. The blur is needed because the player already counts as
	// focused (the slider is inside it), so a plain focus() does nothing.
	function refocus() {
		video?.blur();
		video?.focus();
	}

	// Closing pauses rather than resets, so reopening after an accidental
	// close picks up where the visitor left off.
	function close() {
		dialog?.close();
	}
</script>

<Button data-os-only={os} onclick={show} size="lg" variant="outline">
	<Play class="size-4" />
	Watch the intro
	<span class="text-muted-foreground tabular-nums">{DURATION}</span>
</Button>

<!-- onclose catches every way out (Escape, the close button, the backdrop)
     and pauses the video. Only a click straight on the <dialog> element
     closes it -- that's the backdrop, since its content covers the rest --
     so clicks on the player's controls don't.

     Sized as large as the window allows: it's a screen recording, and the
     app's text in it is small. The width is capped by the height (16:9, with
     room for the close button and a margin), so the video is never cut off,
     and by 100rem, past which it's big enough. -->
<dialog
	bind:this={dialog}
	onclose={() => video?.pause()}
	onclick={(e) => e.target === dialog && close()}
	aria-label="Llama intro video"
	class="m-auto w-[calc(100%-2rem)] max-w-[min(100rem,calc((100dvh-8rem)*16/9))] bg-transparent p-0 backdrop:bg-black/80"
>
	<div class="flex justify-end pb-2">
		<button
			type="button"
			aria-label="Close"
			onclick={close}
			class="cursor-pointer p-1 text-white/70 hover:text-white"
		>
			<X class="size-5" />
		</button>
	</div>

	<!-- preload="none": nothing is downloaded until the modal opens. The
	     captions track has no `default`, so it's off until the viewer turns
	     it on from the player's controls.

	     No focus ring: the player gets focus when the modal opens (see show),
	     so the first key press drew a ring around it. It's the only thing
	     in the modal besides the close button (which keeps its ring), so the
	     ring said nothing about where focus is. -->
	<video
		bind:this={video}
		onseeked={refocus}
		src="/intro/intro.mp4"
		preload="none"
		controls
		playsinline
		class="aspect-video w-full rounded-xl bg-black outline-none"
	>
		<track kind="captions" src="/intro/intro.vtt" srclang="en" label="English" />
	</video>
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
