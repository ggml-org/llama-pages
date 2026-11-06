import ModelsCatalogInputBadges from './ModelsCatalogInputBadges.svelte';
import type { InputModality } from '$lib/catalog';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';

test.each<{ inputs: InputModality[]; image: boolean; audio: boolean; video: boolean }>([
	{ audio: false, image: false, inputs: ['text'], video: false },
	{ audio: false, image: true, inputs: ['text', 'image'], video: false },
	{ audio: true, image: false, inputs: ['text', 'audio'], video: false },
	{ audio: false, image: false, inputs: ['text', 'video'], video: true },
	{ audio: true, image: true, inputs: ['text', 'image', 'audio', 'video'], video: true }
])(
	'renders only the declared input indicators: $inputs',
	async ({ audio, image, inputs, video }) => {
		const screen = await render(ModelsCatalogInputBadges, { modalities: inputs });

		expect(screen.container.querySelector('[aria-label="vision"]') !== null).toBe(image);
		expect(screen.container.querySelector('[title="Supports audio input"]') !== null).toBe(audio);
		expect(screen.container.querySelector('[title="Supports video input"]') !== null).toBe(video);
	}
);
