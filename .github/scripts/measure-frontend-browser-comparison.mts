/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import * as util from './utility.mts';
import { heapSnapshotCategory, type HeapSnapshotData } from './heap-snapshot-util.mts';

const [baseDirArg, headDirArg, baseOutputArg, headOutputArg, headHeapSnapshotOutputArg] = process.argv.slice(2);

const baseUrl = process.env.FRONTEND_BROWSER_METRICS_URL ?? 'http://127.0.0.1:61812';
const serverReadyTimeoutMs = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SERVER_READY_TIMEOUT_MS', 120_000, 1);
const scenarioTimeoutMs = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SCENARIO_TIMEOUT_MS', 90_000, 1);
const settleMs = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SETTLE_MS', 1_000, 0);
const sampleCount = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SAMPLE_COUNT', 5, 1);
const heapSnapshotBreakdownTopN = util.readIntegerEnv('FRONTEND_BROWSER_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', 8, 1);
const headHeapSnapshotWorkDir = resolve('frontend-browser-head-heap-snapshots');

type ChromeHandle = {
	process: ChildProcessWithoutNullStreams;
	port: number;
	userDataDir: string;
};

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

type NetworkSummary = {
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

type BrowserMeasurement = {
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

type BrowserMeasurementSample = BrowserMeasurement & {
	round: number;
};

type BrowserMetricsReport = {
	label: string;
	timestamp: string;
	url: string;
	scenario: string;
	sampleCount: number;
	aggregation: 'median';
	summary: BrowserMeasurement;
	samples: BrowserMeasurementSample[];
};

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

function sleep(ms: number) {
	return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
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
			await sleep(250);
		}
	}

	throw new Error('Timed out waiting for Chrome DevTools Protocol');
}

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

async function connectPage(port: number) {
	const page = await fetchJson<{ webSocketDebuggerUrl: string }>(
		`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`,
		{ method: 'PUT' },
	).catch(async () => await fetchJson<{ webSocketDebuggerUrl: string }>(
		`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`,
	));
	return await CdpClient.connect(page.webSocketDebuggerUrl);
}

function startServer(label: string, repoDir: string) {
	process.stderr.write(`[${label}] Starting Misskey test server\n`);
	const child = spawn(util.commandName('pnpm'), ['start:test'], {
		cwd: repoDir,
		env: process.env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: process.platform !== 'win32',
	});
	child.stdout.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	child.stderr.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	return child;
}

async function stopServer(child: ChildProcessWithoutNullStreams) {
	if (child.exitCode != null) return;

	if (process.platform === 'win32') {
		spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
	} else if (child.pid != null) {
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {
			child.kill('SIGTERM');
		}
	}

	await new Promise<void>(resolvePromise => {
		if (child.exitCode != null) {
			resolvePromise();
			return;
		}
		child.once('exit', () => resolvePromise());
		setTimeout(() => {
			if (child.pid != null) {
				try {
					if (process.platform === 'win32') {
						spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
					} else {
						process.kill(-child.pid, 'SIGKILL');
					}
				} catch {
					child.kill('SIGKILL');
				}
			}
			resolvePromise();
		}, 10_000).unref();
	});
}

async function waitForServer(child: ChildProcessWithoutNullStreams) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < serverReadyTimeoutMs) {
		if (child.exitCode != null) throw new Error(`Misskey server exited early with code ${child.exitCode}`);
		try {
			const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });
			if (response.status < 500) return;
		} catch {
			// retry
		}
		await sleep(1_000);
	}
	throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function api(endpoint: string, body: Record<string, unknown>) {
	const response = await fetch(`${baseUrl}/api/${endpoint}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new Error(`/api/${endpoint} returned ${response.status}: ${await response.text()}`);
	}
	if (response.status === 204) return null;
	return await response.json();
}

async function prepareInstance() {
	await api('reset-db', {});
	await api('admin/accounts/create', {
		username: 'admin',
		password: 'admin1234',
		setupPassword: 'example_password_please_change_this_or_you_will_get_hacked',
	});
}

function installNetworkTracker(cdp: CdpClient): NetworkRequest[] {
	const requests = new Map<string, NetworkRequest>();
	const requestRows: NetworkRequest[] = [];

	cdp.on('Network.requestWillBeSent', params => {
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
		requestRows.push(row);
	});

	cdp.on('Network.responseReceived', params => {
		const row = requests.get(params.requestId);
		if (row == null) return;
		row.status = params.response?.status;
		row.mimeType = params.response?.mimeType;
		row.fromDiskCache = params.response?.fromDiskCache === true;
		row.fromServiceWorker = params.response?.fromServiceWorker === true;
	});

	cdp.on('Network.dataReceived', params => {
		const row = requests.get(params.requestId);
		if (row == null) return;
		row.decodedBodyLength += params.dataLength ?? 0;
		row.encodedDataLength += params.encodedDataLength ?? 0;
	});

	cdp.on('Network.loadingFinished', params => {
		const row = requests.get(params.requestId);
		if (row == null) return;
		row.finished = true;
		row.encodedDataLength = Math.max(row.encodedDataLength, params.encodedDataLength ?? 0);
	});

	cdp.on('Network.loadingFailed', params => {
		const row = requests.get(params.requestId);
		if (row == null) return;
		row.failed = true;
		row.finished = true;
		row.errorText = params.errorText;
	});

	return requestRows;
}

function isMeasurableRequest(row: NetworkRequest) {
	return !row.url.startsWith('data:') && !row.url.startsWith('blob:') && !row.url.startsWith('devtools:');
}

function summarizeNetwork(requestRows: NetworkRequest[]): NetworkSummary {
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

async function evaluate<T>(cdp: CdpClient, expression: string, timeoutMs = 30_000): Promise<T> {
	const result = await cdp.send<{
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

async function waitForSelector(cdp: CdpClient, selector: string, options: { timeoutMs?: number; visible?: boolean; enabled?: boolean } = {}) {
	const startedAt = Date.now();
	const timeoutMs = options.timeoutMs ?? scenarioTimeoutMs;
	while (Date.now() - startedAt < timeoutMs) {
		const ready = await evaluate<boolean>(cdp, selectorReadyExpression(selector, options), 5_000);
		if (ready) return true;
		await sleep(250);
	}
	return false;
}

async function waitForAnySelector(cdp: CdpClient, selectors: string[], options: { timeoutMs?: number; visible?: boolean; enabled?: boolean } = {}) {
	const startedAt = Date.now();
	const timeoutMs = options.timeoutMs ?? scenarioTimeoutMs;
	while (Date.now() - startedAt < timeoutMs) {
		for (const selector of selectors) {
			const ready = await evaluate<boolean>(cdp, selectorReadyExpression(selector, options), 5_000);
			if (ready) return selector;
		}
		await sleep(250);
	}
	return null;
}

async function click(cdp: CdpClient, selector: string) {
	const found = await waitForSelector(cdp, selector, { visible: true, enabled: true });
	if (!found) throw new Error(`Selector was not clickable: ${selector}`);
	await evaluate<void>(cdp, `(() => {
		const el = document.querySelector(${JSON.stringify(selector)});
		if (el == null) throw new Error('Element not found');
		el.scrollIntoView({ block: 'center', inline: 'center' });
		el.click();
	})()`);
}

async function maybeClick(cdp: CdpClient, selector: string, timeoutMs = 3_000) {
	if (await waitForSelector(cdp, selector, { visible: true, enabled: true, timeoutMs })) {
		await click(cdp, selector);
		return true;
	}
	return false;
}

async function setValue(cdp: CdpClient, selector: string, value: string) {
	const found = await waitForSelector(cdp, selector, { visible: true, enabled: true });
	if (!found) throw new Error(`Selector was not editable: ${selector}`);
	await evaluate<void>(cdp, `(() => {
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

async function waitForText(cdp: CdpClient, text: string, timeoutMs = scenarioTimeoutMs) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < timeoutMs) {
		const found = await evaluate<boolean>(cdp, `document.body?.innerText?.includes(${JSON.stringify(text)}) === true`, 5_000);
		if (found) return true;
		await sleep(250);
	}
	return false;
}

async function runSignupAndPostScenario(cdp: CdpClient) {
	const noteText = `Frontend browser metrics ${Date.now()}`;

	await cdp.send('Page.navigate', { url: `${baseUrl}/` });
	const initialSelector = await waitForAnySelector(cdp, ['[data-cy-signup]', '[data-cy-open-post-form]'], { visible: true, timeoutMs: scenarioTimeoutMs });
	if (initialSelector == null) throw new Error('Timed out waiting for the signup or timeline entry point');

	if (await waitForSelector(cdp, '[data-cy-signup]', { visible: true, enabled: true, timeoutMs: 5_000 })) {
		await click(cdp, '[data-cy-signup]');

		if (await waitForSelector(cdp, '[data-cy-signup-rules-continue]', { visible: true, timeoutMs: 5_000 })) {
			await click(cdp, '[data-cy-signup-rules-notes-agree] [data-cy-switch-toggle]');
			await maybeClick(cdp, '[data-cy-modal-dialog-ok]', 5_000);
			await click(cdp, '[data-cy-signup-rules-continue]');
		}

		await setValue(cdp, '[data-cy-signup-username] input', 'alice');
		await setValue(cdp, '[data-cy-signup-password] input', 'alice1234');
		await setValue(cdp, '[data-cy-signup-password-retype] input', 'alice1234');
		if (await waitForSelector(cdp, '[data-cy-signup-invitation-code] input', { visible: true, enabled: true, timeoutMs: 2_000 })) {
			await setValue(cdp, '[data-cy-signup-invitation-code] input', 'test-invitation-code');
		}
		await click(cdp, '[data-cy-signup-submit]');
	}

	const firstReadySelector = await waitForAnySelector(cdp, [
		'[data-cy-user-setup] [data-cy-modal-window-close]',
		'[data-cy-open-post-form]',
	], { visible: true, enabled: true, timeoutMs: scenarioTimeoutMs });
	if (firstReadySelector == null) throw new Error('Timed out waiting for signed-in home timeline');

	if (firstReadySelector === '[data-cy-user-setup] [data-cy-modal-window-close]') {
		await click(cdp, '[data-cy-user-setup] [data-cy-modal-window-close]');
		await maybeClick(cdp, '[data-cy-modal-dialog-ok]', 5_000);
	}

	await click(cdp, '[data-cy-open-post-form]');
	await setValue(cdp, '[data-cy-post-form-text]', noteText);
	await click(cdp, '[data-cy-open-post-form-submit]');

	if (!await waitForText(cdp, noteText, scenarioTimeoutMs)) {
		throw new Error('The first timeline note did not appear');
	}

	await sleep(settleMs);
}

async function collectPerformance(cdp: CdpClient): Promise<BrowserMeasurement['performance']> {
	const cdpMetricsResult = await cdp.send<{ metrics: { name: string; value: number }[] }>('Performance.getMetrics');
	const cdpMetrics = Object.fromEntries(cdpMetricsResult.metrics.map(metric => [metric.name, metric.value]));
	const runtimeHeap = await cdp.send<{ usedSize: number; totalSize: number }>('Runtime.getHeapUsage').catch(() => undefined);
	const webVitals = await evaluate<BrowserMeasurement['performance']['webVitals']>(cdp, `(() => {
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

function emptyHeapSnapshotData(): HeapSnapshotData {
	const categories = {} as HeapSnapshotData['categories'];
	const nodeCounts = {} as HeapSnapshotData['nodeCounts'];
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		categories[category] = 0;
		nodeCounts[category] = 0;
	}
	return {
		categories,
		nodeCounts,
		breakdowns: {} as HeapSnapshotData['breakdowns'],
	};
}

function categorizeHeapNode(type: string, name: string): keyof typeof heapSnapshotCategory {
	if (/^(ArrayBuffer|SharedArrayBuffer|DataView|(?:Big)?(?:Int|Uint|Float)(?:8|16|32|64)?(?:Clamped)?Array)$/u.test(name)) return 'typedArrays';
	if (type === 'code' || type === 'closure') return 'code';
	if (type === 'string' || type === 'concatenated string' || type === 'sliced string' || type === 'symbol') return 'strings';
	if (type === 'array') return 'jsArrays';
	if (type === 'hidden' || type === 'synthetic' || type === 'object shape') return 'systemObjects';
	if (type === 'native') return 'otherNonJsObjects';
	if (type === 'object' || type === 'regexp' || type === 'number' || type === 'bigint') return 'otherJsObjects';
	return 'otherNonJsObjects';
}

function collapseBreakdown(entries: Map<string, number>) {
	const sorted = [...entries]
		.filter(([, value]) => value > 0)
		.toSorted((a, b) => b[1] - a[1]);
	const topEntries = sorted.slice(0, heapSnapshotBreakdownTopN);
	const otherValue = sorted
		.slice(heapSnapshotBreakdownTopN)
		.reduce((sum, [, value]) => sum + value, 0);
	const collapsed = Object.fromEntries(topEntries);
	if (otherValue > 0) collapsed.Other = otherValue;
	return collapsed;
}

function summarizeHeapSnapshot(snapshot: any): HeapSnapshotData {
	const result = emptyHeapSnapshotData();
	const nodeFields = snapshot.snapshot.meta.node_fields as string[];
	const nodeTypes = snapshot.snapshot.meta.node_types as unknown[][];
	const nodes = snapshot.nodes as number[];
	const strings = snapshot.strings as string[];
	const fieldCount = nodeFields.length;
	const typeOffset = nodeFields.indexOf('type');
	const nameOffset = nodeFields.indexOf('name');
	const selfSizeOffset = nodeFields.indexOf('self_size');
	const typeNames = nodeTypes[typeOffset] as string[];
	const breakdownMaps = {} as Record<keyof typeof heapSnapshotCategory, Map<string, number>>;

	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		if (category !== 'total') breakdownMaps[category] = new Map();
	}

	for (let offset = 0; offset < nodes.length; offset += fieldCount) {
		const type = typeNames[nodes[offset + typeOffset]] ?? 'unknown';
		const name = strings[nodes[offset + nameOffset]] ?? '';
		const selfSize = nodes[offset + selfSizeOffset] ?? 0;
		const category = categorizeHeapNode(type, name);

		result.categories.total += selfSize;
		result.nodeCounts.total += 1;
		result.categories[category] += selfSize;
		result.nodeCounts[category] += 1;

		const label = `${type}: ${name || '(anonymous)'}`;
		breakdownMaps[category].set(label, (breakdownMaps[category].get(label) ?? 0) + selfSize);
	}

	result.breakdowns = {} as HeapSnapshotData['breakdowns'];
	for (const [category, entries] of Object.entries(breakdownMaps) as [keyof typeof heapSnapshotCategory, Map<string, number>][]) {
		const collapsed = collapseBreakdown(entries);
		if (Object.keys(collapsed).length > 0) {
			result.breakdowns[category] = collapsed;
		}
	}

	return result;
}

function finiteMedian(values: (number | null | undefined)[], defaultValue = 0) {
	const finiteValues = values.filter(value => Number.isFinite(value)) as number[];
	if (finiteValues.length === 0) return defaultValue;
	return util.median(finiteValues);
}

function selectRepresentativeSample(samples: BrowserMeasurementSample[], getValue: (sample: BrowserMeasurementSample) => number) {
	const medianValue = finiteMedian(samples.map(getValue));
	let selected: { sample: BrowserMeasurementSample; distance: number } | null = null;

	for (const sample of samples) {
		const value = getValue(sample);
		if (!Number.isFinite(value)) continue;
		const distance = Math.abs(value - medianValue);
		if (selected == null || distance < selected.distance || (distance === selected.distance && sample.round < selected.sample.round)) {
			selected = {
				sample,
				distance,
			};
		}
	}

	return selected?.sample ?? samples[0];
}

function summarizeResourceType(samples: BrowserMeasurementSample[], resourceType: string) {
	return {
		requests: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.requests)),
		encodedBytes: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.encodedBytes)),
		decodedBodyBytes: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.decodedBodyBytes)),
	};
}

function summarizeNetworkSamples(samples: BrowserMeasurementSample[]): NetworkSummary {
	const resourceTypes = new Set<string>();
	for (const sample of samples) {
		for (const resourceType of Object.keys(sample.network.byResourceType)) {
			resourceTypes.add(resourceType);
		}
	}

	const representative = selectRepresentativeSample(samples, sample => sample.network.totalEncodedBytes);
	const byResourceType = {} as NetworkSummary['byResourceType'];
	for (const resourceType of resourceTypes) {
		byResourceType[resourceType] = summarizeResourceType(samples, resourceType);
	}

	return {
		requestCount: finiteMedian(samples.map(sample => sample.network.requestCount)),
		finishedRequestCount: finiteMedian(samples.map(sample => sample.network.finishedRequestCount)),
		failedRequestCount: finiteMedian(samples.map(sample => sample.network.failedRequestCount)),
		cachedRequestCount: finiteMedian(samples.map(sample => sample.network.cachedRequestCount)),
		serviceWorkerRequestCount: finiteMedian(samples.map(sample => sample.network.serviceWorkerRequestCount)),
		totalEncodedBytes: finiteMedian(samples.map(sample => sample.network.totalEncodedBytes)),
		totalDecodedBodyBytes: finiteMedian(samples.map(sample => sample.network.totalDecodedBodyBytes)),
		sameOriginEncodedBytes: finiteMedian(samples.map(sample => sample.network.sameOriginEncodedBytes)),
		thirdPartyEncodedBytes: finiteMedian(samples.map(sample => sample.network.thirdPartyEncodedBytes)),
		byResourceType,
		largestRequests: representative.network.largestRequests,
		failedRequests: representative.network.failedRequests,
	};
}

function summarizePerformanceSamples(samples: BrowserMeasurementSample[]): BrowserMeasurement['performance'] {
	const cdpMetricKeys = new Set<string>();
	for (const sample of samples) {
		for (const key of Object.keys(sample.performance.cdpMetrics)) {
			cdpMetricKeys.add(key);
		}
	}

	const cdpMetrics = {} as Record<string, number>;
	for (const key of cdpMetricKeys) {
		cdpMetrics[key] = finiteMedian(samples.map(sample => sample.performance.cdpMetrics[key]));
	}

	const webVitalKeys = [
		'firstPaintMs',
		'firstContentfulPaintMs',
		'domContentLoadedEventEndMs',
		'loadEventEndMs',
		'longTaskCount',
		'longTaskDurationMs',
		'maxLongTaskDurationMs',
		'resourceEntryCount',
		'domElements',
	] as const satisfies (keyof BrowserMeasurement['performance']['webVitals'])[];

	const webVitals = {} as BrowserMeasurement['performance']['webVitals'];
	for (const key of webVitalKeys) {
		webVitals[key] = finiteMedian(samples.map(sample => sample.performance.webVitals[key]));
	}

	return {
		cdpMetrics,
		runtimeHeap: {
			usedSize: finiteMedian(samples.map(sample => sample.performance.runtimeHeap?.usedSize)),
			totalSize: finiteMedian(samples.map(sample => sample.performance.runtimeHeap?.totalSize)),
		},
		webVitals,
	};
}

function summarizeHeapSnapshotSamples(samples: BrowserMeasurementSample[]) {
	const summary = emptyHeapSnapshotData();

	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		summary.categories[category] = finiteMedian(samples.map(sample => sample.heapSnapshot.categories[category]));
		summary.nodeCounts[category] = finiteMedian(samples.map(sample => sample.heapSnapshot.nodeCounts[category]));
	}

	summary.breakdowns = {} as HeapSnapshotData['breakdowns'];
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		if (category === 'total') continue;

		const childKeys = new Set<string>();
		for (const sample of samples) {
			for (const childKey of Object.keys(sample.heapSnapshot.breakdowns?.[category] ?? {})) {
				childKeys.add(childKey);
			}
		}

		const childValues = new Map<string, number>();
		for (const childKey of childKeys) {
			childValues.set(childKey, finiteMedian(samples.map(sample => sample.heapSnapshot.breakdowns?.[category]?.[childKey])));
		}

		const collapsed = collapseBreakdown(childValues);
		if (Object.keys(collapsed).length > 0) {
			summary.breakdowns[category] = collapsed;
		}
	}

	return summary;
}

function summarizeSamples(label: 'base' | 'head', samples: BrowserMeasurementSample[]): BrowserMetricsReport {
	if (samples.length === 0) throw new Error(`No browser metric samples for ${label}`);
	const representative = selectRepresentativeSample(samples, sample => sample.network.totalEncodedBytes);
	const summary: BrowserMeasurement = {
		label,
		timestamp: new Date().toISOString(),
		url: baseUrl,
		scenario: representative.scenario,
		durationMs: finiteMedian(samples.map(sample => sample.durationMs)),
		network: summarizeNetworkSamples(samples),
		performance: summarizePerformanceSamples(samples),
		heapSnapshot: summarizeHeapSnapshotSamples(samples),
	};

	return {
		label,
		timestamp: new Date().toISOString(),
		url: baseUrl,
		scenario: representative.scenario,
		sampleCount: samples.length,
		aggregation: 'median',
		summary,
		samples,
	};
}

async function takeHeapSnapshot(cdp: CdpClient, savePath?: string) {
	const chunks: string[] = [];
	cdp.on('HeapProfiler.addHeapSnapshotChunk', params => {
		chunks.push(params.chunk);
	});

	await cdp.send('HeapProfiler.enable');
	await cdp.send('HeapProfiler.collectGarbage');
	await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });

	const content = chunks.join('');
	if (savePath != null) {
		await writeFile(savePath, content);
	}

	return summarizeHeapSnapshot(JSON.parse(content));
}

async function measureSample(label: 'base' | 'head', round: number, heapSnapshotSavePath?: string) {
	let chrome: ChromeHandle | null = null;
	let cdp: CdpClient | null = null;

	try {
		await prepareInstance();

		chrome = await launchChrome(label);
		cdp = await connectPage(chrome.port);

		const networkRequests = installNetworkTracker(cdp);
		await cdp.send('Network.enable');
		await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
		await cdp.send('Network.setBypassServiceWorker', { bypass: true });
		await cdp.send('Page.enable');
		await cdp.send('Runtime.enable');
		await cdp.send('Performance.enable');

		const startedAt = Date.now();
		await runSignupAndPostScenario(cdp);
		const durationMs = Date.now() - startedAt;
		const performance = await collectPerformance(cdp);
		const heapSnapshot = await takeHeapSnapshot(cdp, heapSnapshotSavePath);
		const measurement: BrowserMeasurementSample = {
			label,
			round,
			timestamp: new Date().toISOString(),
			url: baseUrl,
			scenario: 'fresh browser signup, first timeline note, after the note becomes visible',
			durationMs,
			network: summarizeNetwork(networkRequests),
			performance,
			heapSnapshot,
		};

		return measurement;
	} finally {
		cdp?.close();
		if (chrome != null) await closeChrome(chrome);
	}
}

function headHeapSnapshotPath(round: number) {
	return join(headHeapSnapshotWorkDir, `round-${round}.heapsnapshot`);
}

async function saveRepresentativeHeadHeapSnapshot(report: BrowserMetricsReport, outputPath: string) {
	const representative = selectRepresentativeSample(report.samples, sample => sample.heapSnapshot.categories.total);
	await copyFile(headHeapSnapshotPath(representative.round), outputPath);
	process.stderr.write(`[head] Selected round ${representative.round} heap snapshot for artifact\n`);
	await rm(headHeapSnapshotWorkDir, { recursive: true, force: true });
}

async function measureRepo(label: 'base' | 'head', repoDir: string, outputPath: string, heapSnapshotSavePath?: string) {
	let server: ChildProcessWithoutNullStreams | null = null;

	try {
		server = startServer(label, repoDir);
		await waitForServer(server);

		if (label === 'head' && heapSnapshotSavePath != null) {
			await rm(headHeapSnapshotWorkDir, { recursive: true, force: true });
			await mkdir(headHeapSnapshotWorkDir, { recursive: true });
		}

		const samples: BrowserMeasurementSample[] = [];
		for (let round = 1; round <= sampleCount; round++) {
			process.stderr.write(`[${label}] Measuring browser metrics sample ${round}/${sampleCount}\n`);
			samples.push(await measureSample(
				label,
				round,
				label === 'head' && heapSnapshotSavePath != null ? headHeapSnapshotPath(round) : undefined,
			));
		}

		const report = summarizeSamples(label, samples);
		await writeFile(outputPath, JSON.stringify(report, null, '\t'));
		process.stderr.write(`[${label}] Wrote browser metrics report to ${outputPath}\n`);

		if (label === 'head' && heapSnapshotSavePath != null) {
			await saveRepresentativeHeadHeapSnapshot(report, heapSnapshotSavePath);
		}
	} finally {
		if (server != null) await stopServer(server);
	}
}

async function main() {
	if (baseDirArg == null || headDirArg == null || baseOutputArg == null || headOutputArg == null) {
		throw new Error('Usage: node measure-frontend-browser-comparison.mts <base-dir> <head-dir> <base-output.json> <head-output.json> [head-heap-snapshot.heapsnapshot]');
	}

	await measureRepo('base', resolve(baseDirArg), resolve(baseOutputArg));
	await measureRepo('head', resolve(headDirArg), resolve(headOutputArg), headHeapSnapshotOutputArg == null ? undefined : resolve(headHeapSnapshotOutputArg));
}

await main();
