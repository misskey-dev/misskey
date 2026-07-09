/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import type { Browser, BrowserContext, CDPSession, Page } from 'playwright';
import type { HeapSnapshotData } from './heap-snapshot-util.mts';

export type NetworkRequest = {
	requestId: string;
	url: string;
	method: string;
	resourceType: string;
	startedAt: number;
	documentUrl?: string;
	requestHeaders?: Record<string, string>;
	requestBody?: string;
	hasRequestBody: boolean;
	status?: number;
	statusText?: string;
	mimeType?: string;
	responseHeaders?: Record<string, string>;
	protocol?: string;
	remoteIPAddress?: string;
	remotePort?: number;
	encodedDataLength: number;
	decodedBodyLength: number;
	fromDiskCache: boolean;
	fromServiceWorker: boolean;
	finished: boolean;
	failed: boolean;
	errorText?: string;
};

export type WebSocketConnection = {
	requestId: string;
	url: string;
	createdAt: number;
	handshakeRequestHeaders?: Record<string, string>;
	handshakeResponseStatus?: number;
	handshakeResponseStatusText?: string;
	handshakeResponseHeaders?: Record<string, string>;
	closedAt?: number;
	sentFrameCount: number;
	receivedFrameCount: number;
	sentBytes: number;
	receivedBytes: number;
	errorCount: number;
};

export type NetworkSummary = {
	requestCount: number;
	webSocketConnectionCount: number;
	webSocketSentBytes: number;
	webSocketReceivedBytes: number;
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

export type TabMemory = {
	totalBytes: number;
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
		tabMemory: TabMemory;
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

type PlaywrightModule = typeof import('playwright');

const requireFromFrontend = createRequire(new URL('../../packages/frontend/package.json', import.meta.url));

function loadPlaywright(): PlaywrightModule {
	return requireFromFrontend('playwright') as PlaywrightModule;
}

function normalizeHeaders(headers: Record<string, unknown> | undefined) {
	if (headers == null) return undefined;
	const normalized = {} as Record<string, string>;
	for (const [key, value] of Object.entries(headers)) {
		normalized[key] = String(value);
	}
	return normalized;
}

function webSocketFramePayloadBytes(frame: { opcode?: number; payloadData?: string } | undefined) {
	if (frame?.payloadData == null) return 0;
	if (frame.opcode === 1) return Buffer.byteLength(frame.payloadData, 'utf8');
	return Buffer.byteLength(frame.payloadData, 'base64');
}

type PlaywrightBrowserOptions = {
	scenarioTimeoutMs: number;
	baseUrl: string;
};

export class HeadlessChromeController {
	public networkRequests: NetworkRequest[] = [];
	public webSocketConnections: WebSocketConnection[] = [];
	private readonly browser: Browser;
	private readonly context: BrowserContext;
	public readonly page: Page;
	private readonly cdp: CDPSession;
	private pendingNetworkDetailReads: Promise<void>[] = [];

	private constructor(
		browser: Browser,
		context: BrowserContext,
		page: Page,
		cdp: CDPSession,
		options: PlaywrightBrowserOptions,
	) {
		this.browser = browser;
		this.context = context;
		this.page = page;
		this.cdp = cdp;
		this.page.setDefaultTimeout(options.scenarioTimeoutMs);
		this.page.setDefaultNavigationTimeout(options.scenarioTimeoutMs);
	}

	static async create(label: string, options: PlaywrightBrowserOptions): Promise<HeadlessChromeController> {
		process.stderr.write(`[${label}] Launching Playwright Chromium\n`);
		const { chromium } = loadPlaywright();
		const browser = await chromium.launch({
			channel: 'chromium',
			headless: true,
			args: [
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
			],
		});

		try {
			const context = await browser.newContext({
				baseURL: options.baseUrl,
				locale: 'en-US',
			});
			await context.addInitScript(() => {
				// @ts-expect-error Test-only runtime hint consumed by Misskey frontend code.
				window.isPlaywright = true;
			});

			const page = await context.newPage();
			const cdp = await context.newCDPSession(page);
			return new HeadlessChromeController(browser, context, page, cdp, options);
		} catch (error) {
			await browser.close().catch(() => undefined);
			throw error;
		}
	}

	static async with<T>(label: string, options: PlaywrightBrowserOptions, callback: (browser: HeadlessChromeController) => T | Promise<T>): Promise<T> {
		const browser = await HeadlessChromeController.create(label, options);
		try {
			return await callback(browser);
		} finally {
			await browser.close();
		}
	}

	public async enableNetworkTracking() {
		const requests = new Map<string, NetworkRequest>();
		const webSockets = new Map<string, WebSocketConnection>();

		const readRequestBody = (row: NetworkRequest) => {
			if (!row.hasRequestBody || row.requestBody != null) return;
			const pending = this.cdp.send<{ postData: string }>('Network.getRequestPostData', {
				requestId: row.requestId,
			}).then(result => {
				row.requestBody = result.postData;
			}).catch(() => {
				// Some requests expose hasPostData but no longer have retrievable body data.
			});
			this.pendingNetworkDetailReads.push(pending);
		};

		this.cdp.on('Network.requestWillBeSent', params => {
			if (params.request?.url == null) return;
			const row: NetworkRequest = {
				requestId: params.requestId,
				url: params.request.url,
				method: params.request.method ?? 'GET',
				resourceType: params.type ?? 'Other',
				startedAt: params.timestamp ?? 0,
				documentUrl: params.documentURL,
				requestHeaders: normalizeHeaders(params.request.headers),
				requestBody: typeof params.request.postData === 'string' ? params.request.postData : undefined,
				hasRequestBody: params.request.hasPostData === true || typeof params.request.postData === 'string',
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

		this.cdp.on('Network.webSocketCreated', params => {
			if (params.requestId == null || params.url == null) return;
			const row: WebSocketConnection = {
				requestId: params.requestId,
				url: params.url,
				createdAt: params.timestamp ?? 0,
				sentFrameCount: 0,
				receivedFrameCount: 0,
				sentBytes: 0,
				receivedBytes: 0,
				errorCount: 0,
			};
			webSockets.set(params.requestId, row);
			this.webSocketConnections.push(row);
		});

		this.cdp.on('Network.webSocketWillSendHandshakeRequest', params => {
			const row = webSockets.get(params.requestId);
			if (row == null) return;
			row.handshakeRequestHeaders = normalizeHeaders(params.request?.headers);
		});

		this.cdp.on('Network.webSocketHandshakeResponseReceived', params => {
			const row = webSockets.get(params.requestId);
			if (row == null) return;
			row.handshakeResponseStatus = params.response?.status;
			row.handshakeResponseStatusText = params.response?.statusText;
			row.handshakeResponseHeaders = normalizeHeaders(params.response?.headers);
		});

		this.cdp.on('Network.webSocketFrameSent', params => {
			const row = webSockets.get(params.requestId);
			if (row == null) return;
			row.sentFrameCount += 1;
			row.sentBytes += webSocketFramePayloadBytes(params.response);
		});

		this.cdp.on('Network.webSocketFrameReceived', params => {
			const row = webSockets.get(params.requestId);
			if (row == null) return;
			row.receivedFrameCount += 1;
			row.receivedBytes += webSocketFramePayloadBytes(params.response);
		});

		this.cdp.on('Network.webSocketFrameError', params => {
			const row = webSockets.get(params.requestId);
			if (row == null) return;
			row.errorCount += 1;
		});

		this.cdp.on('Network.webSocketClosed', params => {
			const row = webSockets.get(params.requestId);
			if (row == null) return;
			row.closedAt = params.timestamp ?? 0;
		});

		this.cdp.on('Network.responseReceived', params => {
			const row = requests.get(params.requestId);
			if (row == null) return;
			row.status = params.response?.status;
			row.statusText = params.response?.statusText;
			row.mimeType = params.response?.mimeType;
			row.responseHeaders = normalizeHeaders(params.response?.headers);
			row.protocol = params.response?.protocol;
			row.remoteIPAddress = params.response?.remoteIPAddress;
			row.remotePort = params.response?.remotePort;
			row.requestHeaders ??= normalizeHeaders(params.response?.requestHeaders);
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
			readRequestBody(row);
		});

		this.cdp.on('Network.loadingFailed', params => {
			const row = requests.get(params.requestId);
			if (row == null) return;
			row.failed = true;
			row.finished = true;
			row.errorText = params.errorText;
			readRequestBody(row);
		});

		await this.cdp.send('Network.enable');
		await this.cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
		await this.cdp.send('Network.setBypassServiceWorker', { bypass: true });
		await this.cdp.send('Page.enable');
		await this.cdp.send('Runtime.enable');
		await this.cdp.send('Performance.enable');
	}

	public async waitForNetworkDetails() {
		let settledCount = 0;
		while (settledCount < this.pendingNetworkDetailReads.length) {
			const pending = this.pendingNetworkDetailReads.slice(settledCount);
			settledCount = this.pendingNetworkDetailReads.length;
			await Promise.allSettled(pending);
		}
	}

	public async evaluate<T>(expression: string, timeoutMs = 30_000): Promise<T> {
		return await Promise.race([
			this.page.evaluate(expression),
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Playwright evaluate timed out after ${timeoutMs}ms`)), timeoutMs).unref()),
		]) as T;
	}

	public async collectPerformance(): Promise<BrowserMeasurement['performance']> {
		const cdpMetricsResult = await this.cdp.send<{ metrics: { name: string; value: number }[] }>('Performance.getMetrics');
		const cdpMetrics = Object.fromEntries(cdpMetricsResult.metrics.map(metric => [metric.name, metric.value]));
		const runtimeHeap = await this.cdp.send<{ usedSize: number; totalSize: number }>('Runtime.getHeapUsage').catch(() => undefined);
		const tabMemory = await this.collectTabMemory();
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
			tabMemory,
			webVitals,
		};
	}

	public async collectTabMemory(): Promise<TabMemory> {
		const userAgentSpecificMemory = await this.evaluate<{ bytes?: number }>(`(async () => {
			const measureMemory = performance.measureUserAgentSpecificMemory;
			if (typeof measureMemory !== 'function') return {};
			const result = await measureMemory.call(performance);
			return { bytes: result.bytes };
		})()`, 60_000);

		const userAgentSpecificBytes = userAgentSpecificMemory?.bytes;
		if (!Number.isFinite(userAgentSpecificBytes)) {
			throw new Error('performance.measureUserAgentSpecificMemory() did not return finite bytes');
		}

		return {
			totalBytes: userAgentSpecificBytes as number,
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
		await this.cdp.detach().catch(() => undefined);
		await this.context.close().catch(() => undefined);
		await this.browser.close().catch(() => undefined);
	}
}

function isMeasurableRequest(row: NetworkRequest) {
	return !row.url.startsWith('data:') && !row.url.startsWith('blob:') && !row.url.startsWith('devtools:');
}

export function summarizeNetwork(requestRows: NetworkRequest[], baseUrl: string, webSocketRows?: WebSocketConnection[]): NetworkSummary {
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
		webSocketConnectionCount: webSocketRows == null
			? rows.filter(row => row.resourceType === 'WebSocket').length
			: webSocketRows.length,
		webSocketSentBytes: webSocketRows?.reduce((sum, row) => sum + row.sentBytes, 0) ?? 0,
		webSocketReceivedBytes: webSocketRows?.reduce((sum, row) => sum + row.receivedBytes, 0) ?? 0,
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
