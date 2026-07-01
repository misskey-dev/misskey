/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Config } from '@/config.js';

const mock = vi.hoisted(() => ({
	sentryImportCount: 0,
	profilingImportCount: 0,
	init: vi.fn(),
	nodeProfilingIntegration: vi.fn(),
}));

vi.mock('@sentry/node', () => {
	mock.sentryImportCount++;
	return {
		init: mock.init,
	};
});

vi.mock('@sentry/profiling-node', () => {
	mock.profilingImportCount++;
	return {
		nodeProfilingIntegration: mock.nodeProfilingIntegration,
	};
});

describe('sentryInit', () => {
	beforeEach(() => {
		vi.resetModules();
		mock.sentryImportCount = 0;
		mock.profilingImportCount = 0;
		mock.init.mockReset();
		mock.nodeProfilingIntegration.mockReset();
	});

	test('sentryForBackendが未設定の場合はSentry関連モジュールを読み込まない', async () => {
		const { sentryInit } = await import('@/boot/sentry.js');

		await sentryInit({ sentryForBackend: undefined } as Config);

		expect(mock.sentryImportCount).toBe(0);
		expect(mock.profilingImportCount).toBe(0);
		expect(mock.init).not.toHaveBeenCalled();
	});
});
