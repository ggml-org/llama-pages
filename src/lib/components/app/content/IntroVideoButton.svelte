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
		focusDialog();

		// Started right here in the click handler, not with the `autoplay`
		// attribute: browsers (Safari especially) only allow playback with
		// sound from within a user gesture. If it's refused anyway, the play
		// control is there to start it by hand. A finished video starts over.
		// No poster: playback starts as the modal opens, so it would only
		// flash by.
		video?.play().catch(() => {});
	}

	// Keyboard focus is kept on the dialog itself rather than on the player,
	// and the keys are handled in onKeydown. Two things rule out leaving it
	// to the player:
	//
	//   - The dialog would focus its first focusable element, the close
	//     button, so Space -- which viewers expect to pause -- would close
	//     the modal.
	//   - Chrome keeps the player's controls on screen for as long as the
	//     player has focus after a key press, so a single Space or number
	//     key left them stuck over the video.
	//
	// Clicking the player (to pause, or on its timeline) gives it focus, so
	// focus is handed back after each play, pause and seek. That also gets
	// focus off the timeline slider, which would swallow Space. A seek is
	// waited for rather than the click, so a drag along the timeline isn't
	// interrupted. Focus that arrives by Tab is left alone, so the player's
	// own buttons (volume, captions, fullscreen) stay reachable.
	function focusDialog() {
		dialog?.focus();
	}

	// Space plays and pauses, and number keys jump to that tenth of the video
	// (1 to 10%, 0 to the start), as on YouTube. Space only when the dialog
	// itself has focus: on the close button it should close, and on the
	// player Chrome already handles it, and can't be stopped from doing so,
	// so handling it here too would toggle twice. Keys with a modifier are
	// left alone, so Cmd/Ctrl+number still switches tabs.
	function onKeydown(e: KeyboardEvent) {
		if (!video || e.metaKey || e.ctrlKey || e.altKey) {
			return;
		}

		if (e.key === ' ' && e.target === dialog) {
			e.preventDefault();

			if (video.paused) {
				video.play().catch(() => {});
			} else {
				video.pause();
			}
		}

		// Skipped until the duration is known.
		if (/^[0-9]$/.test(e.key) && Number.isFinite(video.duration)) {
			video.currentTime = (video.duration * Number(e.key)) / 10;
		}
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
     and by 100rem, past which it's big enough.

     tabindex="-1" makes the dialog focusable from code (see focusDialog)
     without adding it to the Tab order. No focus ring: it would outline the
     whole modal, which says nothing about where focus is. -->
<dialog
	bind:this={dialog}
	tabindex="-1"
	onclose={() => video?.pause()}
	onclick={(e) => e.target === dialog && close()}
	onkeydown={onKeydown}
	aria-label="Llama intro video"
	class="m-auto w-[calc(100%-2rem)] max-w-[min(100rem,calc((100dvh-8rem)*16/9))] bg-transparent p-0 outline-none backdrop:bg-black/80"
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
	     it on from the player's controls. -->
	<video
		bind:this={video}
		onplay={focusDialog}
		onpause={focusDialog}
		onseeked={focusDialog}
		src="/intro/intro.mp4"
		preload="none"
		controls
		playsinline
		class="aspect-video w-full rounded-xl bg-black"
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
