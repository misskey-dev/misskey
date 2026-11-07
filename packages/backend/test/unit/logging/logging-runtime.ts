/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, test, vi } from 'vitest';
import { JsonConsoleBackend } from '@/logging/JsonConsoleBackend.js';
import { logManager, configureLogging } from '@/logging/logging-runtime.js';
import { PrettyConsoleBackend } from '@/logging/PrettyConsoleBackend.js';

describe('logging-runtime', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('uses Pretty backend when the format is omitted', () => {
		const setBackend = vi.spyOn(logManager, 'setBackend');

		configureLogging();

		expect(setBackend).toHaveBeenCalledWith(expect.any(PrettyConsoleBackend));
	});

	test('uses JSON backend when the format is json', () => {
		const setBackend = vi.spyOn(logManager, 'setBackend');

		configureLogging({ format: 'json' });

		expect(setBackend).toHaveBeenCalledWith(expect.any(JsonConsoleBackend));
	});

	test('rejects an unknown format before changing logging configuration', () => {
		const setBackend = vi.spyOn(logManager, 'setBackend');
		const configure = vi.spyOn(logManager, 'configure');

		expect(() => configureLogging({ format: 'xml' as never })).toThrow('logging.format');
		expect(setBackend).not.toHaveBeenCalled();
		expect(configure).not.toHaveBeenCalled();
	});
});
