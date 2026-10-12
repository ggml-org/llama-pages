<script lang="ts">
	// The current page's sections, nested under its link in the sidebar. Only
	// `h2`s: the list sits inside the page nav, so it stays one level deep.
	interface Heading {
		id: string;
		text: string;
	}

	interface Props {
		article: HTMLElement | undefined;
		/** Changes when the rendered page changes, triggering a heading rescan. */
		pageKey: string;
	}

	let { article, pageKey }: Props = $props();

	let headings = $state<Heading[]>([]);
	let activeId = $state('');

	$effect(() => {
		void pageKey;

		if (!article) {
			headings = [];

			return;
		}

		headings = [...article.querySelectorAll<HTMLElement>('h2[id]')].map((el) => ({
			id: el.id,
			text: el.textContent ?? ''
		}));
	});

	// The section being read is the last heading scrolled past the top
	// quarter of the viewport -- or, once scrolled to the bottom, the last
	// heading, since short final sections never reach that line. (`scrollY > 0`
	// so a page too short to scroll keeps its first section.)
	$effect(() => {
		if (headings.length === 0) return;

		function onScroll() {
			const atBottom =
				window.scrollY > 0 &&
				window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;

			if (atBottom) {
				activeId = headings[headings.length - 1].id;

				return;
			}

			let current = headings[0].id;

			for (const heading of headings) {
				const el = document.getElementById(heading.id);

				if (el && el.getBoundingClientRect().top <= window.innerHeight / 4) current = heading.id;
			}
			activeId = current;
		}

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });

		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<!-- A hairline down the left, with the current section's stretch of it drawn
     in `foreground` -- a quiet "you are here" that doesn't compete with the
     page link's pill above. -->
{#if headings.length > 0}
	<nav aria-label="On this page" class="my-1 ml-2 flex flex-col border-l text-[13px] leading-5">
		{#each headings as heading (heading.id)}
			<a
				href="#{heading.id}"
				class="-ml-px border-l py-1 pl-3 {activeId === heading.id
					? 'border-foreground text-foreground'
					: 'border-transparent text-muted-foreground'}"
			>
				{heading.text}
			</a>
		{/each}
	</nav>
{/if}
