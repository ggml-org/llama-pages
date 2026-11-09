import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { catalog } from '$lib/catalog';

// Public catalog API: the same data the website renders, served as JSON for the
// apps to fetch. Prerendered to a static file so it ships with the static build.
export const prerender = true;

export const GET: RequestHandler = () => json(catalog);
