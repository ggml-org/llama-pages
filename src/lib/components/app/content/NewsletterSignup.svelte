<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { NEWSLETTER_SUBSCRIBE_URL } from '$lib/constants';
</script>

<!-- A band rather than a plain section: as plain text under the download
     page's picture cards it was easy to miss entirely. The sky tint is the
     site's one highlight, at /10 as the homepage uses it for fills, so the
     band stands out from the gray cards without reading as a third step.
     Text left and form right from md up; stacked on phones. -->
<section
	class="flex flex-col gap-6 rounded-2xl bg-highlight/10 p-6 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8"
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
	-->
	<form
		action={NEWSLETTER_SUBSCRIBE_URL}
		method="post"
		class="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0"
	>
		<label class="sr-only" for="newsletter-email">Your email address</label>

		<input
			id="newsletter-email"
			type="email"
			name="email"
			required
			placeholder="Your email address"
			class="h-12 min-w-0 rounded-lg border border-border bg-background px-4 text-foreground placeholder:text-foreground/50 focus:border-foreground/30 focus:outline-none sm:flex-1 md:w-64 md:flex-none"
		/>

		<!-- Tags the click as the "Subscribe" goal, matching the Plausible
		     event naming used by the model catalog's Download link -->
		<Button type="submit" size="lg" class="plausible-event-name=Subscribe">Subscribe</Button>
	</form>
</section>
