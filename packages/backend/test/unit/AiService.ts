/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { AiService as AiServiceType, Prediction } from '@/core/AiService.js';
import type { MiMeta } from '@/models/_.js';
import type { HttpRequestService } from '@/core/HttpRequestService.js';
import type { LoggerService } from '@/core/LoggerService.js';

// AiService が直接 import している node-fetch をモックして、外部サービスへの送信内容と
// レスポンス解釈を検証する。
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock('node-fetch', () => ({ default: fetchMock }));

const { AiService } = await import('@/core/AiService.js');

const DEFAULT_META = {
	sensitiveMediaDetectionApiUrl: 'http://localhost:3009' as string | null,
	sensitiveMediaDetectionApiKey: null as string | null,
	sensitiveMediaDetectionTimeout: 5000,
	sensitiveMediaDetectionMaxImagesPerRequest: 4,
};

function makeService(metaOverrides: Partial<typeof DEFAULT_META> = {}): AiServiceType {
	const meta = { ...DEFAULT_META, ...metaOverrides } as unknown as MiMeta;
	const httpRequestService = { getAgentByUrl: () => undefined } as unknown as HttpRequestService;
	const loggerService = {
		getLogger: () => ({ warn: () => {}, error: () => {}, info: () => {} }),
	} as unknown as LoggerService;
	return new AiService(meta, httpRequestService, loggerService);
}

function neutral(): Prediction[] {
	return [{ className: 'Neutral', probability: 0.99 }];
}

function okResponse(results: unknown[]) {
	return {
		ok: true,
		status: 200,
		statusText: 'OK',
		json: async () => ({ success: true, result: { results } }),
	};
}

const buf = (s: string) => Buffer.from(s);

describe('AiService', () => {
	beforeEach(() => {
		fetchMock.mockReset();
	});

	test('正常: 送信順を保った予測値配列を返す', async () => {
		fetchMock.mockResolvedValue(okResponse([
			{ success: true, predictions: neutral() },
			{ success: true, predictions: [{ className: 'Porn', probability: 0.8 }] },
		]));
		const svc = makeService();
		const res = await svc.detectSensitiveMany([buf('a'), buf('b')]);
		expect(res).toEqual([
			[{ className: 'Neutral', probability: 0.99 }],
			[{ className: 'Porn', probability: 0.8 }],
		]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3009/v1/detect-images');
	});

	test('detectSensitive: 単一画像はバッチの先頭を返す', async () => {
		fetchMock.mockResolvedValue(okResponse([{ success: true, predictions: neutral() }]));
		const svc = makeService();
		const res = await svc.detectSensitive(buf('a'));
		expect(res).toEqual(neutral());
	});

	test('部分失敗: 失敗パーツのみ null になる', async () => {
		fetchMock.mockResolvedValue(okResponse([
			{ success: true, predictions: neutral() },
			{ success: false, error: { code: 'IMAGE_DECODE_FAILED', message: 'x' } },
		]));
		const svc = makeService();
		const res = await svc.detectSensitiveMany([buf('a'), buf('b')]);
		expect(res[0]).toEqual(neutral());
		expect(res[1]).toBeNull();
	});

	test('非200: チャンク全件 null（例外を投げない）', async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable', json: async () => ({}) });
		const svc = makeService();
		const res = await svc.detectSensitiveMany([buf('a'), buf('b')]);
		expect(res).toEqual([null, null]);
	});

	test('通信エラー: チャンク全件 null（例外を投げない）', async () => {
		fetchMock.mockRejectedValue(new Error('network down'));
		const svc = makeService();
		const res = await svc.detectSensitiveMany([buf('a')]);
		expect(res).toEqual([null]);
	});

	test('接続先未設定: HTTP を叩かず全件 null', async () => {
		const svc = makeService({ sensitiveMediaDetectionApiUrl: null });
		const res = await svc.detectSensitiveMany([buf('a'), buf('b')]);
		expect(res).toEqual([null, null]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test('チャンク分割: maxImagesPerRequest ごとに順次送信する', async () => {
		fetchMock.mockResolvedValue(okResponse([
			{ success: true, predictions: neutral() },
			{ success: true, predictions: neutral() },
			{ success: true, predictions: neutral() },
			{ success: true, predictions: neutral() },
		]));
		const svc = makeService({ sensitiveMediaDetectionMaxImagesPerRequest: 2 });
		const res = await svc.detectSensitiveMany([buf('a'), buf('b'), buf('c'), buf('d'), buf('e')]);
		// 5 枚を 2 枚ずつ → 3 リクエスト、結果は順序を保って 5 件。
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(res).toHaveLength(5);
		expect(res.every(x => x != null)).toBe(true);
	});

	test('APIキー設定時のみ Authorization: Bearer を付与する', async () => {
		fetchMock.mockResolvedValue(okResponse([{ success: true, predictions: neutral() }]));

		const withKey = makeService({ sensitiveMediaDetectionApiKey: 'secret' });
		await withKey.detectSensitiveMany([buf('a')]);
		expect((fetchMock.mock.calls[0][1] as any).headers.Authorization).toBe('Bearer secret');

		fetchMock.mockClear();
		fetchMock.mockResolvedValue(okResponse([{ success: true, predictions: neutral() }]));
		const withoutKey = makeService();
		await withoutKey.detectSensitiveMany([buf('a')]);
		expect((fetchMock.mock.calls[0][1] as any).headers.Authorization).toBeUndefined();
	});
});
