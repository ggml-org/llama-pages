<script lang="ts">
	import iconDark from '$lib/assets/brand/icon-dark.svg?url';
	import iconLight from '$lib/assets/brand/icon-light.svg?url';
	import {
		OG_IMAGE_ALT,
		OG_IMAGE_PATH,
		SITE_DESCRIPTION,
		SITE_TITLE,
		SITE_URL
	} from '$lib/constants';

	function updateFavicon() {
		const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;

		if (link) {
			link.href = dark ? iconDark : iconLight;
		}
	}

	$effect(() => {
		const mql = window.matchMedia('(prefers-color-scheme: dark)');

		function handleChange() {
			updateFavicon();
		}

		mql.addEventListener('change', handleChange);
		updateFavicon();

		return () => {
			mql.removeEventListener('change', handleChange);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={iconLight} />

	<!-- No `<title>` or description here: each page sets its own (see
	     site.constants.ts). -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={SITE_TITLE} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:url" content={SITE_URL} />
	<!-- Absolute: Open Graph requires it, and some scrapers (X's) don't
	     resolve a relative path, so the preview would show no image. -->
	<meta property="og:image" content={SITE_URL + OG_IMAGE_PATH} />
	<meta property="og:image:alt" content={OG_IMAGE_ALT} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content={SITE_URL + OG_IMAGE_PATH} />
</svelte:head>
