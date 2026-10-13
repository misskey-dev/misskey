/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { attachClientErrorLog, clearClientErrorLogs, clientErrorLogs, initClientErrorLog, loadClientErrorLogs, recordClientError } from '@/error-log.js';
import { miLocalStorage } from '@/local-storage.js';

beforeEach(() => {
	vi.restoreAllMocks();
	clearClientErrorLogs();
});

describe('client error logs', () => {
	it('persists and restores errors without URL credentials or query parameters', () => {
		recordClientError('error', new Error('Failed https://user:secret@example.com/path?token=secret#private password=hidden'));
		clientErrorLogs.value = [];
		loadClientErrorLogs();
		expect(clientErrorLogs.value).toHaveLength(1);
		expect(clientErrorLogs.value[0].message).toBe('Failed https://example.com/path password=[REDACTED]');
		expect(JSON.stringify(clientErrorLogs.value)).not.toContain('secret');
	});

	it('retains the latest 100 entries within the byte limit', () => {
		for (let i = 0; i < 110; i++) recordClientError('error', String(i));
		expect(clientErrorLogs.value).toHaveLength(100);
		expect(clientErrorLogs.value[0].message).toBe('10');
		for (let i = 0; i < 100; i++) recordClientError('error', 'あ'.repeat(8192));
		expect(new TextEncoder().encode(miLocalStorage.getItem('clientErrorLogs')!).length).toBeLessThanOrEqual(256 * 1024);
	});

	it('discards malformed stored data and never serializes arbitrary objects', () => {
		miLocalStorage.setItem('clientErrorLogs', '[null, {}, 1]');
		loadClientErrorLogs();
		expect(clientErrorLogs.value).toEqual([]);
		miLocalStorage.setItem('clientErrorLogs', '{');
		recordClientError('unhandledrejection', { token: 'secret', toString: () => { throw new Error(); } });
		expect(clientErrorLogs.value[0].message).toBe('Non-Error exception');
	});

	it('does not throw when storage or Error getters fail', () => {
		vi.spyOn(miLocalStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
		expect(() => recordClientError('error', 'failure')).not.toThrow();
		vi.spyOn(miLocalStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
		expect(() => recordClientError('error', 'failure')).not.toThrow();
		const error = new Error();
		Object.defineProperty(error, 'message', { get: () => { throw new Error(); } });
		expect(() => recordClientError('error', error)).not.toThrow();
	});

	it('reports deletion failure without losing the displayed logs', () => {
		recordClientError('error', 'test');
		vi.spyOn(miLocalStorage, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
		expect(clearClientErrorLogs()).toBe(false);
		expect(clientErrorLogs.value).toHaveLength(1);
	});

	it('clears persisted entries', () => {
		recordClientError('error', 'test');
		expect(clearClientErrorLogs()).toBe(true);
		loadClientErrorLogs();
		expect(clientErrorLogs.value).toEqual([]);
	});

	it('captures browser errors and preserves existing Vue handlers', () => {
		initClientErrorLog();
		window.dispatchEvent(new ErrorEvent('error', { error: new Error('browser') }));
		const rejection = new Event('unhandledrejection');
		Object.defineProperty(rejection, 'reason', { value: new Error('promise') });
		window.dispatchEvent(rejection);
		const app = createApp({});
		const handler = vi.fn();
		app.config.errorHandler = handler;
		attachClientErrorLog(app);
		app.config.errorHandler!(new Error('vue'), null, 'test');
		expect(handler).toHaveBeenCalledOnce();
		expect(clientErrorLogs.value.map(log => log.type)).toEqual(['error', 'unhandledrejection', 'vue']);
	});
});
