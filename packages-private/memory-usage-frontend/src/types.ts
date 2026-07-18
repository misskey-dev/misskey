/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { HeapSnapshotData } from 'diagnostics-shared/heap-snapshot';

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

export type BrowserDiagnostics = {
	pageErrorCount: number;
	console: Record<'log' | 'warning' | 'error' | 'info', number>;
};

export type BrowserMeasurement = {
	label: string;
	timestamp: string;
	url: string;
	scenario: string;
	diagnostics: BrowserDiagnostics;
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

export type BrowserMeasurementSample = BrowserMeasurement & {
	round: number;
	/** ラウンド単位のリクエスト差分HTMLを描くために生ログを丸ごと保持する */
	networkRequests: NetworkRequest[];
};

export type BrowserMetricsReport = {
	label: string;
	timestamp: string;
	url: string;
	scenario: string;
	sampleCount: number;
	aggregation: 'median';
	summary: BrowserMeasurement;
	samples: BrowserMeasurementSample[];
};
