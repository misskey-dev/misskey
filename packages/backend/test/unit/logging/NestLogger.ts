/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Logger as NestJsLogger } from '@nestjs/common';
import type { LogRecordInput } from '@/logging/types.js';

const mocks = vi.hoisted(() => ({
	write: vi.fn<(input: LogRecordInput) => void>(),
}));

vi.mock('@/logging/logging-runtime.js', () => ({
	logManager: {
		write: mocks.write,
	},
}));

import { NestLogger } from '@/NestLogger.js';

/** 実行環境のstack形式に依存しないよう、NestJSのstack判定を満たす文字列を自前で与える。 */
function createError(message: string): Error {
	const error = new Error(message);
	error.stack = `Error: ${message}\n    at createError (/app/packages/backend/test/unit/logging/NestLogger.ts:1:1)`;
	return error;
}

function records(): LogRecordInput[] {
	return mocks.write.mock.calls.map(([record]) => record);
}

describe('NestLogger', () => {
	beforeEach(() => {
		mocks.write.mockReset();
	});

	afterEach(() => {
		NestJsLogger.overrideLogger(false);
		vi.unstubAllEnvs();
	});

	test('maps every Nest log level onto the Misskey level', () => {
		const logger = new NestLogger();

		logger.verbose('verbose');
		logger.debug('debug');
		logger.log('log');
		logger.warn('warn');
		logger.error('error');
		logger.fatal('fatal');

		expect(records().map(record => record.level)).toEqual([
			'debug', 'debug', 'info', 'warn', 'error', 'fatal',
		]);
		expect(records()[0].context).toEqual([
			{ name: 'core', color: 'cyan' },
			{ name: 'nest', color: 'green' },
		]);
	});

	// Nest 12のlifecycle hookは Logger.error(reason, reason?.stack) をcontext無しで呼ぶ。
	// stackをcontextと取り違えると、本文の先頭にスタックトレース全文が出てしまう。
	test('keeps the stack out of the context when Nest reports a rejection without context', () => {
		NestJsLogger.overrideLogger(new NestLogger());
		const error = createError('broken');

		NestJsLogger.error(error, error.stack);

		expect(records()[0]).toMatchObject({
			level: 'error',
			message: 'Error: broken',
			error,
		});
	});

	// Nestのインスタンス版Loggerは、contextを持つとき引数を [message, undefined, context] へ展開する。
	test('adopts the trailing string as context when Nest appends its own', () => {
		NestJsLogger.overrideLogger(new NestLogger());
		const error = createError('broken');

		new NestJsLogger('InstanceLoader').error(error);

		expect(records()).toHaveLength(1);
		expect(records()[0]).toMatchObject({
			level: 'error',
			message: 'InstanceLoader: Error: broken',
			error,
		});
	});

	test('reconstructs an error from the stack when the message is not an Error', () => {
		const logger = new NestLogger();
		const stack = 'Error: boom\n    at handler (/app/packages/backend/src/boot/common.ts:1:1)';

		logger.error('boom', stack);

		expect(records()[0]).toMatchObject({
			level: 'error',
			message: 'boom',
			error: { name: 'Error', message: 'boom', stack },
		});
	});

	test('omits the error field when neither an Error nor a stack is given', () => {
		new NestLogger().error('boom', 'ExceptionHandler');

		expect(records()[0]).toMatchObject({ message: 'ExceptionHandler: boom' });
		expect(records()[0]).not.toHaveProperty('error');
	});

	// Nest 12のstructuredParams: messageより後のプレーンオブジェクトは構造化された付帯情報として扱われる。
	test('forwards structured params as attributes', () => {
		new NestLogger().log('mapped', { route: '/api' }, 'RouterExplorer');

		expect(records()[0]).toMatchObject({
			level: 'info',
			message: 'RouterExplorer: mapped',
			attributes: { route: '/api' },
		});
	});

	test('writes one record per message when Nest passes several', () => {
		new NestLogger().log('first', 'second', 'RouterExplorer');

		expect(records().map(record => record.message)).toEqual([
			'RouterExplorer: first',
			'RouterExplorer: second',
		]);
	});

	test('inspects non-string messages into a single line instead of coercing them to [object Object]', () => {
		new NestLogger().warn({ port: 3000 }, 'ServerService');

		expect(records()[0].message).toContain('port: 3000');
		expect(records()[0].message).not.toContain('[object Object]');
		expect(records()[0].message).not.toContain('\n');
	});

	// ConsoleLogger.error()はprintMessages()の後にstackをprocess.stderrへ直接書くため、
	// 抑止しないとMisskeyのログ整形を迂回したstackが二重に出る。
	test('does not let ConsoleLogger write the stack straight to stderr', () => {
		const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
		const error = createError('broken');

		try {
			new NestLogger().error(error, error.stack);
		} finally {
			write.mockRestore();
		}

		expect(write).not.toHaveBeenCalled();
		expect(records()[0]).toMatchObject({ message: 'Error: broken', error });
	});

	test('drops debug and verbose in production', () => {
		vi.stubEnv('NODE_ENV', 'production');
		const logger = new NestLogger();

		logger.verbose('verbose');
		logger.debug('debug');
		logger.log('log');
		logger.error('error');

		expect(records().map(record => record.level)).toEqual(['info', 'error']);
	});
});
