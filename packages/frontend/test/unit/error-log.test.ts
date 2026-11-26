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

it.each(['token', 'password', 'authorization', 'cookie', 'i'])('redacts quoted JSON key %s', key => {
	const secret = `secret-${key}`;
	for (const message of [JSON.stringify({ [key]: secret }), `{'${key}': '${secret} with spaces'}`, `${key}=${secret}`]) recordClientError('error', new Error(message));
	loadClientErrorLogs();
	expect(JSON.stringify(clientErrorLogs.value)).not.toContain(secret);
	expect(miLocalStorage.getItem('clientErrorLogs')).not.toContain(secret);
	expect(clientErrorLogs.value.every(log => log.message.includes('[REDACTED]'))).toBe(true);
});

it('redacts escaped quoted values and bearer tokens while retaining unrelated fields', () => {
	recordClientError('error', new Error(JSON.stringify({ token: 'a"b secret', password: 'a\\b secret' })));
	recordClientError('error', 'Bearer secret-bearer');
	expect(JSON.stringify(clientErrorLogs.value)).not.toContain('secret');
	expect(clientErrorLogs.value[1].message).toBe('Bearer [REDACTED]');
	const message = '{"userId":"user-123","email":"a@example.test"} hi: foo path/to/user-123';
	recordClientError('error', message);
	expect(clientErrorLogs.value[2].message).toBe(message);
});

it('replaces invalid URLs and bounds long messages', () => {
	recordClientError('error', 'https://[invalid');
	expect(clientErrorLogs.value[0].message).toBe('[URL]');
	recordClientError('error', 'a'.repeat(9_000));
	expect(clientErrorLogs.value[1].message).toHaveLength(8_192);
});

it('keeps distinct stable identifiers for logs generated in the same millisecond', () => {
	vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-10-13T00:00:00.000Z');
	recordClientError('error', 'same'); recordClientError('error', 'same');
	const ids = clientErrorLogs.value.map(log => log.id);
	expect(new Set(ids).size).toBe(2);
	loadClientErrorLogs();
	expect(clientErrorLogs.value.map(log => log.id)).toEqual(ids);
	recordClientError('error', 'new');
	expect(clientErrorLogs.value.slice(0, 2).map(log => log.id)).toEqual(ids);
});

it('migrates old logs and duplicate identifiers without discarding contents', () => {
	const entry = { date: '2026-10-13T00:00:00.000Z', version: '1', type: 'error', message: 'old', stack: '' };
	miLocalStorage.setItem('clientErrorLogs', JSON.stringify([entry, entry])); loadClientErrorLogs();
	const ids = clientErrorLogs.value.map(log => log.id);
	expect(new Set(ids).size).toBe(2);
	loadClientErrorLogs(); expect(clientErrorLogs.value.map(log => log.id)).toEqual(ids);
	miLocalStorage.setItem('clientErrorLogs', JSON.stringify([clientErrorLogs.value[0], clientErrorLogs.value[0]])); loadClientErrorLogs();
	expect(clientErrorLogs.value[0].id).toBe(ids[0]); expect(clientErrorLogs.value[1].id).not.toBe(ids[0]);
});

it('keeps restored logs visible if persisting migrated identifiers fails', () => {
	miLocalStorage.setItem('clientErrorLogs', JSON.stringify([{ date: '2026-10-13T00:00:00.000Z', version: '1', type: 'error', message: 'old', stack: '' }]));
	vi.spyOn(miLocalStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); }); loadClientErrorLogs();
	expect(clientErrorLogs.value[0].message).toBe('old'); expect(clientErrorLogs.value[0].id).toMatch(/^[a-f0-9]{32}$/);
});

it('rejects non-array saved data', () => {
	miLocalStorage.setItem('clientErrorLogs', '{}'); loadClientErrorLogs(); expect(clientErrorLogs.value).toEqual([]);
});

it('avoids recursive logging from Error getters', () => {
	const error = new Error('outer');
	Object.defineProperty(error, 'message', { get: () => { recordClientError('error', 'inner'); return 'outer'; } });
	recordClientError('error', error); expect(clientErrorLogs.value.map(log => log.message)).toEqual(['outer']);
});

it('retains Vue errors in the console without an existing handler', () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
	const app = createApp({}); const error = new Error('vue'); attachClientErrorLog(app); app.config.errorHandler!(error, null, 'test');
	expect(consoleError).toHaveBeenCalledWith(error); expect(clientErrorLogs.value[0].type).toBe('vue');
});

it('records browser source location and synchronizes relevant storage events', () => {
	const addListener = vi.spyOn(window, 'addEventListener').mockImplementation(() => {}); initClientErrorLog();
	const errorHandler = addListener.mock.calls.find(([name]) => name === 'error')![1] as (event: ErrorEvent) => void;
	errorHandler(new ErrorEvent('error', { message: 'Script error.', filename: 'https://example.test/app.js?token=secret', lineno: 12, colno: 34 }));
	expect(clientErrorLogs.value[0].message).toBe('Script error. at https://example.test/app.js:12:34');
	expect(JSON.stringify(clientErrorLogs.value)).not.toContain('secret');
	errorHandler(new ErrorEvent('error', { message: 'No location' })); expect(clientErrorLogs.value[1].message).toBe('No location');
	const storageHandler = addListener.mock.calls.find(([name]) => (name as string) === 'storage')![1] as (event: StorageEvent) => void;
	const getItem = vi.spyOn(miLocalStorage, 'getItem'); storageHandler(new StorageEvent('storage', { key: 'unrelated' })); expect(getItem).not.toHaveBeenCalled();
	storageHandler(new StorageEvent('storage', { key: 'clientErrorLogs' })); expect(getItem).toHaveBeenCalledOnce();
	miLocalStorage.removeItem('clientErrorLogs'); storageHandler(new StorageEvent('storage', { key: null })); expect(clientErrorLogs.value).toEqual([]);
});

it.each([
	'Authorization: Bearer super-secret-token',
	'Authorization: Basic super-secret-token',
	'{"authorization":"Bearer super-secret-token"}',
	"{'authorization': 'Bearer super-secret-token'}",
])('redacts authentication scheme values in %s', message => {
	recordClientError('error', new Error(message));
	expect(JSON.stringify(clientErrorLogs.value)).not.toContain('super-secret-token');
	expect(miLocalStorage.getItem('clientErrorLogs')).not.toContain('super-secret-token');
});

it('records an Error without a stack trace', () => {
	const error = new Error('no stack');
	delete error.stack;
	recordClientError('error', error);
	expect(clientErrorLogs.value[0].stack).toBe('');
});

it.each(['Cookie', 'cookie', 'COOKIE'])('redacts the entire %s header without consuming subsequent lines', header => {
	const error = new Error(`Request failed\n${header}: theme=light; sid=secret-session; csrf=secret-csrf\r\nStatus: 500`);
	recordClientError('error', error);
	loadClientErrorLogs();
	expect(clientErrorLogs.value[0].message).toBe('Request failed\ncookie=[REDACTED]\r\nStatus: 500');
	expect(clientErrorLogs.value[0].stack).toContain('Status: 500');
	for (const secret of ['light', 'secret-session', 'secret-csrf']) {
		expect(JSON.stringify(clientErrorLogs.value)).not.toContain(secret);
		expect(miLocalStorage.getItem('clientErrorLogs')).not.toContain(secret);
	}
});
