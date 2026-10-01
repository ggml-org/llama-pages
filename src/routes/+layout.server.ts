import type { LayoutServerLoad } from './$types';
import { LLAMA_CPP_REPO_URL, MACOS_REPO_URL, WINDOWS_REPO_URL } from '$lib/constants';

export const prerender = true;

// Star counts for the header's GitHub links, keyed by repo URL. The header
// links a different repo depending on the page and the visitor's OS (see
// SiteHeader), and each link's badge shows its own repo's count.
//
// Fetched once per process and reused: the load runs for every prerendered
// page, and fetching per page would blow through GitHub's unauthenticated
// limit (60 requests an hour), leaving later pages without badges. In dev,
// restart the server to refresh the counts.
let starsPromise: Promise<Record<string, number | null>> | undefined;

export const load: LayoutServerLoad = async ({ fetch }) => {
	starsPromise ??= fetchAllStars(fetch);

	return { stars: await starsPromise };
};

async function fetchAllStars(fetch: typeof globalThis.fetch) {
	const repos = [MACOS_REPO_URL, WINDOWS_REPO_URL, LLAMA_CPP_REPO_URL];
	const counts = await Promise.all(repos.map((url) => fetchStars(fetch, url)));

	return Object.fromEntries(repos.map((url, i) => [url, counts[i]]));
}

// Null on any failure, which hides that link's badge rather than failing
// the build.
async function fetchStars(fetch: typeof globalThis.fetch, repoUrl: string) {
	try {
		const res = await fetch(
			repoUrl.replace('https://github.com/', 'https://api.github.com/repos/')
		);

		if (res.ok) {
			const json = (await res.json()) as { stargazers_count?: number };

			if (typeof json.stargazers_count === 'number') {
				return json.stargazers_count;
			}
		}
	} catch {
		// keep null on failure
	}

	return null;
}
