<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>You're subscribed — llama.app</title>
	<meta name="description" content="You're subscribed to the llama.app newsletter." />
	<!-- A dead-end landing page with no standalone value; keep it out of search
	     results so it can't be reached except by subscribing. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<!--
	Where Mailcoach sends people after they submit the signup form (set as the
	list's "Landing Pages" settings, for both the subscribed and the already-
	subscribed case). Double opt-in is off, so
	reaching this page means they are already subscribed and there is nothing
	left for them to do. If double opt-in is ever turned back on, this copy has
	to change — they would not be subscribed yet at this point.
-->
<!-- Vertically centred with a slight upward bias (the bottom padding pushes the
     block above the true middle, where the eye expects it to sit). -->
<main
	class="mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 pb-[12vh] text-center md:px-12"
>
	<Check class="size-10 text-muted-foreground" />

	<div class="flex flex-col items-center gap-3">
		<h1 class="text-3xl font-semibold tracking-tight">You're subscribed</h1>

		<p class="max-w-md text-muted-foreground">
			Thanks — we'll email you when there's something worth knowing about. Unsubscribe anytime.
		</p>
	</div>

	<Button href={resolve('/')} variant="secondary">Back to llama.app</Button>
</main>
