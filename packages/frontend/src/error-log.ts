/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { shallowRef } from 'vue';
import type { App } from 'vue';
import { version } from '@@/js/config.js';
import { miLocalStorage } from '@/local-storage.js';

export type ClientErrorLog = {
	date: string;
	version: string;
	type: 'error' | 'unhandledrejection' | 'vue';
	message: string;
	stack: string;
};

const MAX_ENTRIES = 100;
const MAX_BYTES = 256 * 1024;
const MAX_TEXT = 8192;
export const clientErrorLogs = shallowRef<ClientErrorLog[]>([]);
let recording = false;

// Do not serialize arbitrary rejection objects (which may contain request credentials).
function sanitize(text: string): string {
	return text.replace(/https?:\/\/[^\s)]+/gi, value => {
		try {
			const url = new URL(value);
			return `${url.origin}${url.pathname}`;
		} catch {
			return '[URL]';
		}
	}).replace(/\b(Bearer\s+)\S+/gi, '$1[REDACTED]')
		.replace(/\b(token|password|authorization|cookie|i)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
		.slice(0, MAX_TEXT);
}

function bounded(logs: ClientErrorLog[]): ClientErrorLog[] {
	const result = logs.slice(-MAX_ENTRIES);
	while (result.length > 0 && new TextEncoder().encode(JSON.stringify(result)).length > MAX_BYTES) result.shift();
	return result;
}

export function loadClientErrorLogs(): void {
	try {
		const value: unknown = JSON.parse(miLocalStorage.getItem('clientErrorLogs') ?? '[]');
		clientErrorLogs.value = bounded(Array.isArray(value) ? value.filter((log): log is ClientErrorLog => {
			return log !== null && typeof log === 'object' &&
				['date', 'version', 'message', 'stack'].every(key => typeof log[key] === 'string') &&
				['error', 'unhandledrejection', 'vue'].includes(log.type) && Number.isFinite(Date.parse(log.date));
		}).map(log => ({
			date: log.date, version: sanitize(log.version), type: log.type,
			message: sanitize(log.message), stack: sanitize(log.stack),
		})) : []);
	} catch {
		clientErrorLogs.value = [];
	}
}

export function recordClientError(type: ClientErrorLog['type'], error: unknown): void {
	if (recording) return;
	recording = true;
	try {
		const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Non-Error exception';
		const stack = error instanceof Error ? error.stack ?? '' : '';
		// Read before appending so another tab's most recent logs are retained.
		loadClientErrorLogs();
		clientErrorLogs.value = bounded([...clientErrorLogs.value, {
			date: new Date().toISOString(), version, type,
			message: sanitize(message), stack: sanitize(stack),
		}]);
		try {
			miLocalStorage.setItem('clientErrorLogs', JSON.stringify(clientErrorLogs.value));
		} catch { /* Logging must never interfere with the application. */ }
	} catch { /* Even hostile Error getters must not cause recursive errors. */ } finally {
		recording = false;
	}
}

export function clearClientErrorLogs(): boolean {
	try {
		miLocalStorage.removeItem('clientErrorLogs');
		clientErrorLogs.value = [];
		return true;
	} catch {
		return false;
	}
}

export function initClientErrorLog(): void {
	loadClientErrorLogs();
	window.addEventListener('error', event => recordClientError('error', event.error ?? event.message));
	window.addEventListener('unhandledrejection', event => recordClientError('unhandledrejection', event.reason));
	window.addEventListener('storage', event => {
		if (event.key === 'clientErrorLogs' || event.key === null) loadClientErrorLogs();
	});
}

export function attachClientErrorLog(app: App): void {
	const previous = app.config.errorHandler;
	app.config.errorHandler = (error, instance, info) => {
		recordClientError('vue', error);
		if (previous) previous(error, instance, info);
		else console.error(error);
	};
}
