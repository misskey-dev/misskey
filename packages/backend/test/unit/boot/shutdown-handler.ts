/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';

describe('shutdown-handler', () => {
	test('runs shutdown tasks once and exits on SIGTERM or SIGINT', async () => {
		vi.resetModules();
		const { installShutdownSignalHandlers, isShutdownInProgress } = await import('@/boot/shutdown-handler.js');
		const handlers = new Map<string, () => Promise<void>>();
		const processLike = {
			once: vi.fn((event: string, handler: () => Promise<void>) => {
				handlers.set(event, handler);
				return processLike;
			}),
		};
		const calls: string[] = [];
		const shutdownTelemetry = vi.fn(async () => {
			calls.push('telemetry');
		});
		const shutdownLogging = vi.fn(async () => {
			calls.push('logging');
		});
		const exit = vi.fn();
		const onRegistered = vi.fn();

		installShutdownSignalHandlers({ process: processLike, shutdownTasks: [shutdownTelemetry, shutdownLogging], exit, onRegistered });

		expect(processLike.once).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
		expect(processLike.once).toHaveBeenCalledWith('SIGINT', expect.any(Function));
		expect(onRegistered).toHaveBeenCalledOnce();
		expect(isShutdownInProgress()).toBe(false);

		await handlers.get('SIGTERM')!();
		await handlers.get('SIGINT')!();

		expect(isShutdownInProgress()).toBe(true);
		expect(calls).toEqual(['telemetry', 'logging']);
		expect(shutdownTelemetry).toHaveBeenCalledTimes(1);
		expect(shutdownLogging).toHaveBeenCalledTimes(1);
		expect(exit).toHaveBeenCalledTimes(1);
		expect(exit).toHaveBeenCalledWith(0);
	});

	test('continues with later shutdown tasks when an earlier task rejects', async () => {
		vi.resetModules();
		const { installShutdownSignalHandlers } = await import('@/boot/shutdown-handler.js');
		const handlers = new Map<string, () => Promise<void>>();
		const processLike = {
			once: vi.fn((event: string, handler: () => Promise<void>) => {
				handlers.set(event, handler);
				return processLike;
			}),
		};
		const exit = vi.fn();
		const shutdownLogging = vi.fn().mockResolvedValue(undefined);
		const shutdownError = new Error('flush failed');
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		try {
			installShutdownSignalHandlers({
				process: processLike,
				shutdownTasks: [vi.fn().mockRejectedValue(shutdownError), shutdownLogging],
				exit,
			});

			await handlers.get('SIGINT')!();

			expect(exit).toHaveBeenCalledWith(0);
			expect(shutdownLogging).toHaveBeenCalledOnce();
			expect(consoleError).toHaveBeenCalledWith('Shutdown task failed:', shutdownError);
		} finally {
			consoleError.mockRestore();
		}
	});

	test('exits after the shutdown deadline when a task remains pending', async () => {
		vi.resetModules();
		vi.useFakeTimers();
		const { installShutdownSignalHandlers } = await import('@/boot/shutdown-handler.js');
		const handlers = new Map<string, () => Promise<void>>();
		const processLike = {
			once: vi.fn((event: string, handler: () => Promise<void>) => {
				handlers.set(event, handler);
				return processLike;
			}),
		};
		const exit = vi.fn();
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		try {
			installShutdownSignalHandlers({
				process: processLike,
				shutdownTasks: [() => new Promise<void>(() => {})],
				exit,
			});

			const signalPromise = handlers.get('SIGTERM')!();
			expect(exit).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(10_000);
			await signalPromise;

			expect(consoleError).toHaveBeenCalledWith('Shutdown tasks timed out after 10000ms.');
			expect(exit).toHaveBeenCalledWith(0);
		} finally {
			consoleError.mockRestore();
			vi.useRealTimers();
		}
	});
});
