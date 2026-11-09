// Talking to the Llama app on the visitor's computer -- or a llama-server
// they run there -- at `localhost:<port>`. Only local servers: one on
// another machine would need the browser's local-network permission and
// that server's CORS settings, for a setup almost nobody has.
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
	const stored = localStorage.getItem(STORAGE_KEY);

	// Earlier versions accepted any server URL; a remote one saved then falls
	// back to the default rather than half-working.
	return stored && isLoopback(stored) ? stored : DEFAULT_LLAMA_SERVER_URL;
}

export function saveLlamaServerUrl(base: string): void {
	localStorage.setItem(STORAGE_KEY, base);
	window.dispatchEvent(new Event(LLAMA_SERVER_CHANGE_EVENT));
}

/** Accepts a port ("9931"); returns the local server's base URL, or null. */
export function parseLlamaServerInput(input: string): string | null {
	const trimmed = input.trim();
	const port = Number(trimmed);

	return /^\d+$/.test(trimmed) && port >= 1 && port <= 65535 ? `http://localhost:${port}` : null;
}

export function isLoopback(base: string): boolean {
	try {
		const { hostname } = new URL(base);

		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
	} catch {
		return false;
	}
}

/** The server's port, as ':9931'. */
export function llamaServerLabel(base: string): string {
	try {
		return `:${new URL(base).port || '80'}`;
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
		const res = await fetch(`${base}/v1/models`, loopbackInit(timeout));

		if (!res.ok) {
			return null;
		}

		const body = await res.json();

		if (!Array.isArray(body?.data)) {
			return null;
		}

		// Keep only the inventory fields, not server arguments or local file paths.
		return body.data
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
	} catch {
		return null;
	}
}

/**
 * Request options for the local server. targetAddressSpace marks the request
 * as intentionally targeting loopback for Chrome's Local Network Access
 * permission model.
 */
function loopbackInit(timeout: number): RequestInit & { targetAddressSpace: 'loopback' } {
	return { signal: AbortSignal.timeout(timeout), targetAddressSpace: 'loopback' };
}

/** Why a check failed; see diagnoseLlamaServer. */
export type LlamaServerProblem = 'blocked' | 'not-running' | 'rejected';

/**
 * Why a check failed, as far as the browser lets a page tell -- a failed
 * fetch looks the same whatever the cause:
 * - 'blocked': the browser's permission for this site is set to Block
 * - 'not-running': nothing answers at the address
 * - 'rejected': something answers, but its CORS settings turn this site away
 * undefined when it can't tell, including while the permission hasn't been
 * granted for good: asking again could show the browser's prompt again.
 */
export async function diagnoseLlamaServer(base: string): Promise<LlamaServerProblem | undefined> {
	// A page served from this computer needs no permission, though browsers
	// still report one as unanswered there.
	const servedLocally = typeof location !== 'undefined' && isLoopback(location.origin);
	const state = servedLocally ? undefined : await permissionState('loopback-network');

	if (state === 'denied') {
		return 'blocked';
	}

	if (state === 'prompt') {
		return undefined;
	}

	// A no-cors request can't read the response, but CORS settings don't
	// apply to it either: it only fails when nothing answers.
	try {
		await fetch(`${base}/v1/models`, { ...loopbackInit(1500), mode: 'no-cors' });
	} catch {
		return 'not-running';
	}

	try {
		await fetch(`${base}/v1/models`, loopbackInit(1500));
	} catch {
		return 'rejected';
	}

	// It answers now, so the check failed for some other reason.
	return undefined;
}

/** undefined where the browser doesn't know the permission. */
async function permissionState(name: string): Promise<PermissionState | undefined> {
	// Chrome first shipped the two permissions as one, 'local-network-access',
	// which it still answers to; Firefox only knows the separate names.
	for (const permission of [name, 'local-network-access']) {
		try {
			return (await navigator.permissions.query({ name: permission as PermissionName })).state;
		} catch {
			// Unknown to this browser; try the next name.
		}
	}

	return undefined;
}
