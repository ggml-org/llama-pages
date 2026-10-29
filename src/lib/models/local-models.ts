import type { Build, Size } from '$lib/catalog';
import { isLoopback, type LlamaModel } from '$lib/docs/llama-app';

export type LocalModelMatch = {
	id: string;
	loaded: boolean;
	repo: string;
	quant?: string;
};

/** Match repository IDs and aliases, never guess from filenames or display names. */
export function modelsForSize(size: Size, models: LlamaModel[] | null): LocalModelMatch[] {
	const repos = new Set(size.builds.map((build) => build.repo.toLowerCase()));
	const matches = new Map<string, LocalModelMatch>();

	for (const model of models ?? []) {
		if (model.status && !['loaded', 'unloaded', 'sleeping', 'loading'].includes(model.status)) {
			continue;
		}

		for (const id of [model.id, ...model.aliases]) {
			const parsed = /^([^/\s:]+\/[^/\s:]+)(?::([^/\s:]+))?$/.exec(id);

			if (!parsed || !repos.has(parsed[1].toLowerCase())) {
				continue;
			}

			const repo = parsed[1].toLowerCase();
			const quant = parsed[2]?.toUpperCase();
			const key = `${repo}:${quant ?? ''}`;
			const previous = matches.get(key);
			const loaded = model.status === 'loaded' || previous?.loaded === true;
			const serverId = previous?.loaded ? previous.id : model.id;

			matches.set(key, { id: serverId, loaded, quant, repo });
		}
	}

	return [...matches.values()];
}

export function matchesBuild(model: LocalModelMatch, build: Build): boolean {
	return (
		model.repo === build.repo.toLowerCase() &&
		!!model.quant &&
		model.quant === build.quant?.toUpperCase()
	);
}

export function localQuantLabels(models: LocalModelMatch[]): string {
	return [...new Set(models.map((model) => model.quant ?? 'unspecified quantization'))].join(', ');
}

export function localModelLabel(base: string, loaded: boolean): string {
	return `${loaded ? 'Loaded' : 'Downloaded'} ${isLoopback(base) ? 'locally' : 'on your server'}`;
}

/** Select the server's original ID (including custom aliases) and load on arrival. */
export function modelChatUrl(base: string, model: LocalModelMatch): string {
	const url = new URL(`${base.replace(/\/+$/, '')}/`);

	url.searchParams.set('model', model.id);
	url.searchParams.set('load', 'true');

	return url.toString();
}
