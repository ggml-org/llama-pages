import { CONNECTED_KEY, STORAGE_KEY } from '$lib/constants';
import {
	DEFAULT_LLAMA_SERVER_URL,
	fetchLlamaModels,
	getLlamaServerUrl,
	LLAMA_SERVER_CHANGE_EVENT,
	type LlamaModel
} from '$lib/docs/llama-app';
import { writable } from 'svelte/store';

type ModelInventory = {
	base: string;
	models: LlamaModel[] | null;
	// 'off' until the visitor connects Llama from the header: the site
	// makes no request before then (see CONNECTED_KEY).
	status: 'off' | 'unknown' | 'checking' | 'ready';
};

const inventory = writable<ModelInventory>({
	base: DEFAULT_LLAMA_SERVER_URL,
	models: null,
	status: 'off'
});

export const llamaModels = { subscribe: inventory.subscribe };

/**
 * How long the first check may wait. In Chrome, it's the request that shows
 * the Local Network Access prompt, and the request stays pending while the
 * prompt is up -- with the usual 1.5 s timeout, a visitor who took a moment
 * to click Allow would get "Can't reach" for a connection they just allowed.
 */
const PERMISSION_TIMEOUT_MS = 60_000;

let requestVersion = 0;
let pending: { base: string; promise: Promise<void> } | null = null;

export function refreshLlamaModels(timeout?: number): Promise<void> {
	const base = getLlamaServerUrl();

	if (pending?.base === base) {
		return pending.promise;
	}

	const version = ++requestVersion;

	inventory.set({ base, models: null, status: 'checking' });
	const promise = fetchLlamaModels(base, timeout).then((models) => {
		// A slow response from a previous address must never overwrite the new one.
		if (version !== requestVersion) {
			return;
		}

		inventory.set({ base, models, status: models === null ? 'unknown' : 'ready' });
		pending = null;
	});

	pending = { base, promise };

	return promise;
}

function isConnected(): boolean {
	return localStorage.getItem(CONNECTED_KEY) !== null;
}

/**
 * The explicit opt-in, from the header's Connect button: remembers it so
 * later visits check on their own, then checks now. In Chrome, this first
 * check is what shows the Local Network Access prompt, so it should only
 * ever follow a click.
 */
export function connectLlama(): Promise<void> {
	localStorage.setItem(CONNECTED_KEY, '1');

	return refreshLlamaModels(PERMISSION_TIMEOUT_MS);
}

/** The opt-out: forgets the opt-in and clears the marks, ignoring any check still in flight. */
export function disconnectLlama(): void {
	localStorage.removeItem(CONNECTED_KEY);
	requestVersion++;
	pending = null;
	inventory.set({ base: getLlamaServerUrl(), models: null, status: 'off' });
}

/**
 * Keeps the inventory current while mounted (by the site header, so on
 * every page): checks on load, on focus -- say, after downloading a model in
 * the app -- and when the server address changes, here or in another tab.
 * Called only on mount: local inventory is never fetched or stored during SSR.
 */
export function watchLlamaModels(): () => void {
	// Refreshes only after the opt-in, so a first-time visitor never triggers
	// a request (or a permission prompt) by loading, focusing, or editing.
	const refresh = () => {
		if (isConnected()) {
			void refreshLlamaModels();
		} else {
			inventory.set({ base: getLlamaServerUrl(), models: null, status: 'off' });
		}
	};
	const onStorage = (event: StorageEvent) => {
		if (event.key === STORAGE_KEY || event.key === CONNECTED_KEY || event.key === null) {
			refresh();
		}
	};

	refresh();
	window.addEventListener('focus', refresh);
	window.addEventListener('storage', onStorage);
	window.addEventListener(LLAMA_SERVER_CHANGE_EVENT, refresh);

	return () => {
		window.removeEventListener('focus', refresh);
		window.removeEventListener('storage', onStorage);
		window.removeEventListener(LLAMA_SERVER_CHANGE_EVENT, refresh);
		requestVersion++;
		pending = null;
		inventory.set({ base: DEFAULT_LLAMA_SERVER_URL, models: null, status: 'off' });
	};
}

/** Asks the header's connection popover to open; see showLlamaConnection. */
export const LLAMA_CONNECTION_SHOW_EVENT = 'llama-connection-show';

/**
 * Opens the header's connection popover, so other parts of the site (the
 * docs' "Open in Llama") send visitors to the one place to connect. `then`
 * is a path on the server (`/?q=…`) to open once connected -- a path, since
 * connecting may change the address. Returns false where the header doesn't
 * show the popover (phones, Linux, Safari).
 */
export function showLlamaConnection(then?: string): boolean {
	// The header cancels the event when it opens the popover.
	return !window.dispatchEvent(
		new CustomEvent(LLAMA_CONNECTION_SHOW_EVENT, { cancelable: true, detail: { then } })
	);
}
