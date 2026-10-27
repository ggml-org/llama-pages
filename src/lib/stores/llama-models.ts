import { STORAGE_KEY } from '$lib/constants';
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
	status: 'unknown' | 'checking' | 'ready';
};

const inventory = writable<ModelInventory>({
	base: DEFAULT_LLAMA_SERVER_URL,
	models: null,
	status: 'unknown'
});

export const llamaModels = { subscribe: inventory.subscribe };

let requestVersion = 0;
let pending: { base: string; promise: Promise<void> } | null = null;

export function refreshLlamaModels(): Promise<void> {
	const base = getLlamaServerUrl();

	if (pending?.base === base) {
		return pending.promise;
	}

	const version = ++requestVersion;

	inventory.set({ base, models: null, status: 'checking' });
	const promise = fetchLlamaModels(base).then((models) => {
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

/** Called only on mount: local inventory is never fetched or stored during SSR. */
export function connectLlamaModels(): () => void {
	const refresh = () => {
		void refreshLlamaModels();
	};
	const onStorage = (event: StorageEvent) => {
		if (event.key === STORAGE_KEY || event.key === null) {
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
		inventory.set({ base: DEFAULT_LLAMA_SERVER_URL, models: null, status: 'unknown' });
	};
}
