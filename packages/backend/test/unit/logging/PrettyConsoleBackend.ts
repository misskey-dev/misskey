/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import type { LogRecord } from '@/logging/types.js';

type Formatter = ((value: unknown) => string) & { white?: Formatter };

const chalkMock = vi.hoisted(() => {
	const format = (name: string): Formatter => (value: unknown) => `<${name}>${String(value)}</${name}>`;
	const bgRed = format('bgRed');
	bgRed.white = format('bgRed.white');
	const bgGreen = format('bgGreen');
	bgGreen.white = format('bgGreen.white');

	return {
		red: format('red'),
		yellow: format('yellow'),
		green: format('green'),
		gray: format('gray'),
		blue: format('blue'),
		white: format('white'),
		bold: format('bold'),
		bgRed,
		bgGreen,
		rgb: (red: number, green: number, blue: number) => format(`rgb:${red},${green},${blue}`),
	};
});

vi.mock('chalk', () => ({
	default: chalkMock,
}));

import { PrettyConsoleBackend } from '@/logging/PrettyConsoleBackend.js';

/** Pretty形式のテストで使う共通のログを作成します。 */
function createRecord(overrides: Partial<LogRecord> = {}): LogRecord {
	return {
		level: 'info',
		message: 'message',
		context: [{ name: 'root' }],
		timestamp: '2025-01-02T03:04:05.678Z',
		loggerName: 'root',
		processId: 1234,
		isPrimary: true,
		workerId: null,
		...overrides,
	};
}

describe('PrettyConsoleBackend', () => {
	test.each([
		{ level: 'error', label: '<red>ERR </red>', message: '<red>message</red>' },
		{ level: 'warn', label: '<yellow>WARN</yellow>', message: '<yellow>message</yellow>' },
		{ level: 'debug', label: '<gray>VERB</gray>', message: '<gray>message</gray>' },
		{ level: 'info', label: '<blue>INFO</blue>', message: 'message' },
	] as const)('formats the $level label and message', ({ level, label, message }) => {
		const output = vi.fn();
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => false });

		backend.write(createRecord({ level }));

		expect(output).toHaveBeenCalledWith(`${label} *\t[<white>root</white>]\t${message}`);
	});

	test('formats legacy success as DONE while retaining the info severity', () => {
		const output = vi.fn();
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => false });

		backend.write(createRecord({
			level: 'info',
			compatibility: { legacyLevel: 'success' },
		}));

		expect(output).toHaveBeenCalledWith('<green>DONE</green> *\t[<white>root</white>]\t<green>message</green>');
	});

	test('formats contexts from root to leaf using their configured colors', () => {
		const output = vi.fn();
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => false });

		backend.write(createRecord({
			context: [
				{ name: 'root', color: 'red' },
				{ name: 'child' },
				{ name: 'leaf', color: 'blue' },
			],
		}));

		expect(output).toHaveBeenCalledWith('<blue>INFO</blue> *\t[<rgb:255,0,0>root</rgb:255,0,0> <white>child</white> <rgb:0,0,255>leaf</rgb:0,0,255>]\tmessage');
	});

	test('prefixes the time derived from the record timestamp when enabled', () => {
		const output = vi.fn();
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => true });

		backend.write(createRecord());

		expect(output).toHaveBeenCalledWith('<gray>03:04:05</gray> <blue>INFO</blue> *\t[<white>root</white>]\tmessage');
	});

	test('uses the worker id for a worker process', () => {
		const output = vi.fn();
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => false });

		backend.write(createRecord({ isPrimary: false, workerId: 7 }));

		expect(output).toHaveBeenCalledWith('<blue>INFO</blue> 7\t[<white>root</white>]\tmessage');
	});

	test('bolds an important record and passes data as the second output argument', () => {
		const output = vi.fn();
		const data = { detail: 'value' };
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => false });

		backend.write(createRecord({
			level: 'error',
			compatibility: { important: true, data },
		}));

		expect(output).toHaveBeenCalledWith(
			'<bold><bgRed.white>ERR </bgRed.white> *\t[<white>root</white>]\t<red>message</red></bold>',
			data,
		);
	});

	test('treats fatal records as important errors', () => {
		const output = vi.fn();
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => false });

		backend.write(createRecord({ level: 'fatal' }));

		expect(output).toHaveBeenCalledWith('<bold><bgRed.white>ERR </bgRed.white> *\t[<white>root</white>]\t<red>message</red></bold>');
	});

	test('omits null data from output arguments', () => {
		const output = vi.fn();
		const backend = new PrettyConsoleBackend({ output, withLogTime: () => false });

		backend.write(createRecord({ compatibility: { data: null } }));

		expect(output).toHaveBeenCalledTimes(1);
		expect(output.mock.calls[0]).toHaveLength(1);
	});
});
