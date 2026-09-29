import InstallCommand from '../../src/lib/components/app/content/InstallCommand.svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

const INSTALL_COMMAND = 'curl -LsSf https://llama.app/install.sh | sh';

describe('InstallCommand.svelte', () => {
	it('renders install command and package manager link', async () => {
		render(InstallCommand);

		await expect.element(page.getByText(INSTALL_COMMAND)).toBeInTheDocument();

		const packageManagersLink = page.getByRole('link', { name: 'Package managers' });

		await expect
			.element(packageManagersLink)
			.toHaveAttribute('href', 'https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md');
	});

	it('copies install command and toggles icon after click', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);

		if (
			navigator.clipboard &&
			'writeText' in navigator.clipboard &&
			typeof navigator.clipboard.writeText === 'function'
		) {
			vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);
		} else {
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: { writeText }
			});
		}

		render(InstallCommand);

		const copyButton = page.getByRole('button', { name: 'Copy command' });

		await expect.element(copyButton).toBeInTheDocument();
		await copyButton.click();

		expect(writeText).toHaveBeenCalledWith(INSTALL_COMMAND);
		await expect.element(page.getByRole('button', { name: 'Copied command' })).toBeInTheDocument();
	});
});
