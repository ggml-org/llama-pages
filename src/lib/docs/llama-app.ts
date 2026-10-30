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

/** Whether a llama-server answers at this base URL. */
export async function probeLlamaServer(base: string): Promise<boolean> {
	return (await fetchLlamaModels(base)) !== null;
}

/** Why a check failed; see diagnoseLlamaServer. */
export type LlamaServerProblem = 'blocked' | 'not-running' | 'rejected';

/**
 * The browser permission a public site needs to reach this server: Chrome
 * and Firefox ask before a site reaches apps on this device, or devices on
 * the local network. null for a public server, which needs none.
 */
export function localAccessPermission(base: string): 'loopback-network' | 'local-network' | null {
	if (isLoopback(base)) {
		return 'loopback-network';
	}

	try {
		const { hostname } = new URL(base);

		return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname) ||
			hostname.endsWith('.local')
			? 'local-network'
			: null;
	} catch {
		return null;
	}
}

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
	const permission = localAccessPermission(base);
	// A page served from this computer needs no permission, though browsers
	// still report one as unanswered there.
	const servedLocally = typeof location !== 'undefined' && isLoopback(location.origin);
	const state = permission && !servedLocally ? await permissionState(permission) : undefined;

	if (state === 'denied') {
		return 'blocked';
	}

	if (state === 'prompt') {
		return undefined;
	}

	const init = () => {
		const init: RequestInit & { targetAddressSpace?: 'loopback' } = {
			signal: AbortSignal.timeout(1500)
		};

		if (permission === 'loopback-network') {
			init.targetAddressSpace = 'loopback';
		}

		return init;
	};

	// A no-cors request can't read the response, but CORS settings don't
	// apply to it either: it only fails when nothing answers.
	try {
		await fetch(`${base}/v1/models`, { ...init(), mode: 'no-cors' });
	} catch {
		return 'not-running';
	}

	try {
		await fetch(`${base}/v1/models`, init());
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
