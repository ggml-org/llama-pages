import Page from './+page.svelte';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';

test('renders bold description markup as strong text', async () => {
	const screen = await render(Page);
	const boldDescription = screen.container.querySelector('a[href="/models/gemma-4"] strong');

	expect(boldDescription?.textContent).toBe('agentic models for your laptops');
	expect(boldDescription).not.toHaveClass('text-foreground');
});
