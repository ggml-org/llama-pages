// Talking to the user's Llama server (the local menu bar app by default, or
// any self-hosted llama-server) from the docs pages.
//
// Detection is ADVISORY ONLY — a failed probe never hard-blocks navigation,
// because it is ambiguous: the server may be down, on another port, or the
// browser may have blocked the request (e.g. Chrome 142+ gates local
// requests behind the Local Network Access permission).
// See https://github.com/ggml-org/llama.pages/pull/30#discussion_r3551723116

import { STORAGE_KEY } from '$lib/constants';

export const DEFAULT_LLAMA_SERVER_URL = 'http://localhost:9931';
export const LLAMA_SERVER_CHANGE_EVENT = 'llama-server-change';

export type LlamaModel = {
	id: string;
	aliases: string[];
	status?: string;
};

export function getLlamaServerUrl(): string {
	return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LLAMA_SERVER_URL;
}

export function saveLlamaServerUrl(base: string): void {
	localStorage.setItem(STORAGE_KEY, base);
	window.dispatchEvent(new Event(LLAMA_SERVER_CHANGE_EVENT));
}

/**
 * Accepts a bare port ("9931") or a URL ("llama.example.com",
 * "https://llama.example.com"); returns a normalized base URL, or null.
 */
export function parseLlamaServerInput(input: string): string | null {
	const trimmed = input.trim().replace(/\/+$/, '');

	if (!trimmed) {
		return null;
	}

	if (/^\d+$/.test(trimmed)) {
		const port = Number(trimmed);

		return port >= 1 && port <= 65535 ? `http://localhost:${port}` : null;
	}

	const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

	try {
		const url = new URL(withProtocol);
		// new URL() accepts almost any string as a single-label hostname
		// (e.g. a port typo like "9931x"), so require a plausible host:
		// localhost, a dotted name/IP, or a bracketed IPv6 address.
		const host = url.hostname;

		if (host !== 'localhost' && !host.includes('.') && !host.startsWith('[')) {
			return null;
		}

		return url.origin + (url.pathname === '/' ? '' : url.pathname);
	} catch {
		return null;
	}
}

export function isLoopback(base: string): boolean {
	try {
		const { hostname } = new URL(base);

		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
	} catch {
		return false;
	}
}

/** ':9931' for a local server, the hostname for a remote one. */
export function llamaServerLabel(base: string): string {
	try {
		const url = new URL(base);

		return isLoopback(base)
			? `:${url.port || (url.protocol === 'https:' ? '443' : '80')}`
			: url.hostname;
	} catch {
		return base;
	}
}

/**
 * null means unverified; an empty array means a reachable server with no models.
 * The timeout is short for background checks; see connectLlama for the long one.
 */
export async function fetchLlamaModels(base: string, timeout = 1500): Promise<LlamaModel[] | null> {
	try {
		const init: RequestInit & { targetAddressSpace?: 'loopback' } = {
			signal: AbortSignal.timeout(timeout)
		};

		// Marks the request as intentionally targeting loopback for Chrome's
		// Local Network Access permission model.
		if (isLoopback(base)) {
			init.targetAddressSpace = 'loopback';
		}

		const res = await fetch(`${base}/v1/models`, init);

		if (!res.ok) {
			return null;
		}

		const body = await res.json();

		if (!Array.isArray(body?.data)) {
			return null;
		}

		// Keep only the inventory fields, not server arguments or local file paths.
		const models: LlamaModel[] = body.data
			.filter(
				(model: unknown): model is Record<string, unknown> =>
					!!model && typeof model === 'object' && 'id' in model && typeof model.id === 'string'
			)
			.map((model: Record<string, unknown>) => ({
				aliases: Array.isArray(model.aliases)
					? model.aliases.filter((alias: unknown): alias is string => typeof alias === 'string')
					: [],
				id: model.id as string,
				status:
					model.status &&
					typeof model.status === 'object' &&
					'value' in model.status &&
					typeof model.status.value === 'string'
						? model.status.value
						: undefined
			}));

		// Only a router reports each model's status. A single-model server
		// lists just the model it serves, which is loaded unless the server
		// is sleeping (--sleep-idle-seconds) -- and only /props says that.
		if (models.some((model) => model.status === undefined)) {
			const status = await fetchSingleModelStatus(base, init);

			for (const model of models) {
				model.status ??= status;
			}
		}

		return models;
	} catch {
		return null;
	}
}

/**
 * 'sleeping' while a single-model server has unloaded its model to free
 * memory, 'loaded' otherwise (including servers too old to sleep, which
 * don't report it); undefined if /props doesn't answer.
 */
async function fetchSingleModelStatus(
	base: string,
	init: RequestInit
): Promise<string | undefined> {
	try {
		const res = await fetch(`${base}/props`, init);

		if (!res.ok) {
			return undefined;
		}

		const body = await res.json();

		if (!body || typeof body !== 'object') {
			return undefined;
		}

		return body.is_sleeping === true ? 'sleeping' : 'loaded';
	} catch {
		return undefined;
	}
}

/** Whether a llama-server answers at this base URL. */
export async function probeLlamaServer(base: string): Promise<boolean> {
	return (await fetchLlamaModels(base)) !== null;
}
