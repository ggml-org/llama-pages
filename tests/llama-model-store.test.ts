import {
	connectLlama,
	disconnectLlama,
	llamaModels,
	refreshLlamaModels,
	watchLlamaModels
} from '../src/lib/stores/llama-models';
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

test('the site contacts the server only after the visitor connects, then on later visits too', async () => {
	const storage = new Map<string, string>();
	const fetch = vi
		.fn()
		.mockImplementation(async () => new Response('{"data":[{"id":"some/model:Q8_0"}]}'));

	vi.stubGlobal('localStorage', {
		getItem: (key: string) => storage.get(key) ?? null,
		removeItem: (key: string) => storage.delete(key),
		setItem: (key: string, value: string) => storage.set(key, value)
	});
	vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
	vi.stubGlobal('fetch', fetch);

	// A first visit makes no request, so Chrome shows no permission prompt.
	let unwatch = watchLlamaModels();

	expect(fetch).not.toHaveBeenCalled();
	expect(get(llamaModels).status).toBe('off');

	await connectLlama();
	expect(fetch).toHaveBeenCalledTimes(1);
	expect(get(llamaModels).status).toBe('ready');
	unwatch();

	// A later visit checks on its own.
	unwatch = watchLlamaModels();
	await vi.waitFor(() => expect(get(llamaModels).status).toBe('ready'));
	expect(fetch).toHaveBeenCalledTimes(2);

	// Disconnecting forgets the opt-in: no more requests, now or next visit.
	disconnectLlama();
	expect(get(llamaModels).status).toBe('off');
	unwatch();
	unwatch = watchLlamaModels();
	expect(fetch).toHaveBeenCalledTimes(2);
	unwatch();
});
