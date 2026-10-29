import { expect, test } from '@playwright/test';

// The point of connecting from the header: in Chrome, the site's first
// request to the local server shows a Local Network Access prompt, so no
// page may make one until the visitor clicks "Connect".
test('no page contacts the local server until the visitor connects', async ({ page }) => {
	const requests: string[] = [];

	await page.route('http://localhost:9931/**', (route) => {
		requests.push(route.request().url());

		return route.fulfill({ json: { data: [{ id: 'some/model:Q8_0' }] } });
	});

	// The catalog comes last, where the test clicks Connect: /docs redirects
	// and drops `?os=mac`, and on a Linux machine (like CI) the pill is hidden.
	for (const path of ['/docs?os=mac', '/models/lfm-2-5?os=mac', '/models?os=mac']) {
		await page.goto(`http://localhost:4173${path}`);
		await page.waitForLoadState('networkidle');
	}

	expect(requests).toEqual([]);

	await page.getByRole('button', { name: 'Connect Llama' }).click();
	await page.getByRole('button', { exact: true, name: 'Connect' }).click();

	await expect(page.getByText('Connected to Llama')).toBeVisible();
	expect(requests.length).toBeGreaterThan(0);
});

// Safari blocks an https page's requests to http://localhost outright, so
// connecting could only fail there; the pill is hidden instead. Chrome's user
// agent also says "Safari", so check both.
test('the connection pill is hidden in Safari, and only there', async ({ browser }) => {
	const agents = {
		chrome:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
		safari:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15'
	};

	for (const [name, userAgent] of Object.entries(agents)) {
		const context = await browser.newContext({ userAgent });
		const page = await context.newPage();

		await page.goto('http://localhost:4173/models?os=mac');
		await expect(page.getByRole('button', { name: 'Connect Llama' })).toBeVisible({
			visible: name === 'chrome'
		});
		await context.close();
	}
});
