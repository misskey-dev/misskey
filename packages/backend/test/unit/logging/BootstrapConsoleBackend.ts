/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import type { LogRecord } from '@/logging/types.js';
import { BootstrapConsoleBackend } from '@/logging/BootstrapConsoleBackend.js';

function createRecord(overrides: Partial<LogRecord> = {}): LogRecord {
	return {
		level: 'error',
		message: 'configuration failed',
		context: [{ name: 'core' }, { name: 'boot' }],
		timestamp: '2025-01-02T03:04:05.678Z',
		loggerName: 'core.boot',
		processId: 1234,
		isPrimary: true,
		workerId: null,
		...overrides,
	};
}

describe('BootstrapConsoleBackend', () => {
	test('writes a minimal line with legacy data', () => {
		const output = vi.fn();
		const backend = new BootstrapConsoleBackend({ output });
		const data = { detail: 'failed' };

		backend.write(createRecord({ compatibility: { data } }));

		expect(output).toHaveBeenCalledWith('2025-01-02T03:04:05.678Z ERROR *\t[core.boot]\tconfiguration failed', data);
	});

	test('writes structured details without depending on Pretty formatting', () => {
		const output = vi.fn();
		const backend = new BootstrapConsoleBackend({ output });

		backend.write(createRecord({
			eventName: 'config.load.failed',
			attributes: { path: '.config/default.yml' },
			error: { type: 'Error', message: 'not found' },
		}));

		expect(output).toHaveBeenCalledWith(
			'2025-01-02T03:04:05.678Z ERROR *\t[core.boot]\tconfiguration failed',
			{
				eventName: 'config.load.failed',
				attributes: { path: '.config/default.yml' },
				error: { type: 'Error', message: 'not found' },
			},
		);
	});
});
