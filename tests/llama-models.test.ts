import type { Size } from '../src/lib/catalog';
import { fetchLlamaModels, type LlamaModel, probeLlamaServer } from '../src/lib/docs/llama-app';
import {
	localModelLabel,
	localQuantLabels,
	matchesBuild,
	modelChatUrl,
	modelsForSize
} from '../src/lib/models/local-models';
import { afterEach, describe, expect, test, vi } from 'vitest';

const size: Size = {
	builds: [
		{ quant: 'Q8_0', repo: 'example/model-GGUF' },
		{ quant: 'Q4_0', repo: 'example/model-GGUF' }
	],
	name: 'Example 12B'
};

function model(id: string, status = 'unloaded', aliases: string[] = []): LlamaModel {
	return { aliases, id, status };
}

afterEach(() => vi.unstubAllGlobals());

describe('catalog matching', () => {
	test('keeps loaded status specific to its quantization', () => {
		const matches = modelsForSize(size, [
			model('example/model-GGUF:Q8_0', 'loaded'),
			model('example/model-GGUF:Q4_0', 'unloaded')
		]);

		expect(matches.find((match) => matchesBuild(match, size.builds[0]))?.loaded).toBe(true);
		expect(matches.find((match) => matchesBuild(match, size.builds[1]))?.loaded).toBe(false);
	});

	test.each(['unloaded', 'sleeping', 'loading'])('does not treat %s as loaded', (status) => {
		const matches = modelsForSize(size, [model('example/model-GGUF:Q8_0', status)]);

		expect(matches[0].loaded).toBe(false);
		expect(localModelLabel('http://localhost:9931', matches[0].loaded)).toBe('Downloaded locally');
	});

	test('preserves a loaded instance when the same build is also listed as an unloaded preset', () => {
		const matches = modelsForSize(size, [
			model('custom-name', 'loaded', ['example/model-GGUF:Q8_0']),
			model('example/model-GGUF:Q8_0', 'unloaded')
		]);

		expect(matches).toHaveLength(1);
		expect(matches[0].loaded).toBe(true);
		expect(matches[0].id).toBe('custom-name');
		expect(localModelLabel('http://localhost:9931', true)).toBe('Loaded locally');
		expect(localModelLabel('https://llama.example.com', true)).toBe('Loaded on your server');
	});

	test('chat links preserve the original server ID and custom base path', () => {
		const matches = modelsForSize(size, [
			model('My model / Q8 & fast', 'unloaded', ['example/model-GGUF:Q8_0'])
		]);
		const url = new URL(modelChatUrl('https://llama.example.com/llama/', matches[0]));

		expect(url.origin).toBe('https://llama.example.com');
		expect(url.pathname).toBe('/llama/');
		expect(url.searchParams.get('model')).toBe('My model / Q8 & fast');
		expect(url.searchParams.get('load')).toBe('true');
		expect(url.searchParams.has('q')).toBe(false);
	});

	test('matches exact repos and quants without case sensitivity, including unloaded models', () => {
		const matches = modelsForSize(size, [model('EXAMPLE/MODEL-gguf:q8_0')]);

		expect(matches).toHaveLength(1);
		expect(matchesBuild(matches[0], size.builds[0])).toBe(true);
		expect(matchesBuild(matches[0], size.builds[1])).toBe(false);
	});

	test('reports a non-catalog quant at the size level without marking a different build', () => {
		const matches = modelsForSize(size, [model('example/model-GGUF:Q4_K_M')]);

		expect(localQuantLabels(matches)).toBe('Q4_K_M');
		expect(size.builds.some((build) => matchesBuild(matches[0], build))).toBe(false);
	});

	test('recognizes canonical aliases and deduplicates them', () => {
		const matches = modelsForSize(size, [
			model('my-custom-model', 'sleeping', ['example/model-GGUF:Q8_0']),
			model('example/model-GGUF:Q8_0')
		]);

		expect(matches).toHaveLength(1);
		expect(matchesBuild(matches[0], size.builds[0])).toBe(true);
	});

	test('does not guess across publishers, variants, or filesystem paths', () => {
		expect(
			modelsForSize(size, [
				model('different-org/model-GGUF:Q8_0'),
				model('example/model-MTP-GGUF:Q8_0'),
				model('/models/example/model-GGUF:Q8_0')
			])
		).toEqual([]);
	});

	test('a repository-only ID identifies the size but not a specific quant', () => {
		const matches = modelsForSize(size, [model('example/model-GGUF')]);

		expect(matches).toHaveLength(1);
		expect(matchesBuild(matches[0], size.builds[0])).toBe(false);
		expect(localQuantLabels(matches)).toBe('unspecified quantization');
	});

	test('does not mark downloading or incomplete models as available', () => {
		expect(
			modelsForSize(size, [
				model('example/model-GGUF:Q8_0', 'downloading'),
				model('example/model-GGUF:Q4_0', 'incomplete')
			])
		).toEqual([]);
		expect(modelsForSize(size, null)).toEqual([]);
	});
});

describe('server inventory', () => {
	test('keeps only model IDs, string aliases and status from a successful response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						data: [
							null,
							{ id: 123 },
							{
								aliases: ['alias', 5],
								id: 'example/model-GGUF:Q8_0',
								preset: 'private-config',
								status: { args: ['private-path'], value: 'unloaded' }
							}
						]
					})
				)
			)
		);

		expect(await fetchLlamaModels('http://localhost:9931')).toEqual([
			{ aliases: ['alias'], id: 'example/model-GGUF:Q8_0', status: 'unloaded' }
		]);
	});

	test('an empty inventory still verifies the server', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation(async () => new Response('{"data":[]}'))
		);

		expect(await fetchLlamaModels('http://localhost:9931')).toEqual([]);
		expect(await probeLlamaServer('http://localhost:9931')).toBe(true);
	});

	test.each([
		() => Promise.resolve(new Response('unavailable', { status: 503 })),
		() => Promise.resolve(new Response('{"data":{}}')),
		() => Promise.resolve(new Response('not JSON')),
		() => Promise.reject(new TypeError('Failed to fetch'))
	])('returns unknown for unreachable or invalid responses', async (response) => {
		vi.stubGlobal('fetch', vi.fn().mockImplementation(response));

		expect(await fetchLlamaModels('http://localhost:9931')).toBeNull();
	});
});
