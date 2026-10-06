<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { NEWSLETTER_SUBSCRIBE_URL } from '$lib/constants';
</script>

<!-- A band rather than a plain section: as plain text under the download
     page's picture cards it was easy to miss entirely. The sky tint is the
     site's one highlight, at /10 as the homepage uses it for fills, so the
     band stands out from the gray cards without reading as a third step.
     It's a card like the steps' otherwise (soft border, shadow-sm), so the
     tint is the only thing setting it apart. Text left and form right from
     md up; stacked on phones.

     From md up it's two columns that line up with the step cards' content
     above: padding is the cards' (p-6), and the gap (gap-16) is the cards'
     gap (gap-4) plus their padding on both sides (2 × p-6), so the form
     starts where the second card's text does and the columns match the
     cards' text in width. -->
<section
	class="flex flex-col gap-6 rounded-xl border border-border/30 bg-highlight/10 p-6 shadow-sm md:grid md:grid-cols-2 md:items-center md:gap-16 dark:border-border/20"
>
	<div class="flex items-start gap-4">
		<span
			class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-highlight"
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
		<label class="sr-only" for="newsletter-email">Your email address</label>

		<input
			id="newsletter-email"
			type="email"
			name="email"
			required
			placeholder="Your email address"
			class="h-10 min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:flex-1 md:flex-none md:text-sm lg:flex-1 dark:bg-input/30"
		/>

		<!-- Tags the click as the "Subscribe" goal, matching the Plausible
		     event naming used by the model catalog's Download link -->
		<Button type="submit" size="lg" class="plausible-event-name=Subscribe">Subscribe</Button>
	</form>
</section>
