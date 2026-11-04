import { catalog, catalogForApi, type Family, type InputModality } from '../src/lib/catalog';
import { describe, expect, test } from 'vitest';

describe('catalog input contract', () => {
	test.each<{ inputs: InputModality[]; vision: boolean }>([
		{ inputs: ['text'], vision: false },
		{ inputs: ['text', 'image'], vision: true },
		{ inputs: ['text', 'audio'], vision: false },
		{ inputs: ['text', 'video'], vision: false },
		{ inputs: ['text', 'image', 'audio', 'video'], vision: true }
	])('publishes legacy vision only for image input: $inputs', ({ inputs, vision }) => {
		const family: Family = {
			brand: 'Example',
			description: 'Example model',
			license: 'MIT',
			name: 'Example',
			released: '2026-01',
			sizes: [{ builds: [{ repo: 'example/model' }], inputModalities: inputs, name: '1B' }]
		};
		const result = catalogForApi([family])[0];

		expect(result.sizes[0]).toEqual({ ...family.sizes[0], vision });
		expect(family.sizes[0]).not.toHaveProperty('vision');
	});

	test('every authored size declares a unique, known input list', () => {
		const allowed = new Set(['text', 'image', 'audio', 'video']);

		for (const family of catalog) {
			for (const size of family.sizes) {
				expect(size.inputModalities).toContain('text');
				expect(new Set(size.inputModalities).size).toBe(size.inputModalities.length);
				expect(size.inputModalities.every((input) => allowed.has(input))).toBe(true);
				expect(size).not.toHaveProperty('vision');
			}
		}
	});
});
