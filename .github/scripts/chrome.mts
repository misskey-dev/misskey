/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import * as util from './utility.mts';
import type { HeapSnapshotData } from './heap-snapshot-util.mts';

type ChromeHandle = {
	process: ChildProcessWithoutNullStreams;
	port: number;
	userDataDir: string;
};

type NetworkRequest = {
	requestId: string;
	url: string;
	method: string;
	resourceType: string;
	startedAt: number;
	status?: number;
	mimeType?: string;
	encodedDataLength: number;
	decodedBodyLength: number;
	fromDiskCache: boolean;
	fromServiceWorker: boolean;
	finished: boolean;
	failed: boolean;
	errorText?: string;
};

export type NetworkSummary = {
	requestCount: number;
	finishedRequestCount: number;
	failedRequestCount: number;
	cachedRequestCount: number;
	serviceWorkerRequestCount: number;
	totalEncodedBytes: number;
	totalDecodedBodyBytes: number;
	sameOriginEncodedBytes: number;
	thirdPartyEncodedBytes: number;
	byResourceType: Record<string, {
		requests: number;
		encodedBytes: number;
		decodedBodyBytes: number;
	}>;
	largestRequests: {
		url: string;
		method: string;
		resourceType: string;
		status?: number;
		encodedBytes: number;
		decodedBodyBytes: number;
	}[];
	failedRequests: {
		url: string;
		method: string;
		resourceType: string;
		errorText?: string;
		status?: number;
	}[];
};

export type BrowserMeasurement = {
	label: string;
	timestamp: string;
	url: string;
	scenario: string;
	durationMs: number;
	network: NetworkSummary;
	performance: {
		cdpMetrics: Record<string, number>;
		runtimeHeap?: {
			usedSize: number;
			totalSize: number;
		};
		webVitals: {
			firstPaintMs?: number;
			firstContentfulPaintMs?: number;
			domContentLoadedEventEndMs?: number;
			loadEventEndMs?: number;
			longTaskCount: number;
			longTaskDurationMs: number;
			maxLongTaskDurationMs: number;
			resourceEntryCount: number;
			domElements: number;
		};
	};
	heapSnapshot: HeapSnapshotData;
};

async function waitForProcessExit(child: ChildProcessWithoutNullStreams) {
	await new Promise<void>(resolvePromise => {
		if (child.exitCode != null) {
			resolvePromise();
			return;
		}
		const killTimer = setTimeout(() => {
			child.kill('SIGKILL');
			resolvePromise();
		}, 5_000).unref();
		child.once('exit', () => {
			clearTimeout(killTimer);
			resolvePromise();
		});
	});
}

async function fetchJson<T>(url: string, options?: RequestInit) {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(`${url} returned ${response.status}: ${await response.text()}`);
	}
	return await response.json() as T;
}

function findChrome() {
	const envChrome = process.env.CHROME_BIN ?? process.env.GOOGLE_CHROME_BIN;
	if (envChrome != null && envChrome !== '') return envChrome;

	const candidates = process.platform === 'win32'
		? [
			'chrome.exe',
			'msedge.exe',
		]
		: [
			'google-chrome',
			'google-chrome-stable',
			'chromium',
			'chromium-browser',
		];

	for (const candidate of candidates) {
		const result = spawnSync(candidate, ['--version'], {
			stdio: 'ignore',
			shell: process.platform === 'win32',
		});
		if (result.status === 0) return candidate;
	}

	throw new Error('Could not find Chrome or Chromium. Set CHROME_BIN to the browser executable.');
}

async function launchChrome(label: string): Promise<ChromeHandle> {
	const chrome = findChrome();
	const port = label === 'base' ? 9222 : 9223;
	const userDataDir = await mkdtemp(join(tmpdir(), `misskey-browser-metrics-${label}-`));
	const child = spawn(chrome, [
		'--headless=new',
		'--disable-gpu',
		'--disable-dev-shm-usage',
		'--disable-background-networking',
		'--disable-default-apps',
		'--disable-extensions',
		'--disable-sync',
		'--metrics-recording-only',
		'--no-first-run',
		'--no-default-browser-check',
		'--no-sandbox',
		`--remote-debugging-port=${port}`,
		`--user-data-dir=${userDataDir}`,
		'about:blank',
	], {
		stdio: ['ignore', 'pipe', 'pipe'],
	});

	child.stdout.on('data', data => process.stderr.write(`[chrome:${label}] ${data}`));
	child.stderr.on('data', data => process.stderr.write(`[chrome:${label}] ${data}`));

	try {
		const startedAt = Date.now();
		while (Date.now() - startedAt < 30_000) {
			if (child.exitCode != null) throw new Error(`Chrome exited early with code ${child.exitCode}`);
			try {
				await fetchJson(`http://127.0.0.1:${port}/json/version`);
				return {
					process: child,
					port,
					userDataDir,
				};
			} catch {
				await util.sleep(250);
			}
		}

		throw new Error('Timed out waiting for Chrome DevTools Protocol');
	} catch (err) {
		await closeChrome({
			process: child,
			port,
			userDataDir,
		});
		throw err;
	}
}

async function closeChrome(handle: ChromeHandle) {
	if (handle.process.exitCode == null) {
		handle.process.kill();
	}
	await waitForProcessExit(handle.process);
	await rm(handle.userDataDir, {
		recursive: true,
		force: true,
		maxRetries: 10,
		retryDelay: 200,
	});
}

type CdpResponse<T = any> = {
	id?: number;
	method?: string;
	params?: any;
	result?: T;
	error?: {
		code: number;
		message: string;
	};
};

function selectorReadyExpression(selector: string, options: { visible?: boolean; enabled?: boolean } = {}) {
	return `(() => {
		const el = document.querySelector(${JSON.stringify(selector)});
		if (el == null) return false;
		const style = window.getComputedStyle(el);
		const rect = el.getBoundingClientRect();
		if (${options.visible === true ? 'true' : 'false'} && (style.visibility === 'hidden' || style.display === 'none' || rect.width === 0 || rect.height === 0)) return false;
		if (${options.enabled === true ? 'true' : 'false'} && (el.disabled || el.getAttribute('aria-disabled') === 'true')) return false;
		return true;
	})()`;
}

class CdpClient {
	private nextId = 1;
	private callbacks = new Map<number, {
		resolve: (value: any) => void;
		reject: (error: Error) => void;
	}>();
	private eventHandlers = new Map<string, Set<(params: any) => void>>();
	private ws: WebSocket;

	private constructor(ws: WebSocket) {
		this.ws = ws;
		ws.addEventListener('message', event => {
			const message = JSON.parse(String(event.data)) as CdpResponse;
			if (message.id != null) {
				const callback = this.callbacks.get(message.id);
				if (callback == null) return;
				this.callbacks.delete(message.id);
				if (message.error != null) {
					callback.reject(new Error(`${message.error.message} (${message.error.code})`));
				} else {
					callback.resolve(message.result);
				}
				return;
			}

			if (message.method != null) {
				for (const handler of this.eventHandlers.get(message.method) ?? []) {
					handler(message.params);
				}
			}
		});

		ws.addEventListener('close', () => {
			for (const callback of this.callbacks.values()) {
				callback.reject(new Error('CDP websocket closed'));
			}
			this.callbacks.clear();
		});
	}

	static async connect(wsUrl: string) {
		const ws = new WebSocket(wsUrl);
		await new Promise<void>((resolvePromise, reject) => {
			ws.addEventListener('open', () => resolvePromise(), { once: true });
			ws.addEventListener('error', () => reject(new Error(`Failed to connect to ${wsUrl}`)), { once: true });
		});
		return new CdpClient(ws);
	}

	on(method: string, handler: (params: any) => void) {
		const handlers = this.eventHandlers.get(method) ?? new Set();
		handlers.add(handler);
		this.eventHandlers.set(method, handlers);
	}

	send<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T> {
		const id = this.nextId++;
		this.ws.send(JSON.stringify({ id, method, params }));

		return new Promise<T>((resolvePromise, reject) => {
			this.callbacks.set(id, {
				resolve: resolvePromise,
				reject,
			});
		});
	}

	close() {
		this.ws.close();
	}
}

type ChromeOptions = {
	scenarioTimeoutMs: number;
};

export class Chrome {
	private handle: ChromeHandle;
	public cdp: CdpClient;
	public networkRequests: NetworkRequest[] = [];
	private scenarioTimeoutMs: number;

	constructor(handle: ChromeHandle, cdpClient: CdpClient, options: ChromeOptions) {
		this.handle = handle;
		this.cdp = cdpClient;
		this.scenarioTimeoutMs = options.scenarioTimeoutMs;
	}

	static async create(label: string, options: ChromeOptions): Promise<Chrome> {
		const chromeHandle = await launchChrome(label);
		try {
			const url = await fetchJson<{ webSocketDebuggerUrl: string }>(
				`http://127.0.0.1:${chromeHandle.port}/json/new?${encodeURIComponent('about:blank')}`,
				{ method: 'PUT' },
			).catch(async () => await fetchJson<{ webSocketDebuggerUrl: string }>(
				`http://127.0.0.1:${chromeHandle.port}/json/new?${encodeURIComponent('about:blank')}`,
			));
			const cdpClient = await CdpClient.connect(url.webSocketDebuggerUrl);
			return new Chrome(chromeHandle, cdpClient, options);
		} catch (err) {
			await closeChrome(chromeHandle);
			throw err;
		}
	}

	static async with<T>(label: string, options: ChromeOptions, callback: (chrome: Chrome) => T | Promise<T>): Promise<T> {
		const chrome = await Chrome.create(label, options);
		try {
			return await callback(chrome);
		} finally {
			await chrome.close();
		}
	}

	public async enableNetworkTracking() {
		const requests = new Map<string, NetworkRequest>();

		this.cdp.on('Network.requestWillBeSent', params => {
			if (params.request?.url == null) return;
			const row: NetworkRequest = {
				requestId: params.requestId,
				url: params.request.url,
				method: params.request.method ?? 'GET',
				resourceType: params.type ?? 'Other',
				startedAt: params.timestamp ?? 0,
				encodedDataLength: 0,
				decodedBodyLength: 0,
				fromDiskCache: false,
				fromServiceWorker: false,
				finished: false,
				failed: false,
			};
			requests.set(params.requestId, row);
			this.networkRequests.push(row);
		});

		this.cdp.on('Network.responseReceived', params => {
			const row = requests.get(params.requestId);
			if (row == null) return;
			row.status = params.response?.status;
			row.mimeType = params.response?.mimeType;
			row.fromDiskCache = params.response?.fromDiskCache === true;
			row.fromServiceWorker = params.response?.fromServiceWorker === true;
		});

		this.cdp.on('Network.dataReceived', params => {
			const row = requests.get(params.requestId);
			if (row == null) return;
			row.decodedBodyLength += params.dataLength ?? 0;
			row.encodedDataLength += params.encodedDataLength ?? 0;
		});

		this.cdp.on('Network.loadingFinished', params => {
			const row = requests.get(params.requestId);
			if (row == null) return;
			row.finished = true;
			row.encodedDataLength = Math.max(row.encodedDataLength, params.encodedDataLength ?? 0);
		});

		this.cdp.on('Network.loadingFailed', params => {
			const row = requests.get(params.requestId);
			if (row == null) return;
			row.failed = true;
			row.finished = true;
			row.errorText = params.errorText;
		});

		await this.cdp.send('Network.enable');
		await this.cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
		await this.cdp.send('Network.setBypassServiceWorker', { bypass: true });
		await this.cdp.send('Page.enable');
		await this.cdp.send('Runtime.enable');
		await this.cdp.send('Performance.enable');
	}

	public async evaluate<T>(expression: string, timeoutMs = 30_000): Promise<T> {
		const result = await this.cdp.send<{
			result: { value: T };
			exceptionDetails?: unknown;
		}>('Runtime.evaluate', {
			expression,
			awaitPromise: true,
			returnByValue: true,
			timeout: timeoutMs,
		});

		if (result.exceptionDetails != null) {
			throw new Error(`Runtime.evaluate failed: ${JSON.stringify(result.exceptionDetails)}`);
		}

		return result.result.value;
	}

	public async waitForSelector(selector: string, options: { timeoutMs?: number; visible?: boolean; enabled?: boolean } = {}) {
		const startedAt = Date.now();
		const timeoutMs = options.timeoutMs ?? this.scenarioTimeoutMs;
		while (Date.now() - startedAt < timeoutMs) {
			const ready = await this.evaluate<boolean>(selectorReadyExpression(selector, options), 5_000);
			if (ready) return true;
			await util.sleep(250);
		}
		return false;
	}

	public async waitForAnySelector(selectors: string[], options: { timeoutMs?: number; visible?: boolean; enabled?: boolean } = {}) {
		const startedAt = Date.now();
		const timeoutMs = options.timeoutMs ?? this.scenarioTimeoutMs;
		while (Date.now() - startedAt < timeoutMs) {
			for (const selector of selectors) {
				const ready = await this.evaluate<boolean>(selectorReadyExpression(selector, options), 5_000);
				if (ready) return selector;
			}
			await util.sleep(250);
		}
		return null;
	}

	public async click(selector: string) {
		const found = await this.waitForSelector(selector, { visible: true, enabled: true });
		if (!found) throw new Error(`Selector was not clickable: ${selector}`);
		await this.evaluate<void>(`(() => {
			const el = document.querySelector(${JSON.stringify(selector)});
			if (el == null) throw new Error('Element not found');
			el.scrollIntoView({ block: 'center', inline: 'center' });
			el.click();
		})()`);
	}

	public async maybeClick(selector: string, timeoutMs = 3_000) {
		if (await this.waitForSelector(selector, { visible: true, enabled: true, timeoutMs })) {
			await this.click(selector);
			return true;
		}
		return false;
	}

	public async setValue(selector: string, value: string) {
		const found = await this.waitForSelector(selector, { visible: true, enabled: true });
		if (!found) throw new Error(`Selector was not editable: ${selector}`);
		await this.evaluate<void>(`(() => {
			const el = document.querySelector(${JSON.stringify(selector)});
			if (el == null) throw new Error('Element not found');
			el.scrollIntoView({ block: 'center', inline: 'center' });
			el.focus();
			const proto = Object.getPrototypeOf(el);
			const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
			if (descriptor?.set != null) {
				descriptor.set.call(el, ${JSON.stringify(value)});
			} else {
				el.value = ${JSON.stringify(value)};
			}
			el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(value)} }));
			el.dispatchEvent(new Event('change', { bubbles: true }));
		})()`);
	}

	public async waitForText(text: string, timeoutMs = this.scenarioTimeoutMs) {
		const startedAt = Date.now();
		while (Date.now() - startedAt < timeoutMs) {
			const found = await this.evaluate<boolean>(`document.body?.innerText?.includes(${JSON.stringify(text)}) === true`, 5_000);
			if (found) return true;
			await util.sleep(250);
		}
		return false;
	}

	public async collectPerformance(): Promise<BrowserMeasurement['performance']> {
		const cdpMetricsResult = await this.cdp.send<{ metrics: { name: string; value: number }[] }>('Performance.getMetrics');
		const cdpMetrics = Object.fromEntries(cdpMetricsResult.metrics.map(metric => [metric.name, metric.value]));
		const runtimeHeap = await this.cdp.send<{ usedSize: number; totalSize: number }>('Runtime.getHeapUsage').catch(() => undefined);
		const webVitals = await this.evaluate<BrowserMeasurement['performance']['webVitals']>(`(() => {
			const navigation = performance.getEntriesByType('navigation')[0];
			const paintEntries = Object.fromEntries(performance.getEntriesByType('paint').map(entry => [entry.name, entry.startTime]));
			const longTasks = performance.getEntriesByType('longtask');
			const resourceEntries = performance.getEntriesByType('resource');
			return {
				firstPaintMs: paintEntries['first-paint'],
				firstContentfulPaintMs: paintEntries['first-contentful-paint'],
				domContentLoadedEventEndMs: navigation?.domContentLoadedEventEnd,
				loadEventEndMs: navigation?.loadEventEnd,
				longTaskCount: longTasks.length,
				longTaskDurationMs: longTasks.reduce((sum, entry) => sum + entry.duration, 0),
				maxLongTaskDurationMs: longTasks.reduce((max, entry) => Math.max(max, entry.duration), 0),
				resourceEntryCount: resourceEntries.length,
				domElements: document.getElementsByTagName('*').length,
			};
		})()`);

		return {
			cdpMetrics,
			runtimeHeap,
			webVitals,
		};
	}

	public async takeHeapSnapshot(savePath?: string) {
		const chunks: string[] = [];
		this.cdp.on('HeapProfiler.addHeapSnapshotChunk', params => {
			chunks.push(params.chunk);
		});

		await this.cdp.send('HeapProfiler.enable');
		await this.cdp.send('HeapProfiler.collectGarbage');
		await this.cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });

		const content = chunks.join('');
		if (savePath != null) {
			await writeFile(savePath, content);
		}

		return JSON.parse(content);
	}

	public async close() {
		this.cdp.close();
		await closeChrome(this.handle);
	}
}

function isMeasurableRequest(row: NetworkRequest) {
	return !row.url.startsWith('data:') && !row.url.startsWith('blob:') && !row.url.startsWith('devtools:');
}

export function summarizeNetwork(requestRows: NetworkRequest[], baseUrl: string): NetworkSummary {
	const origin = new URL(baseUrl).origin;
	const rows = requestRows.filter(isMeasurableRequest);
	const byResourceType = {} as NetworkSummary['byResourceType'];

	for (const row of rows) {
		const summary = byResourceType[row.resourceType] ?? {
			requests: 0,
			encodedBytes: 0,
			decodedBodyBytes: 0,
		};
		summary.requests += 1;
		summary.encodedBytes += row.encodedDataLength;
		summary.decodedBodyBytes += row.decodedBodyLength;
		byResourceType[row.resourceType] = summary;
	}

	function isSameOrigin(url: string) {
		try {
			return new URL(url).origin === origin;
		} catch {
			return false;
		}
	}

	return {
		requestCount: rows.length,
		finishedRequestCount: rows.filter(row => row.finished).length,
		failedRequestCount: rows.filter(row => row.failed).length,
		cachedRequestCount: rows.filter(row => row.fromDiskCache).length,
		serviceWorkerRequestCount: rows.filter(row => row.fromServiceWorker).length,
		totalEncodedBytes: rows.reduce((sum, row) => sum + row.encodedDataLength, 0),
		totalDecodedBodyBytes: rows.reduce((sum, row) => sum + row.decodedBodyLength, 0),
		sameOriginEncodedBytes: rows
			.filter(row => isSameOrigin(row.url))
			.reduce((sum, row) => sum + row.encodedDataLength, 0),
		thirdPartyEncodedBytes: rows
			.filter(row => !isSameOrigin(row.url))
			.reduce((sum, row) => sum + row.encodedDataLength, 0),
		byResourceType,
		largestRequests: rows
			.toSorted((a, b) => b.encodedDataLength - a.encodedDataLength)
			.slice(0, 15)
			.map(row => ({
				url: row.url,
				method: row.method,
				resourceType: row.resourceType,
				status: row.status,
				encodedBytes: row.encodedDataLength,
				decodedBodyBytes: row.decodedBodyLength,
			})),
		failedRequests: rows
			.filter(row => row.failed)
			.map(row => ({
				url: row.url,
				method: row.method,
				resourceType: row.resourceType,
				errorText: row.errorText,
				status: row.status,
			})),
	};
}
