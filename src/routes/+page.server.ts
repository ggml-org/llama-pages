import type { PageServerLoad } from './$types';
import { WINDOWS_RELEASES_URL } from '$lib/constants';

export const prerender = true;

// Resolves the Windows download button's link at build time. The release's
// `.msixbundle` holds both the x64 and ARM64 builds, so it's the one file
// that installs on any Windows PC. Its name has the version in it, so it
// can't be linked through `releases/latest/download/` the way the Mac dmg
// is. Resolved once per build, so after a new Windows release the link
// keeps pointing at the previous one until the site is rebuilt -- it still
// works, and the app offers the update itself. If the lookup fails, the
// button links to the release page instead.
export const load: PageServerLoad = async ({ fetch }) => {
	let windowsDownloadUrl = WINDOWS_RELEASES_URL;

	try {
		const res = await fetch('https://api.github.com/repos/ggml-org/Llama-Windows/releases/latest');

		if (res.ok) {
			const json = (await res.json()) as {
				assets?: { browser_download_url: string; name: string }[];
			};
			const bundle = json.assets?.find((a) => a.name.endsWith('.msixbundle'));

			if (bundle) {
				windowsDownloadUrl = bundle.browser_download_url;
			}
		}
	} catch {
		// keep the release page on failure
	}

	return { windowsDownloadUrl };
};
