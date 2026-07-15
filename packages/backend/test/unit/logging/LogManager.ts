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
});
