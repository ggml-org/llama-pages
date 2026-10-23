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
	// focus trapping, Escape-to-close and the backdrop come for free. Unlike
	// that dialog it opens and closes instantly, with no fade: playback has
	// to start in the click itself (see show), so the video played while
	// the page was still dimming.
	import { Play, X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	// Shown on the button: knowing it's short makes the click an easy yes.
	// Hardcoded rather than read from the video, which isn't loaded until the
	// modal opens -- update it along with static/intro/intro.mp4.
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
	//
	// Not once the dialog is closing: closing pauses the video, and the
	// pause would pull focus back into the fading-out dialog, so Safari
	// lost it instead of returning it to the "Watch the intro" button.
	function focusDialog() {
		if (dialog?.open) {
			dialog.focus();
		}
	}

	// YouTube's shortcuts: Space plays and pauses, ←/→ skip 5 seconds, M
	// mutes, F toggles fullscreen, and number keys jump to that tenth of the
	// video (1 to 10%, 0 to the start).
	//
	// Only when the dialog itself has focus: on the close button Space should
	// close, and once the viewer has tabbed into the player, Chrome handles
	// Space (and the arrows) itself and can't be stopped from doing so, so
	// handling them here too would act twice. Keys with a modifier are left
	// alone, so Cmd/Ctrl+number still switches tabs.
	function onKeydown(e: KeyboardEvent) {
		if (!video || e.target !== dialog || e.metaKey || e.ctrlKey || e.altKey) {
			return;
		}

		const key = e.key.toLowerCase();

		if (key === ' ') {
			if (video.paused) {
				video.play().catch(() => {});
			} else {
				video.pause();
			}
		} else if (key === 'arrowleft' || key === 'arrowright') {
			// Setting currentTime past either end clamps to it.
			video.currentTime += key === 'arrowleft' ? -5 : 5;
		} else if (key === 'm') {
			video.muted = !video.muted;
		} else if (key === 'f') {
			if (document.fullscreenElement) {
				document.exitFullscreen().catch(() => {});
			} else {
				video.requestFullscreen().catch(() => {});
			}
		} else if (/^[0-9]$/.test(key)) {
			// Skipped until the duration is known.
			if (Number.isFinite(video.duration)) {
				video.currentTime = (video.duration * Number(key)) / 10;
			}
		} else {
			return;
		}

		e.preventDefault();
	}
</script>

<Button data-os-only={os} onclick={show} size="lg" variant="outline">
	<Play class="size-4" />
	Watch the intro
	<span class="text-muted-foreground tabular-nums">{DURATION}</span>
</Button>

<!-- onclose catches every way out (Escape, the close button, the backdrop)
     and pauses the video -- rather than resetting it, so reopening after an
     accidental close picks up where the visitor left off. Only a click
     straight on the <dialog> element closes it -- that's the backdrop,
     since its content covers the rest -- so clicks on the player's controls
     don't.

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
	onclick={(e) => e.target === dialog && dialog?.close()}
	onkeydown={onKeydown}
	aria-label="Llama intro video"
	class="m-auto w-[calc(100%-2rem)] max-w-[min(100rem,calc((100dvh-8rem)*16/9))] bg-transparent p-0 outline-none backdrop:bg-black/80"
>
	<div class="flex justify-end pb-2">
		<button
			type="button"
			aria-label="Close"
			onclick={() => dialog?.close()}
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
