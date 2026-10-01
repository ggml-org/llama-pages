import { expect, test } from '@playwright/test';

test('home page loads with expected content', async ({ page }) => {
	await page.goto('http://localhost:4173/?os=linux');

	await expect(
		page.getByText('curl -LsSf https://llama.app/install.sh | sh').first()
	).toBeVisible();

	const packageManagersLink = page.getByRole('link', { name: 'Package managers' });

	await expect(packageManagersLink).toBeVisible();
	await expect(packageManagersLink).toHaveAttribute(
		'href',
		'https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md'
	);
});
