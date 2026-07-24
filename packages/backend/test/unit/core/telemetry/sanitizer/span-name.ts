/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { safeName } from '@/core/telemetry/sanitizer/span-name.js';

describe('telemetry span name sanitizer', () => {
	test('builds METHOD+host from url.full for an outbound span', () => {
		// Misskey の送信 HTTP 計装が作る属性の組み合わせを確認する。
		expect(safeName('DO_NOT_USE_RAW_NAME', { 'http.request.method': 'GET', 'url.full': 'https://remote.example', 'server.address': 'remote.example' })).toBe('GET remote.example');
	});

	test('uses url.full as the only host source, so the same destination gets the same name in every configuration', () => {
		// Sentry の client span は `server.address` を持たないため、`url.full` から一貫して名前を作る。
		expect(safeName('DO_NOT_USE_RAW_NAME', { 'http.request.method': 'GET', 'url.full': 'https://remote.example:8443' })).toBe('GET remote.example:8443');
		// server.addressが同時にあってもurl.full側が優先される。
		expect(safeName('DO_NOT_USE_RAW_NAME', { 'http.request.method': 'GET', 'url.full': 'https://remote.example:8443', 'server.address': 'remote.example' })).toBe('GET remote.example:8443');
	});

	test('keeps the Fastify hook span names @fastify/otel actually produces (OTel-only)', () => {
		// route handler の span は method を持たないため、hook span を許可しないと全件 `[redacted]` になる。
		expect(safeName('handler - fastify -> @fastify/otel', { 'fastify.type': 'request-handler', 'http.route': '/notes/:id' })).toBe('handler - fastify -> @fastify/otel');
		expect(safeName('onRequest - checkAuth', { 'fastify.type': 'hook' })).toBe('onRequest - checkAuth');
		expect(safeName('onSend - bound createServer -> @fastify/cors -> @fastify/multipart', { 'fastify.type': 'hook' })).toBe('onSend - bound createServer -> @fastify/cors -> @fastify/multipart');
	});

	test('keeps the Fastify hook span names Sentry actually produces (combined)', () => {
		// Sentry の Fastify 計装は `<plugin> - <hook>` と `request` を使い、`fastify.type` を付けない span がある。
		// 形式が @fastify/otel と違うため、`sentry.op` でも hook span と判定できる必要がある。
		expect(safeName('@sentry/instrumentation-fastify - onRequest', { 'sentry.op': 'hook.fastify', 'fastify.type': 'hook' })).toBe('@sentry/instrumentation-fastify - onRequest');
		expect(safeName('request', { 'sentry.op': 'request_handler.fastify', 'http.route': '/notes/:id', 'http.request.method': 'GET' })).toBe('request');
	});

	test('redacts a hook-shaped name that carries a path or a value outside the identifier vocabulary', () => {
		// 名前を通す条件は形式の一致だけなので、識別子以外が混ざったものは伏せる。
		expect(safeName('onRequest - /notes/1?i=SECRET', { 'fastify.type': 'hook' })).toBe('[redacted]');
		// 区切り記号を伴わない空白は識別子の連結ではない。
		expect(safeName('handler - free form text', { 'fastify.type': 'hook' })).toBe('[redacted]');
		expect(safeName(`handler - ${'a'.repeat(300)}`, { 'fastify.type': 'hook' })).toBe('[redacted]');
	});

	test('does not pass a hook-shaped name through when no attribute identifies the span as a Fastify hook', () => {
		// 名前の形だけで通すと、別の計装が同じ形の名前を作った場合に素通りする。
		expect(safeName('onRequest - checkAuth', {})).toBe('[redacted]');
		// `fastify.type` が伏せられた場合も hook span として扱わない。
		expect(safeName('onRequest - checkAuth', { 'fastify.type': '[redacted]' })).toBe('[redacted]');
		expect(safeName('@sentry/instrumentation-fastify - onRequest', { 'sentry.op': 'http.server' })).toBe('[redacted]');
	});

	test('redacts an inbound span without a route instead of collapsing it onto the local listen address', () => {
		// route のない受信 span を listen address でまとめないため、`server.address` では代替しない。
		expect(safeName('GET /unmatched/secret-path', { 'http.request.method': 'GET', 'server.address': 'localhost' })).toBe('[redacted]');
	});
});
