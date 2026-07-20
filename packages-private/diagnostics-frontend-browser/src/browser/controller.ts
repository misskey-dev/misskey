/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import type { Browser, BrowserContext, CDPSession, Page } from 'playwright';
import { enableNetworkTracking, type NetworkTracker } from './network';
import type { BrowserDiagnostics, BrowserMeasurement, NetworkRequest, TabMemory, WebSocketConnection } from '../types';

export type HeadlessChromeOptions = {
	scenarioTimeoutMs: number;
	baseUrl: string;
};

export class HeadlessChromeController {
	private readonly diagnostics = {
		pageErrorCount: 0,
		console: {} as Record<string, number | undefined>,
	};
	private readonly browser: Browser;
	private readonly context: BrowserContext;
	public readonly page: Page;
	private readonly cdp: CDPSession;
	private networkTracker: NetworkTracker | null = null;

	private constructor(
		browser: Browser,
		context: BrowserContext,
		page: Page,
		cdp: CDPSession,
		options: HeadlessChromeOptions,
	) {
		this.browser = browser;
		this.context = context;
		this.page = page;
		this.cdp = cdp;
		this.page.setDefaultTimeout(options.scenarioTimeoutMs);
		this.page.setDefaultNavigationTimeout(options.scenarioTimeoutMs);
		this.page.on('pageerror', () => {
			this.diagnostics.pageErrorCount++;
		});
		this.page.on('console', message => {
			const type = message.type();
			this.diagnostics.console[type] = (this.diagnostics.console[type] ?? 0) + 1;
		});
	}

	public get networkRequests(): NetworkRequest[] {
		return this.networkTracker?.networkRequests ?? [];
	}

	public get webSocketConnections(): WebSocketConnection[] {
		return this.networkTracker?.webSocketConnections ?? [];
	}

	static async create(label: string, options: HeadlessChromeOptions): Promise<HeadlessChromeController> {
		process.stderr.write(`[${label}] Launching Playwright Chromium\n`);
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

	static async with<T>(label: string, options: HeadlessChromeOptions, callback: (browser: HeadlessChromeController) => T | Promise<T>): Promise<T> {
		const browser = await HeadlessChromeController.create(label, options);
		try {
			return await callback(browser);
		} finally {
			await browser.close();
		}
	}

	public async enableNetworkTracking() {
		this.networkTracker = await enableNetworkTracking(this.cdp);
	}

	public async waitForNetworkDetails() {
		await this.networkTracker?.waitForDetails();
	}

	public async evaluate<T>(expression: string, timeoutMs = 30_000): Promise<T> {
		return await Promise.race([
			this.page.evaluate(expression),
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Playwright evaluate timed out after ${timeoutMs}ms`)), timeoutMs).unref()),
		]) as T;
	}

	public collectDiagnostics(): BrowserDiagnostics {
		return {
			pageErrorCount: this.diagnostics.pageErrorCount,
			console: {
				log: this.diagnostics.console.log ?? 0,
				warning: this.diagnostics.console.warning ?? 0,
				error: this.diagnostics.console.error ?? 0,
				info: this.diagnostics.console.info ?? 0,
			},
		};
	}

	public async collectPerformance(): Promise<BrowserMeasurement['performance']> {
		const cdpMetricsResult = await this.cdp.send('Performance.getMetrics');
		const cdpMetrics = Object.fromEntries(cdpMetricsResult.metrics.map(metric => [metric.name, metric.value]));
		const runtimeHeap = await this.cdp.send('Runtime.getHeapUsage').catch(() => undefined);
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
		const onChunk = (params: { chunk: string }) => {
			chunks.push(params.chunk);
		};
		this.cdp.on('HeapProfiler.addHeapSnapshotChunk', onChunk);

		let content: string;
		try {
			await this.cdp.send('HeapProfiler.enable');
			await this.cdp.send('HeapProfiler.collectGarbage');
			await this.cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
			content = chunks.join('');
		} finally {
			// 外さないとラウンドごとに積み上がり、古い配列にチャンクを流し続ける
			this.cdp.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
		}

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
