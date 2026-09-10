import type { EntryGenerator, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { MACOS_DOWNLOAD_URL, WINDOWS_RELEASES_URL } from '$lib/constants';

export const prerender = true;

// One page per app. Separate routes rather than one page with `?os=`, so
// each is prerendered with its own steps and file link -- a query string
// can only be read in the browser, so the page would render without its
// OS first and fill it in after hydration.
export const entries: EntryGenerator = () => [{ os: 'mac' }, { os: 'windows' }];

export const load: PageServerLoad = async ({ fetch, params }) => {
	if (params.os === 'mac') {
		return { downloadUrl: MACOS_DOWNLOAD_URL, os: 'mac' as const };
	}

	if (params.os === 'windows') {
		return { downloadUrl: await windowsDownloadUrl(fetch), os: 'windows' as const };
	}

	error(404, 'Not found');
};

// Resolves the Windows download link at build time. The release's
// `.msixbundle` holds both the x64 and ARM64 builds, so it's the one file
// that installs on any Windows PC. Its name has the version in it, so it
// can't be linked through `releases/latest/download/` the way the Mac dmg
// is. Resolved once per build, so after a new Windows release the link
// keeps pointing at the previous one until the site is rebuilt -- it still
// works, and the app offers the update itself. If the lookup fails, the
// link is the release page instead, and the page sends people there.
async function windowsDownloadUrl(fetch: typeof globalThis.fetch) {
	try {
		const res = await fetch('https://api.github.com/repos/ggml-org/Llama-Windows/releases/latest');

		if (res.ok) {
			const json = (await res.json()) as {
				assets?: { browser_download_url: string; name: string }[];
			};
			const bundle = json.assets?.find((a) => a.name.endsWith('.msixbundle'));

			if (bundle) {
				return bundle.browser_download_url;
			}
		}
	} catch {
		// keep the release page on failure
	}

	return WINDOWS_RELEASES_URL;
}
