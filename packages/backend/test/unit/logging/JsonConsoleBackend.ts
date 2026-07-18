/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import type { LogRecord } from '@/logging/types.js';
import { JsonConsoleBackend } from '@/logging/JsonConsoleBackend.js';

/** JSON形式のテストで使う共通のログを作成します。 */
function createRecord(overrides: Partial<LogRecord> = {}): LogRecord {
	return {
		level: 'error',
		message: 'delivery failed',
		context: [{ name: 'queue' }, { name: 'deliver' }],
		timestamp: '2025-01-02T03:04:05.678Z',
		loggerName: 'queue.deliver',
		processId: 1234,
		isPrimary: false,
		workerId: 7,
		...overrides,
	};
}

describe('JsonConsoleBackend', () => {
	test('writes a stable one-line JSON record', () => {
		const output = vi.fn<(line: string) => void>();
		const backend = new JsonConsoleBackend({ output });

		backend.write(createRecord({
			eventName: 'queue.job.failed',
			attributes: { jobId: '123', attempt: 2 },
			error: { type: 'TypeError', message: 'broken', stack: 'stack' },
		}));

		expect(output).toHaveBeenCalledOnce();
		expect(output.mock.calls[0][0]).toMatchInlineSnapshot(`"{\"timestamp\":\"2025-01-02T03:04:05.678Z\",\"level\":\"error\",\"message\":\"delivery failed\",\"loggerName\":\"queue.deliver\",\"eventName\":\"queue.job.failed\",\"attributes\":{\"jobId\":\"123\",\"attempt\":2},\"error\":{\"type\":\"TypeError\",\"message\":\"broken\",\"stack\":\"stack\"},\"processId\":1234,\"isPrimary\":false,\"workerId\":7}"`);
	});

	test('omits pretty-only compatibility data and context colors', () => {
		const output = vi.fn<(line: string) => void>();
		const backend = new JsonConsoleBackend({ output });
		const record = createRecord({
			context: [{ name: 'queue', color: 'red' }],
			compatibility: {
				legacyLevel: 'success',
				important: true,
				data: { secret: 'must not be written' },
			},
		});

		backend.write(record);

		expect(JSON.parse(output.mock.calls[0][0])).toEqual({
			timestamp: '2025-01-02T03:04:05.678Z',
			level: 'error',
			message: 'delivery failed',
			loggerName: 'queue.deliver',
			processId: 1234,
			isPrimary: false,
			workerId: 7,
		});
	});

	test('escapes newlines so each record remains one physical line', () => {
		const output = vi.fn<(line: string) => void>();
		const backend = new JsonConsoleBackend({ output });
		const message = 'first line\nsecond line "quoted"';

		backend.write(createRecord({ message }));

		const line = output.mock.calls[0][0];
		expect(line).not.toContain('\n');
		expect(JSON.parse(line).message).toBe(message);
	});
});
