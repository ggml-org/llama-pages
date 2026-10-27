import { llamaModels, refreshLlamaModels } from '../src/lib/stores/llama-models';
import { get } from 'svelte/store';
import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

test('switching servers clears matches and ignores a slower response from the old address', async () => {
	let base = 'http://localhost:9931';
	let resolveOld!: (response: Response) => void;
	let resolveNew!: (response: Response) => void;

	const fetch = vi
		.fn()
		.mockImplementationOnce(
			() =>
				new Promise<Response>((resolve) => {
					resolveOld = resolve;
				})
		)
		.mockImplementationOnce(
			() =>
				new Promise<Response>((resolve) => {
					resolveNew = resolve;
				})
		);

	vi.stubGlobal('localStorage', { getItem: () => base });
	vi.stubGlobal('fetch', fetch);
	const oldRequest = refreshLlamaModels();

	expect(refreshLlamaModels()).toBe(oldRequest);
	base = 'http://localhost:9932';
	const newRequest = refreshLlamaModels();

	expect(get(llamaModels)).toEqual({ base, models: null, status: 'checking' });
	resolveNew(new Response('{"data":[{"id":"new/model:Q8_0"}]}'));
	await newRequest;
	resolveOld(new Response('{"data":[{"id":"old/model:Q8_0"}]}'));
	await oldRequest;
	expect(get(llamaModels).models?.map((model) => model.id)).toEqual(['new/model:Q8_0']);
	expect(get(llamaModels).base).toBe(base);
	expect(fetch).toHaveBeenCalledTimes(2);

	fetch.mockResolvedValue(new Response('', { status: 503 }));
	await refreshLlamaModels();
	expect(get(llamaModels)).toEqual({ base, models: null, status: 'unknown' });
});
