<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { NEWSLETTER_SUBSCRIBE_URL } from '$lib/constants';

	// Mailcoach tag to add to the subscriber, e.g. which app they downloaded,
	// so updates about one platform can go only to its users.
	let { tag }: { tag?: string } = $props();
</script>

<!-- A band rather than a plain section: as plain text under the download
     page's picture cards it was easy to miss entirely. The sky tint is the
     site's one highlight, at /10 as the homepage uses it for fills, so the
     band stands out from the gray cards without reading as a third step.
     Text left and form right from md up; stacked on phones.

     From md up it's two columns that line up with the step cards' content
     above: padding is the cards' (p-6), and the gap (gap-16) is the cards'
     gap (gap-4) plus their padding on both sides (2 × p-6), so the form
     starts where the second card's text does and the columns match the
     cards' text in width. -->
<section
	class="flex flex-col gap-6 rounded-2xl bg-highlight/10 p-6 md:grid md:grid-cols-2 md:items-center md:gap-16"
>
	<div class="flex items-start gap-4">
		<span
			class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-highlight"
		>
			<Mail class="size-5" />
		</span>

		<div class="flex flex-col gap-1">
			<h2 class="text-xl font-semibold tracking-tight">Stay in the loop</h2>

			<p class="leading-relaxed text-pretty text-foreground/70">
				Occasional updates on new releases, models and features. No spam, unsubscribe anytime.
			</p>
		</div>
	</div>

	<!--
		Posts straight to Mailcoach, which records the subscriber and redirects
		to /subscribed (set as the list's "Someone subscribed" landing page).
		Mailcoach sends no CORS headers, so submitting via fetch to keep people
		on the page isn't an option -- this is a real navigation.

		Input and button side by side, except from md to lg, where the form's
		half of the band is too narrow for both and the button goes under the
		input.
	-->
	<form
		action={NEWSLETTER_SUBSCRIBE_URL}
		method="post"
		class="flex w-full flex-col gap-2 sm:flex-row md:flex-col lg:flex-row"
	>
		<!-- Mailcoach only applies tags listed under the list's "Allowed tags"
		     for form subscriptions; others are silently dropped. -->
		{#if tag}
			<input type="hidden" name="tags" value={tag} />
		{/if}

		<label class="sr-only" for="newsletter-email">Your email address</label>

		<input
			id="newsletter-email"
			type="email"
			name="email"
			required
			placeholder="Your email address"
			class="h-12 min-w-0 rounded-lg border border-border bg-background px-4 text-foreground placeholder:text-foreground/50 focus:border-foreground/30 focus:outline-none sm:flex-1 md:flex-none lg:flex-1"
		/>

		<!-- Tags the click as the "Subscribe" goal, matching the Plausible
		     event naming used by the model catalog's Download link -->
		<Button type="submit" size="lg" class="plausible-event-name=Subscribe">Subscribe</Button>
	</form>
</section>
