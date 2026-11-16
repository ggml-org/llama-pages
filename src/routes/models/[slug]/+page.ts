import type { EntryGenerator, PageLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { familyBySlug } from '$lib/catalog';

// Slugs of families that were renamed, mapped to their current slug, so old
// links keep working. Slugs come from family names, so a rename moves the
// page. The site is static on GitHub Pages (no server redirects), so each old
// slug is prerendered as a page that redirects to the new one.
//
// These three moved when "Flash" went from the size name into the family name,
// so a family name is always the model's full name.
const renamed: Record<string, string> = {
	'deepseek-v4': 'deepseek-v4-flash',
	'glm-4-7': 'glm-4-7-flash',
	'glm-5-3': 'glm-5-3-flash'
};

// Nothing links to the old slugs any more, so the prerender crawl wouldn't
// find them -- list them explicitly.
export const entries: EntryGenerator = () => Object.keys(renamed).map((slug) => ({ slug }));

// Resolve the slug to a family, 404ing on an unknown slug. Runs at build time
// for each linked slug, since the whole site is prerendered.
export const load: PageLoad = ({ params }) => {
	const target = renamed[params.slug];

	if (target) {
		redirect(308, `/models/${target}`);
	}

	const family = familyBySlug(params.slug);

	if (!family) {
		error(404, 'Family not found');
	}

	return { family };
};
