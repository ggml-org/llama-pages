// Renders static/og-image.png, the share preview for every page (see
// OG_IMAGE_PATH in site.constants.ts): the hero headline on the left, and the
// homepage's menu mock (the Mac menu bar and Llama's menu) on the right, on the
// hero panel's blue wallpaper -- so a shared link shows what Llama is (an app
// in the menu bar that runs models) and looks like the page it opens.
//
// The menu is captured from the running site rather than redrawn, so it can't
// drift from the homepage's. Run it against a build of the current site, on a
// Mac (the page's sans is the system font, so that gets SF Pro), with Chrome
// installed (it's used instead of a Playwright browser download):
//
//   npm run build && npm run preview
//   node scripts/og-image.js
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'static/og-image.png');
// `?os=mac` so the page shows the Mac mock, whatever OS this runs on.
const URL = process.argv[2] ?? 'http://localhost:4173/?os=mac';
// The size Facebook, X, LinkedIn and Slack all crop to, rendered at 2x so it
// stays sharp on Retina screens (feeds show it at ~500px wide, 1000 device px).
const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2;
// How the mock is placed: 1.2x its size on the site (336x444 -> 403x532),
// which fits it whole with a margin, inset from the top and right edges like
// it sits in the homepage's panel. It's captured at 3x, more than the 2.4x
// it's shown at, so it's downscaled (sharp) rather than upscaled (blurry).
const MOCK_SCALE = 1.2;
const MOCK_RIGHT = 64;
// Transparent room around the capture for the menu's drop shadow.
const SHADOW_PAD = 40;
// The hero panel's wallpaper, copied from the panel's classes in
// routes/+page.svelte (light mode).
const WALLPAPER = [
	'radial-gradient(ellipse at 15% 10%, #dcecfb 0%, transparent 55%)',
	'radial-gradient(ellipse at 90% 95%, #e8f2fc 0%, transparent 50%)',
	'linear-gradient(160deg, #c4ddf6 0%, #d0e4f7 55%, #dfecf9 100%)'
].join(', ');
// The brand mark, recolored to follow the text color.
const MARK = fs
	.readFileSync(path.join(ROOT, 'src/lib/assets/brand/icon-light.svg'), 'utf8')
	.replaceAll('#111111', 'currentColor');
const browser = await chromium.launch({ channel: 'chrome' });
// 1. Capture the mock: the menu bar icons and the menu, with its shadow, on a
//    transparent background.
const site = await browser.newPage({
	deviceScaleFactor: 3,
	viewport: { height: 1300, width: 1280 }
});

await site.goto(URL);

const box = await site.evaluate(() => {
	// The mock is the element holding both the menu bar (found by its
	// clock) and the menu below it.
	const clock = [...document.querySelectorAll('span')].find(
		(el) => el.textContent.startsWith('Wed') && el.getClientRects().length > 0
	);
	const mock = clock.parentElement.parentElement;

	// Clear the wallpaper and page behind the mock, so only the mock is
	// captured -- the image draws its own wallpaper.
	for (let el = mock; el; el = el.parentElement) {
		el.style.setProperty('background', 'transparent', 'important');
	}

	// Hide the numbered markers that tie the menu to the homepage's callouts
	// (the ring around each one too); the image has no callouts.
	for (const el of mock.querySelectorAll('*')) {
		if (el.children.length === 0 && /^[123]$/.test(el.textContent.trim())) {
			(el.closest('.ring-2') ?? el).style.display = 'none';
		}
	}

	const rect = mock.getBoundingClientRect();

	return { height: rect.height, width: rect.width, x: rect.x + scrollX, y: rect.y + scrollY };
});
const mock = await site.screenshot({
	clip: {
		height: box.height + 2 * SHADOW_PAD,
		width: box.width + 2 * SHADOW_PAD,
		x: box.x - SHADOW_PAD,
		y: box.y - SHADOW_PAD
	},
	fullPage: true,
	omitBackground: true
});
// 2. Compose the image: the headline on the left, the mock on the right,
//    centered vertically.
const mockWidth = (box.width + 2 * SHADOW_PAD) * MOCK_SCALE;
const mockTop = (HEIGHT - box.height * MOCK_SCALE) / 2 - SHADOW_PAD * MOCK_SCALE;
const mockRight = MOCK_RIGHT - SHADOW_PAD * MOCK_SCALE;
const image = await browser.newPage({
	deviceScaleFactor: SCALE,
	viewport: { height: HEIGHT, width: WIDTH }
});

await image.setContent(`<!doctype html>
<meta charset="utf-8" />
<style>
	body {
		margin: 0;
		height: ${HEIGHT}px;
		position: relative;
		overflow: hidden;
		background: ${WALLPAPER};
		/* The site's foreground and sans (app.css). */
		color: oklch(0.145 0 0);
		font-family: -apple-system, BlinkMacSystemFont, sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	.text {
		position: absolute;
		inset: 0 auto 0 80px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 36px;
	}

	/* The mark and name: the site's header shows the mark alone, but a
	   preview has no page around it to say what it's for. */
	.brand {
		display: flex;
		align-items: center;
		gap: 14px;
		font-size: 40px;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.brand svg {
		height: 40px;
		width: auto;
	}

	/* The hero h1, in three lines to fit beside the mock. */
	h1 {
		margin: 0;
		font-size: 88px;
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1.02;
	}

	.mock {
		position: absolute;
		top: ${mockTop}px;
		right: ${mockRight}px;
		width: ${mockWidth}px;
	}
</style>
<div class="text">
	<div class="brand">${MARK}Llama</div>
	<h1>Your AI.<br />On your<br />computer.</h1>
</div>
<img class="mock" src="data:image/png;base64,${mock.toString('base64')}" />`);

await image.screenshot({ path: OUT });
await browser.close();

console.log(`Wrote ${path.relative(ROOT, OUT)}`);
