/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { LogManager } from '@/logging/LogManager.js';
import type { LogBackend } from '@/logging/LogBackend.js';
import type { LogRecordInput } from '@/logging/types.js';

/** テストで使う最小構成のログ入力を作成します。 */
function createInput(level: LogRecordInput['level'] = 'info'): LogRecordInput {
	return {
		level,
		message: 'message',
		context: [
			{ name: 'queue', color: 'red' },
			{ name: 'deliver', color: 'blue' },
		],
	};
}

/** 実行環境を固定したLogManagerと、出力確認用の関数を作成します。 */
function createManager(options: {
	quiet?: boolean;
	verbose?: boolean;
	nodeEnv?: string;
	isPrimary?: boolean;
	workerId?: number | null;
	normalizationProfile?: 'standard' | 'detailed';
} = {}) {
	const write = vi.fn<LogBackend['write']>();
	const manager = new LogManager({ write }, {
		now: () => new Date('2025-01-02T03:04:05.678Z'),
		getProcessInfo: () => ({
			processId: 1234,
			isPrimary: options.isPrimary ?? true,
			workerId: options.workerId ?? null,
		}),
		isQuiet: () => options.quiet ?? false,
		isVerbose: () => options.verbose ?? false,
		getNodeEnv: () => options.nodeEnv ?? 'development',
	}, {
		normalizationProfile: options.normalizationProfile,
	});

	return { manager, write };
}

describe('LogManager', () => {
	test('adds logger and process metadata while preserving root-to-leaf context order', () => {
		const { manager, write } = createManager();
		const input = createInput();

		manager.write(input);

		expect(write).toHaveBeenCalledOnce();
		expect(write).toHaveBeenCalledWith({
			...input,
			context: [
				{ name: 'queue', color: 'red' },
				{ name: 'deliver', color: 'blue' },
			],
			timestamp: '2025-01-02T03:04:05.678Z',
			loggerName: 'queue.deliver',
			processId: 1234,
			isPrimary: true,
			workerId: null,
		});
		expect(write.mock.calls[0][0].context).not.toBe(input.context);
	});

	test('records worker process metadata', () => {
		const { manager, write } = createManager({ isPrimary: false, workerId: 7 });

		manager.write(createInput());

		expect(write.mock.calls[0][0]).toMatchObject({
			processId: 1234,
			isPrimary: false,
			workerId: 7,
		});
	});

	test('does not call the backend in quiet mode', () => {
		const { manager, write } = createManager({ quiet: true, verbose: true });

		manager.write(createInput('fatal'));
		manager.write(createInput('debug'));

		expect(write).not.toHaveBeenCalled();
	});

	test('writes debug logs outside production', () => {
		const { manager, write } = createManager({ nodeEnv: 'development' });

		manager.write(createInput('debug'));

		expect(write).toHaveBeenCalledOnce();
	});

	test('suppresses debug logs in production by default', () => {
		const { manager, write } = createManager({ nodeEnv: 'production' });

		manager.write(createInput('debug'));

		expect(write).not.toHaveBeenCalled();
	});

	test('writes debug logs in verbose production mode', () => {
		const { manager, write } = createManager({ nodeEnv: 'production', verbose: true });

		manager.write(createInput('debug'));

		expect(write).toHaveBeenCalledOnce();
	});

	test('uses a replaced backend for subsequent records', () => {
		const { manager, write } = createManager();
		const replacementWrite = vi.fn<LogBackend['write']>();

		manager.setBackend({ write: replacementWrite });
		manager.write(createInput());

		expect(write).not.toHaveBeenCalled();
		expect(replacementWrite).toHaveBeenCalledOnce();
	});

	test('normalizes structured attributes and errors before writing', () => {
		const { manager, write } = createManager();
		const error = new TypeError('broken');

		manager.write({
			...createInput('error'),
			eventName: 'api.endpoint.failed',
			attributes: { i: 'secret', safe: 'value' },
			error,
		});

		expect(write.mock.calls[0][0]).toMatchObject({
			eventName: 'api.endpoint.failed',
			attributes: { i: '[REDACTED]', safe: 'value' },
			error: { type: 'TypeError', message: 'broken' },
		});
	});

	test('does not pass raw structured values when normalization omits an error', () => {
		const { manager, write } = createManager();

		manager.write({
			...createInput('error'),
			attributes: { detail: 'value' },
			error: null,
		});

		expect(write.mock.calls[0][0].attributes).toEqual({ detail: 'value' });
		expect(write.mock.calls[0][0]).not.toHaveProperty('error');
	});

	test('keeps legacy data for the pretty output while serializing its Error separately', () => {
		const { manager, write } = createManager();
		const error = new Error('legacy failure');
		const data = { detail: 'legacy', e: error };

		manager.write({
			...createInput('error'),
			compatibility: { data },
		});

		expect(write.mock.calls[0][0].compatibility?.data).toBe(data);
		expect(write.mock.calls[0][0]).toMatchObject({
			error: { type: 'Error', message: 'legacy failure' },
		});
		expect(write.mock.calls[0][0].attributes).toBeUndefined();
	});

	test('supports the detailed normalization profile', () => {
		const { manager, write } = createManager({ normalizationProfile: 'detailed' });

		manager.write({
			...createInput(),
			attributes: { nested: { level1: { level2: { level3: { value: 'kept' } } } } },
		});

		expect(write.mock.calls[0][0].attributes).toEqual({
			nested: { level1: { level2: { level3: { value: 'kept' } } } },
		});
	});

	test('switches the normalization profile for existing loggers', () => {
		const { manager, write } = createManager();
		const nested = { level1: { level2: { level3: { level4: { level5: { level6: { value: 'kept' } } } } } } };

		manager.write({ ...createInput(), attributes: nested });
		manager.setNormalizationProfile('detailed');
		manager.write({ ...createInput(), attributes: nested });

		expect(write.mock.calls[0][0].attributes).toMatchObject({
			level1: { level2: { level3: { level4: { level5: { level6: '[Truncated]' } } } } },
		});
		expect(write.mock.calls[1][0].attributes).toEqual(nested);
	});
});
