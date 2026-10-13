import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { familyBySlug } from '$lib/catalog';

// Resolve the slug to a family, 404ing on an unknown slug. Runs at build time
// for each linked slug, since the whole site is prerendered.
export const load: PageLoad = ({ params }) => {
	const family = familyBySlug(params.slug);

	if (!family) {
		error(404, 'Family not found');
	}

	return { family };
};
