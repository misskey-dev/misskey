/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { shallowRef } from 'vue';
import type { App } from 'vue';
import { version } from '@@/js/config.js';
import { miLocalStorage } from '@/local-storage.js';

export type ClientErrorLog = {
	id: string;
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

/** Removes URL credentials and authentication values before logs are saved or copied. */
function sanitize(text: string): string {
	return text.replace(/https?:\/\/[^\s)]+/gi, value => {
		try {
			const url = new URL(value);
			return `${url.origin}${url.pathname}`;
		} catch {
			return '[URL]';
		}
	}).replace(/\b(Bearer\s+)[^\s"',;}]+/gi, '$1[REDACTED]')
		.replace(/(["']?)\b(token|password|authorization|cookie|i)\1\s*[:=]\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:Bearer|Basic)\s+[^\s,;}]+|[^\s,;}]+)/gi, '$2=[REDACTED]')
		.slice(0, MAX_TEXT);
}

/** Keeps the newest entries within both the count and serialized UTF-8 byte limits. */
function bounded(logs: ClientErrorLog[]): ClientErrorLog[] {
	const result = logs.slice(-MAX_ENTRIES);
	while (result.length > 0 && new TextEncoder().encode(JSON.stringify(result)).length > MAX_BYTES) result.shift();
	return result;
}

/** Generates a persistent identifier even in HTTP development environments. */
function createLogId(): string {
	return [...crypto.getRandomValues(new Uint8Array(16))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Restores validated logs and persists identifiers for entries saved by older clients. */
export function loadClientErrorLogs(): void {
	try {
		const value: unknown = JSON.parse(miLocalStorage.getItem('clientErrorLogs') ?? '[]');
		let migrated = false;
		const ids = new Set<string>();
		clientErrorLogs.value = bounded(Array.isArray(value) ? value.filter((log): log is Omit<ClientErrorLog, 'id'> & { id?: unknown } => {
			return log !== null && typeof log === 'object' &&
				['date', 'version', 'message', 'stack'].every(key => typeof log[key] === 'string') &&
				['error', 'unhandledrejection', 'vue'].includes(log.type) && Number.isFinite(Date.parse(log.date));
		}).map(log => {
			const savedId = log.id;
			const id = typeof savedId === 'string' && /^[a-f0-9]{32}$/.test(savedId) && !ids.has(savedId) ? savedId : createLogId();
			if (id !== savedId) migrated = true;
			ids.add(id);
			return {
				id, date: log.date, version: sanitize(log.version), type: log.type,
				message: sanitize(log.message), stack: sanitize(log.stack),
			};
		}) : []);
		if (migrated) {
			try {
				miLocalStorage.setItem('clientErrorLogs', JSON.stringify(clientErrorLogs.value));
			} catch { /* Keep restored logs available even when migration cannot be saved. */ }
		}
	} catch {
		clientErrorLogs.value = [];
	}
}

/** Records only safe error fields without letting storage or hostile getters interrupt the app. */
export function recordClientError(type: ClientErrorLog['type'], error: unknown): void {
	if (recording) return;
	recording = true;
	try {
		const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Non-Error exception';
		const stack = error instanceof Error ? error.stack ?? '' : '';
		// Read before appending so another tab's most recent logs are retained.
		loadClientErrorLogs();
		clientErrorLogs.value = bounded([...clientErrorLogs.value, {
			id: createLogId(), date: new Date().toISOString(), version, type,
			message: sanitize(message), stack: sanitize(stack),
		}]);
		try {
			miLocalStorage.setItem('clientErrorLogs', JSON.stringify(clientErrorLogs.value));
		} catch { /* Logging must never interfere with the application. */ }
	} catch { /* Even hostile Error getters must not cause recursive errors. */ } finally {
		recording = false;
	}
}

/** Deletes persisted logs, reporting failure without clearing the visible entries. */
export function clearClientErrorLogs(): boolean {
	try {
		miLocalStorage.removeItem('clientErrorLogs');
		clientErrorLogs.value = [];
		return true;
	} catch {
		return false;
	}
}

/** Subscribes to browser errors and cross-tab log changes. */
export function initClientErrorLog(): void {
	loadClientErrorLogs();
	window.addEventListener('error', event => {
		if (event.error instanceof Error) {
			recordClientError('error', event.error);
		} else {
			const location = event.filename ? ` at ${sanitize(event.filename)}:${event.lineno}:${event.colno}` : '';
			recordClientError('error', `${event.message}${location}`);
		}
	});
	window.addEventListener('unhandledrejection', event => recordClientError('unhandledrejection', event.reason));
	window.addEventListener('storage', event => {
		if (event.key === 'clientErrorLogs' || event.key === null) loadClientErrorLogs();
	});
}

/** Records Vue errors while preserving the handler installed by telemetry or other integrations. */
export function attachClientErrorLog(app: App): void {
	const previous = app.config.errorHandler;
	app.config.errorHandler = (error, instance, info) => {
		recordClientError('vue', error);
		if (previous) previous(error, instance, info);
		else console.error(error);
	};
}
