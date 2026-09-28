import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = async ({ fetch }) => {
	let stars: number | null = null;

	try {
		const res = await fetch('https://api.github.com/repos/ggml-org/Llama-macOS');

		if (res.ok) {
			const json = (await res.json()) as { stargazers_count?: number };

			if (typeof json.stargazers_count === 'number') {
				stars = json.stargazers_count;
			}
		}
	} catch {
		// keep null on failure
	}

	return { stars };
};
