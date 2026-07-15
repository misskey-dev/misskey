/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { LogRecordInput } from '@/logging/types.js';

const mocks = vi.hoisted(() => ({
	write: vi.fn<(input: LogRecordInput) => void>(),
}));

vi.mock('@/logging/logging-runtime.js', () => ({
	logManager: {
		write: mocks.write,
	},
}));

import Logger from '@/logger.js';

describe('Logger', () => {
	beforeEach(() => {
		mocks.write.mockReset();
	});

	test('passes immutable multi-level root-to-leaf context to the manager', () => {
		const root = new Logger('root', 'red');
		const child = root.createSubLogger('child', 'green');
		const leaf = child.createSubLogger('leaf', 'blue');

		leaf.info('from leaf');
		root.info('from root');

		expect(mocks.write.mock.calls[0][0]).toMatchObject({
			level: 'info',
			message: 'from leaf',
			context: [
				{ name: 'root', color: 'red' },
				{ name: 'child', color: 'green' },
				{ name: 'leaf', color: 'blue' },
			],
		});
		expect(mocks.write.mock.calls[1][0].context).toEqual([
			{ name: 'root', color: 'red' },
		]);
	});

	test('maps succ to info with the legacy success presentation', () => {
		new Logger('root').succ('completed', { count: 1 }, true);

		expect(mocks.write).toHaveBeenCalledWith({
			level: 'info',
			message: 'completed',
			context: [{ name: 'root', color: undefined }],
			compatibility: {
				legacyLevel: 'success',
				important: true,
				data: { count: 1 },
			},
		});
	});

	test('uses Error.toString and adds the Error to existing data', () => {
		const logger = new Logger('root');
		const error = new TypeError('broken');
		const data: Record<string, unknown> = { requestId: 'request' };

		logger.error(error, data, true);

		expect(data).toEqual({ requestId: 'request', e: error });
		expect(mocks.write).toHaveBeenCalledWith({
			level: 'error',
			message: 'TypeError: broken',
			context: [{ name: 'root', color: undefined }],
			compatibility: {
				legacyLevel: undefined,
				important: true,
				data,
			},
		});
	});

	test('creates data containing the Error when none is supplied', () => {
		const error = new Error('broken');

		new Logger('root').error(error);

		expect(mocks.write.mock.calls[0][0].compatibility?.data).toEqual({ e: error });
	});

	test('keeps public methods bound when called separately', () => {
		const logger = new Logger('root');
		const info = logger.info;

		info('bound');

		expect(mocks.write).toHaveBeenCalledWith(expect.objectContaining({
			level: 'info',
			message: 'bound',
			context: [{ name: 'root', color: undefined }],
		}));
	});
});
