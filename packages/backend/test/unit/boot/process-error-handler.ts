/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import type { LogWriteInput } from '@/logging/types.js';
import { installProcessErrorHandlers } from '@/boot/process-error-handler.js';

type ProcessListener = (...args: unknown[]) => void;

/** テスト用に、登録されたプロセスイベントを呼び出せる処理対象を作成します。 */
function createProcessLike(): {
	readonly process: { on: (event: string, listener: ProcessListener) => void };
	readonly listeners: Map<string, ProcessListener>;
} {
	const listeners = new Map<string, ProcessListener>();
	return {
		process: {
			on: (event, listener) => listeners.set(event, listener),
		},
		listeners,
	};
}

describe('installProcessErrorHandlers', () => {
	test('records unhandled rejections and uncaught exceptions as structured errors', () => {
		const { process, listeners } = createProcessLike();
		const write = vi.fn<(input: LogWriteInput) => void>();
		const rejection = new Error('rejected');
		const exception = new TypeError('uncaught');

		installProcessErrorHandlers({ process: process as never, logger: { write }, quiet: false });
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		listeners.get('unhandledRejection')!(rejection);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		listeners.get('uncaughtException')!(exception);

		expect(write).toHaveBeenNthCalledWith(1, {
			level: 'error',
			eventName: 'process.unhandled_rejection',
			message: 'Unhandled promise rejection',
			error: rejection,
		});
		expect(write).toHaveBeenNthCalledWith(2, {
			level: 'error',
			eventName: 'process.uncaught_exception',
			message: 'Uncaught exception',
			error: exception,
		});
	});

	test('does not register the unhandled rejection handler in quiet mode', () => {
		const { process, listeners } = createProcessLike();

		installProcessErrorHandlers({ process: process as never, logger: { write: vi.fn() }, quiet: true });

		expect([...listeners.keys()]).toEqual(['uncaughtException']);
	});

	test('does not rethrow when the logger fails', () => {
		const { process, listeners } = createProcessLike();
		const write = vi.fn(() => {
			throw new Error('logger failed');
		});

		installProcessErrorHandlers({ process: process as never, logger: { write }, quiet: false });

		expect(() => listeners.get('unhandledRejection')!(new Error('rejected'))).not.toThrow();
		expect(() => listeners.get('uncaughtException')!(new Error('uncaught'))).not.toThrow();
	});
});
