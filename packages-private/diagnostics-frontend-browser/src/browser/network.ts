/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { CDPSession } from 'playwright';
import type { NetworkRequest, NetworkSummary, WebSocketConnection } from '../types';

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
	// opcode 1 はテキストフレームで、それ以外はbase64エンコードされたバイナリとして届く
	if (frame.opcode === 1) return Buffer.byteLength(frame.payloadData, 'utf8');
	return Buffer.byteLength(frame.payloadData, 'base64');
}

export type NetworkTracker = {
	networkRequests: NetworkRequest[];
	webSocketConnections: WebSocketConnection[];
	/** CDPへの追加問い合わせ (postDataの取得) が全て決着するまで待つ */
	waitForDetails: () => Promise<void>;
};

/**
 * CDPのNetworkドメインを有効化し、リクエスト/WebSocketの生ログを収集し続けるトラッカーを返す。
 */
export async function enableNetworkTracking(cdp: CDPSession): Promise<NetworkTracker> {
	const networkRequests: NetworkRequest[] = [];
	const webSocketConnections: WebSocketConnection[] = [];
	const requests = new Map<string, NetworkRequest>();
	const webSockets = new Map<string, WebSocketConnection>();
	const pendingDetailReads: Promise<void>[] = [];

	const readRequestBody = (row: NetworkRequest) => {
		if (!row.hasRequestBody || row.requestBody != null) return;
		const pending = cdp.send('Network.getRequestPostData', {
			requestId: row.requestId,
		}).then(result => {
			row.requestBody = result.postData;
		}).catch(() => {
			// Some requests expose hasPostData but no longer have retrievable body data.
		});
		pendingDetailReads.push(pending);
	};

	cdp.on('Network.requestWillBeSent', params => {
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
		networkRequests.push(row);
	});

	cdp.on('Network.webSocketCreated', params => {
		if (params.requestId == null || params.url == null) return;
		const row: WebSocketConnection = {
			requestId: params.requestId,
			url: params.url,
			// Network.webSocketCreated はtimestampを持たないので、closedAt との差分は取れない
			createdAt: 0,
			sentFrameCount: 0,
			receivedFrameCount: 0,
			sentBytes: 0,
			receivedBytes: 0,
			errorCount: 0,
		};
		webSockets.set(params.requestId, row);
		webSocketConnections.push(row);
	});

	cdp.on('Network.webSocketWillSendHandshakeRequest', params => {
		const row = webSockets.get(params.requestId);
		if (row == null) return;
		row.handshakeRequestHeaders = normalizeHeaders(params.request?.headers);
	});

	cdp.on('Network.webSocketHandshakeResponseReceived', params => {
		const row = webSockets.get(params.requestId);
		if (row == null) return;
		row.handshakeResponseStatus = params.response?.status;
		row.handshakeResponseStatusText = params.response?.statusText;
		row.handshakeResponseHeaders = normalizeHeaders(params.response?.headers);
	});

	cdp.on('Network.webSocketFrameSent', params => {
		const row = webSockets.get(params.requestId);
		if (row == null) return;
		row.sentFrameCount += 1;
		row.sentBytes += webSocketFramePayloadBytes(params.response);
	});

	cdp.on('Network.webSocketFrameReceived', params => {
		const row = webSockets.get(params.requestId);
		if (row == null) return;
		row.receivedFrameCount += 1;
		row.receivedBytes += webSocketFramePayloadBytes(params.response);
	});

	cdp.on('Network.webSocketFrameError', params => {
		const row = webSockets.get(params.requestId);
		if (row == null) return;
		row.errorCount += 1;
	});

	cdp.on('Network.webSocketClosed', params => {
		const row = webSockets.get(params.requestId);
		if (row == null) return;
		row.closedAt = params.timestamp ?? 0;
	});

	cdp.on('Network.responseReceived', params => {
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
		readRequestBody(row);
	});

	cdp.on('Network.loadingFailed', params => {
		const row = requests.get(params.requestId);
		if (row == null) return;
		row.failed = true;
		row.finished = true;
		row.errorText = params.errorText;
		readRequestBody(row);
	});

	await cdp.send('Network.enable');
	await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
	await cdp.send('Network.setBypassServiceWorker', { bypass: true });
	await cdp.send('Page.enable');
	await cdp.send('Runtime.enable');
	await cdp.send('Performance.enable');

	return {
		networkRequests,
		webSocketConnections,
		waitForDetails: async () => {
			// 待っている最中にさらにpendingが増えることがあるので、増えなくなるまで繰り返す
			let settledCount = 0;
			while (settledCount < pendingDetailReads.length) {
				const pending = pendingDetailReads.slice(settledCount);
				settledCount = pendingDetailReads.length;
				await Promise.allSettled(pending);
			}
		},
	};
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
