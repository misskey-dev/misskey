/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Buffer } from 'node:buffer';
import type { FastifyInstance } from 'fastify';
import { logManager } from '@/logging/logging-runtime.js';
import type { LogManager } from '@/logging/LogManager.js';
import type { LogTraceContext } from '@/logging/types.js';

type AccessRequestState = {
	traceContext?: LogTraceContext;
	errorType?: string;
	requestBody?: unknown;
	responseBody?: unknown;
};

type CapturedBody = {
	value: unknown;
};

/** Content-Typeから本文の種類だけを取り出します。 */
function getMediaType(value: string | string[] | number | undefined): string | undefined {
	const first = Array.isArray(value) ? value[0] : value;
	return typeof first === 'string' ? first.split(';', 1)[0].trim().toLowerCase() : undefined;
}

/** 秘匿処理を適用できるJSON・form・text本文か判定します。 */
function isSupportedMediaType(value: string | undefined): boolean {
	return value === 'application/json'
		|| (value?.startsWith('application/') === true && value.endsWith('+json'))
		|| value === 'application/x-www-form-urlencoded'
		|| (value?.startsWith('text/') === true && value !== 'text/event-stream');
}

/** application/jsonとapplication/*+jsonを構造化対象として判定します。 */
function isJsonMediaType(value: string | undefined): boolean {
	return value === 'application/json'
		|| (value?.startsWith('application/') === true && value.endsWith('+json'));
}

/** Streamやバイナリを本文ログの対象から外します。 */
function isStream(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) return false;
	try {
		const candidate = value as {
			pipe?: unknown;
			getReader?: unknown;
			[Symbol.asyncIterator]?: unknown;
		};
		return typeof candidate.pipe === 'function'
			|| typeof candidate.getReader === 'function'
			|| typeof candidate[Symbol.asyncIterator] === 'function';
	} catch {
		// 本文のgetterが壊れていても、ログ処理が応答を失敗させないよう除外します。
		return true;
	}
}

/** JSON文字列を構造化し、解析できない場合は元の文字列を保持します。 */
function parseJsonBody(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

/** form本文を項目ごとの値へ分解し、キー単位の秘匿処理を可能にします。 */
function parseFormBody(value: string): Record<string, string | string[]> {
	const result: Record<string, string | string[]> = Object.create(null) as Record<string, string | string[]>;
	for (const [key, item] of new URLSearchParams(value)) {
		const previous = result[key];
		result[key] = typeof previous === 'undefined'
			? item
			: Array.isArray(previous) ? [...previous, item] : [previous, item];
	}
	return result;
}

/** 送受信本文から、ログへ渡せる値だけを取り出します。 */
function captureBody(value: unknown, contentType: string | string[] | number | undefined): CapturedBody | undefined {
	const mediaType = getMediaType(contentType);
	if (!isSupportedMediaType(mediaType) || isStream(value)) return undefined;

	if (isJsonMediaType(mediaType)) {
		if (typeof value === 'string') return { value: parseJsonBody(value) };
		if (Buffer.isBuffer(value)) return { value: parseJsonBody(value.toString('utf8')) };
		return { value };
	}

	if (mediaType === 'application/x-www-form-urlencoded') {
		if (typeof value === 'string') return { value: parseFormBody(value) };
		if (Buffer.isBuffer(value)) return { value: parseFormBody(value.toString('utf8')) };
	}
	if (typeof value === 'string') return { value };
	if (Buffer.isBuffer(value)) return { value: value.toString('utf8') };
	// form parserなどが返す構造化済みの本文も、通常の正規化処理へ渡します。
	if (typeof value === 'object' && value !== null) return { value };
	return undefined;
}

/** Errorから本文を含めない型名だけを取り出します。 */
function getErrorType(error: unknown): string {
	if (typeof error === 'object' && error !== null && typeof (error as { name?: unknown }).name === 'string') {
		const name = (error as { name: string }).name;
		if (name.length > 0) return name;
	}
	return 'Error';
}

/** content-lengthを安全なバイト数へ変換し、未知の応答ではnullを返します。 */
function getResponseSize(value: string | string[] | number | undefined): number | null {
	const first = Array.isArray(value) ? value[0] : value;
	const size = typeof first === 'number' ? first : typeof first === 'string' && /^\d+$/.test(first) ? Number(first) : NaN;
	return Number.isSafeInteger(size) && size >= 0 ? size : null;
}

/** Fastify全体へAccess log用のリクエスト・エラー・応答フックを登録します。 */
export function registerHttpAccessLog(fastify: FastifyInstance, manager: LogManager = logManager): void {
	if (!manager.isAccessLogEnabled()) return;

	const states = new WeakMap<object, AccessRequestState>();

	// HTTP計装の後に登録し、リクエスト開始時のactiveなTrace Contextを保存します。
	fastify.addHook('onRequest', (request, _reply, done) => {
		states.set(request, {
			traceContext: manager.getActiveTraceContext(),
		});
		done();
	});

	// Fastifyが応答へ変換したErrorから、型名だけをリクエストへ一時保存します。
	fastify.addHook('onError', (request, _reply, error, done) => {
		const state = states.get(request) ?? {};
		state.errorType = getErrorType(error);
		states.set(request, state);
		done();
	});

	// 送信前のpayloadを読み取りますが、元の値は変更せず、そのまま次のhookへ渡します。
	fastify.addHook('onSend', (request, reply, payload, done) => {
		if (!manager.shouldWriteAccess(reply.statusCode)) {
			done(null, payload);
			return;
		}

		const bodyConfiguration = manager.getAccessLogConfiguration().bodies;
		const state = states.get(request) ?? {};
		if (bodyConfiguration.request && !('requestBody' in state)) {
			// ActivityPubもFastifyが解析したrequest.bodyだけを対象にし、rawBodyやheaderは参照しません。
			const captured = captureBody(request.body, request.headers['content-type']);
			if (captured !== undefined) state.requestBody = captured.value;
		}
		if (bodyConfiguration.response && !('responseBody' in state)) {
			const captured = captureBody(payload, reply.getHeader('content-type'));
			if (captured !== undefined) state.responseBody = captured.value;
		}
		states.set(request, state);
		done(null, payload);
	});

	// 応答完了時にFastifyの値を集め、LogManagerへAccess logを渡します。
	fastify.addHook('onResponse', (request, reply, done) => {
		const state = states.get(request);
		const input = {
			method: request.method,
			route: request.routeOptions.url ?? null,
			statusCode: reply.statusCode,
			durationMs: reply.elapsedTime,
			responseSizeBytes: getResponseSize(reply.getHeader('content-length')),
			...(state?.errorType !== undefined ? { errorType: state.errorType } : {}),
			...(state != null && 'requestBody' in state ? { requestBody: state.requestBody } : {}),
			...(state != null && 'responseBody' in state ? { responseBody: state.responseBody } : {}),
			...(state?.traceContext !== undefined ? { traceContext: state.traceContext } : {}),
		};
		manager.writeAccess(input);
		states.delete(request);
		done();
	});
}
