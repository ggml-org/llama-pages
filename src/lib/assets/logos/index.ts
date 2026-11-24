// Per-brand logos, mirroring LlamaBarn's ModelLogos asset set.
// SVGs are inlined (?raw) so they inherit text color via `currentColor`.
// Clef models are made by Cloudflare.
import cloudflare from './cloudflare.svg?raw';
// Generic cube, shown for brands we have no logo for. A solid glyph, so it
// carries the same visual weight as the brand logos; thin outline strokes on
// 30-degree diagonals render jagged at icon size. Built on the logos' 32-unit
// frame: a hexagon of circumradius 14 (the same 2-unit padding the logos have)
// with its top face cut out as a hole. The hole is the top face inset by 1.75
// along the outer edges and 1.25 along the inner seams, so its lower point sits
// low and the rim stays solid. Corners are rounded with radius 2.5 outside;
// the hole's top and bottom corners use 2 and its sharper side corners 1.
import cube from './cube.svg?raw';
import deepseek from './deepseek.svg?raw';
import gemma from './gemma.svg?raw';
// GLM models are made by Z.ai, so we use the Z brand logo for that brand.
import glm from './glm.svg?raw';
import liquid from './liquid.svg?raw';
import meta from './meta.svg?raw';
import mistral from './mistral.svg?raw';
import nvidia from './nvidia.svg?raw';
import openai from './openai.svg?raw';
// Laguna models are made by Poolside, so we use the Poolside logo for that brand.
// Muse models are made by Meta.
import poolside from './poolside.svg?raw';
import qwen from './qwen.svg?raw';

// Keyed by the `brand` label used in catalog.json.
const byBrand: Record<string, string> = {
	Cloudflare: cloudflare,
	DeepSeek: deepseek,
	Gemma: gemma,
	GLM: glm,
	Laguna: poolside,
	'Liquid AI': liquid,
	Meta: meta,
	Mistral: mistral,
	NVIDIA: nvidia,
	OpenAI: openai,
	Qwen: qwen
};

// Inline SVG markup for a brand's logo, falling back to a generic cube.
export function logoFor(brand: string): string {
	return byBrand[brand] ?? cube;
}
