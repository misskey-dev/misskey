/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';

describe('telemetry-shutdown', () => {
	test('flushes telemetry once and exits on SIGTERM or SIGINT', async () => {
		vi.resetModules();
		const { installTelemetrySignalHandlers, isTelemetryShutdownInProgress } = await import('@/core/telemetry/telemetry-shutdown.js');
		const handlers = new Map<string, () => Promise<void>>();
		const processLike = {
			once: vi.fn((event: string, handler: () => Promise<void>) => {
				handlers.set(event, handler);
				return processLike;
			}),
		};
		const shutdownTelemetry = vi.fn().mockResolvedValue(undefined);
		const exit = vi.fn();

		installTelemetrySignalHandlers({ process: processLike, shutdownTelemetry, exit });

		expect(processLike.once).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
		expect(processLike.once).toHaveBeenCalledWith('SIGINT', expect.any(Function));
		expect(isTelemetryShutdownInProgress()).toBe(false);

		await handlers.get('SIGTERM')!();
		await handlers.get('SIGINT')!();

		expect(isTelemetryShutdownInProgress()).toBe(true);
		expect(shutdownTelemetry).toHaveBeenCalledTimes(1);
		expect(exit).toHaveBeenCalledTimes(1);
		expect(exit).toHaveBeenCalledWith(0);
	});

	test('exits even when telemetry shutdown rejects', async () => {
		vi.resetModules();
		const { installTelemetrySignalHandlers } = await import('@/core/telemetry/telemetry-shutdown.js');
		const handlers = new Map<string, () => Promise<void>>();
		const processLike = {
			once: vi.fn((event: string, handler: () => Promise<void>) => {
				handlers.set(event, handler);
				return processLike;
			}),
		};
		const exit = vi.fn();

		installTelemetrySignalHandlers({
			process: processLike,
			shutdownTelemetry: vi.fn().mockRejectedValue(new Error('flush failed')),
			exit,
		});

		await handlers.get('SIGINT')!();

		expect(exit).toHaveBeenCalledWith(0);
	});
});
