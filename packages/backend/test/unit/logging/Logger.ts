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

	test('supports structured log input while preserving the context hierarchy', () => {
		new Logger('root').createSubLogger('child').write({
			level: 'error',
			eventName: 'example.failed',
			message: 'failed',
			attributes: { id: 'id' },
			error: new Error('broken'),
		});

		expect(mocks.write).toHaveBeenCalledWith(expect.objectContaining({
			level: 'error',
			eventName: 'example.failed',
			context: [{ name: 'root', color: undefined }, { name: 'child', color: undefined }],
		}));
	});

	test('supports structured input through every level-specific method', () => {
		const logger = new Logger('root').createSubLogger('child');
		const error = new Error('broken');
		const input = {
			eventName: 'example.failed',
			message: 'failed',
			attributes: { id: 'id' },
			error,
		};

		logger.debug(input);
		logger.info(input);
		logger.warn(input);
		logger.error(input);
		logger.fatal(input);

		expect(mocks.write.mock.calls.map(([entry]) => entry.level)).toEqual([
			'debug',
			'info',
			'warn',
			'error',
			'fatal',
		]);
		for (const [entry] of mocks.write.mock.calls) {
			expect(entry).toMatchObject({
				...input,
				context: [
					{ name: 'root', color: undefined },
					{ name: 'child', color: undefined },
				],
			});
			expect(entry).not.toHaveProperty('compatibility');
		}
	});

	test('level-specific methods own the level even for runtime-invalid input', () => {
		const logger = new Logger('root');

		// @ts-expect-error level is selected by the method rather than the input object
		logger.warn({ level: 'error', message: 'warning' });

		expect(mocks.write.mock.calls[0][0]).toMatchObject({
			level: 'warn',
			message: 'warning',
		});
	});

	test('preserves the legacy string signatures for non-error levels', () => {
		const logger = new Logger('root');
		logger.debug('debug', { source: 'debug' }, true);
		logger.info('info', null, true);
		logger.warn('warn', { source: 'warn' });

		expect(mocks.write.mock.calls.map(([entry]) => entry.compatibility)).toEqual([
			{ legacyLevel: undefined, important: true, data: { source: 'debug' } },
			{ legacyLevel: undefined, important: true, data: null },
			{ legacyLevel: undefined, important: false, data: { source: 'warn' } },
		]);
	});

	test('records a fatal string through the structured API', () => {
		new Logger('root').fatal('fatal message');

		expect(mocks.write).toHaveBeenCalledWith({
			level: 'fatal',
			message: 'fatal message',
			context: [{ name: 'root', color: undefined }],
		});
	});

	test('preserves the legacy error string signature', () => {
		new Logger('root').error('failed', { requestId: 'request' }, true);

		expect(mocks.write).toHaveBeenCalledWith({
			level: 'error',
			message: 'failed',
			context: [{ name: 'root', color: undefined }],
			compatibility: {
				legacyLevel: undefined,
				important: true,
				data: { requestId: 'request' },
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
			error,
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
