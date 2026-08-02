/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, type RenderResult } from '@testing-library/vue';
import { nextTick } from 'vue';
import { components } from '@/components/index.js';
import { directives } from '@/directives/index.js';
import MkExternalPlayerViewer from '@/components/MkExternalPlayerViewer.vue';

describe('MkExternalPlayerViewer', () => {
	const player = {
		url: 'https://example.com/player',
		width: 16,
		height: 9,
		allow: [],
	};

	beforeEach(() => {
		window.history.replaceState(null, '', '/');
	});

	afterEach(() => {
		vi.restoreAllMocks();
		cleanup();
	});

	function renderViewer(): RenderResult {
		return render(MkExternalPlayerViewer, {
			props: {
				player,
				title: 'External player',
				url: 'https://example.com/watch',
			},
			global: {
				components,
				directives,
				stubs: {
					MkExternalPlayer: true,
				},
			},
		});
	}

	test('removes its history entry when closed', () => {
		const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
		const viewer = renderViewer();

		expect(window.location.hash).toBe('#external-player');
		viewer.getByRole('button', { name: 'Close' }).click();

		expect(historyBack).toHaveBeenCalledOnce();
		viewer.unmount();
		expect(historyBack).toHaveBeenCalledOnce();
	});

	test('does not navigate back again when closed by popstate', async () => {
		const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
		const viewer = renderViewer();
		expect(viewer.container.querySelector('mk-external-player-stub')).not.toBeNull();
		window.history.replaceState(null, '', '/');

		window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
		await nextTick();

		expect(historyBack).not.toHaveBeenCalled();
		expect(viewer.container.querySelector('mk-external-player-stub')).toBeNull();
		viewer.unmount();
		expect(historyBack).not.toHaveBeenCalled();
	});

	test('keeps the viewer open when popstate returns to its owned history entry', async () => {
		const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
		const viewer = renderViewer();
		const viewerHistoryState = window.history.state;

		window.dispatchEvent(new PopStateEvent('popstate', { state: viewerHistoryState }));
		await nextTick();

		expect(viewer.container.querySelector('mk-external-player-stub')).not.toBeNull();
		// happy-dom does not synchronize history.state with a synthetic PopStateEvent.
		window.history.replaceState(viewerHistoryState, '', '#external-player');
		viewer.unmount();
		expect(historyBack).toHaveBeenCalledOnce();
	});

	test('removes an owned history entry when unexpectedly unmounted', () => {
		const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
		const viewer = renderViewer();

		viewer.unmount();

		expect(historyBack).toHaveBeenCalledOnce();
	});

	test('does not navigate back when the current history entry is no longer owned', () => {
		const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
		const viewer = renderViewer();
		window.history.replaceState({ anotherEntry: true }, '', '#another-entry');

		viewer.unmount();

		expect(historyBack).not.toHaveBeenCalled();
	});
});
