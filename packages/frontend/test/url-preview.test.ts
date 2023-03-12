import { describe, test, assert, afterEach } from 'vitest';
import { render, cleanup, type RenderResult } from '@testing-library/vue';
import './init';
import { directives } from '@/directives';
import MkUrlPreview from '@/components/MkUrlPreview.vue';

describe('MkMediaImage', () => {
	const renderPreview = async (url: string): Promise<RenderResult> => {
		const result = render(MkUrlPreview, {
			props: { url },
			global: { directives },
		});

		await new Promise<void>(resolve => {
			const observer = new MutationObserver(() => {
				resolve();
				observer.disconnect();
			});
			observer.observe(result.container, { childList: true, subtree: true });
		});

		return result;
	};

	afterEach(() => {
		fetchMock.resetMocks();
		cleanup();
	});

	test('Should render the description', async () => {
		fetchMock.mockOnceIf(/^\/url?/, () => {
			return {
				status: 200,
				body: JSON.stringify({
					url: 'https://example.local',
					description: 'Mocked description',
					player: {},
				}),
			};
		});

		const mkUrlPreview = await renderPreview('https://example.local');
		mkUrlPreview.getByText('Mocked description');
	});

	test('Having a player should render a button', async () => {
		fetchMock.mockOnceIf(/^\/url?/, () => {
			return {
				status: 200,
				body: JSON.stringify({
					url: 'https://example.local',
					player: {
						url: 'https://example.local/player',
					},
				}),
			};
		});

		const mkUrlPreview = await renderPreview('https://example.local');
		const buttons = mkUrlPreview.getAllByRole('button');
		assert.strictEqual(buttons.length, 2, 'two buttons');
	});

	test('Having a player should setup the iframe', async () => {
		fetchMock.mockOnceIf(/^\/url?/, () => {
			return {
				status: 200,
				body: JSON.stringify({
					url: 'https://example.local',
					player: {
						url: 'https://example.local/player',
						allow: [],
					},
				}),
			};
		});

		const mkUrlPreview = await renderPreview('https://example.local');
		const buttons = mkUrlPreview.getAllByRole('button');
		buttons[0].click();
		// Wait for the click event to be fired
		await Promise.resolve();

		const iframe = mkUrlPreview.container.querySelector('iframe');
		assert.exists(iframe, 'iframe should exist');
		assert.strictEqual(iframe?.src, 'https://example.local/player?autoplay=1&auto_play=1');
		assert.strictEqual(
			iframe?.sandbox.toString(),
			'allow-popups allow-scripts allow-storage-access-by-user-activation allow-same-origin',
		);
	});

	test('Having a player with `allow` field should set permissions', async () => {
		fetchMock.mockOnceIf(/^\/url?/, () => {
			return {
				status: 200,
				body: JSON.stringify({
					url: 'https://example.local',
					player: {
						url: 'https://example.local/player',
						allow: ['fullscreen', 'web-share'],
					},
				}),
			};
		});

		const mkUrlPreview = await renderPreview('https://example.local');
		const buttons = mkUrlPreview.getAllByRole('button');
		buttons[0].click();
		// Wait for the click event to be fired
		await Promise.resolve();

		const iframe = mkUrlPreview.container.querySelector('iframe');
		assert.exists(iframe, 'iframe should exist');
		assert.strictEqual(iframe?.allow, 'fullscreen;web-share');
	});

	test('Having a player width should keep the fixed aspect ratio', async () => {
		fetchMock.mockOnceIf(/^\/url?/, () => {
			return {
				status: 200,
				body: JSON.stringify({
					url: 'https://example.local',
					player: {
						url: 'https://example.local/player',
						width: 400,
						height: 200,
						allow: [],
					},
				}),
			};
		});

		const mkUrlPreview = await renderPreview('https://example.local');
		const buttons = mkUrlPreview.getAllByRole('button');
		buttons[0].click();
		// Wait for the click event to be fired
		await Promise.resolve();

		const iframe = mkUrlPreview.container.querySelector('iframe');
		assert.exists(iframe, 'iframe should exist');
		assert.strictEqual(iframe?.parentElement?.style.paddingTop, '50%');
	});

	test('Having a player width should keep the fixed height', async () => {
		fetchMock.mockOnceIf(/^\/url?/, () => {
			return {
				status: 200,
				body: JSON.stringify({
					url: 'https://example.local',
					player: {
						url: 'https://example.local/player',
						width: null,
						height: 200,
						allow: [],
					},
				}),
			};
		});

		const mkUrlPreview = await renderPreview('https://example.local');
		const buttons = mkUrlPreview.getAllByRole('button');
		buttons[0].click();
		// Wait for the click event to be fired
		await Promise.resolve();

		const iframe = mkUrlPreview.container.querySelector('iframe');
		assert.exists(iframe, 'iframe should exist');
		assert.strictEqual(iframe?.parentElement?.style.paddingTop, '200px');
	});
});
