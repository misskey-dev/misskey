/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { sanitizeAttributes } from '@/core/telemetry/sanitizer/attributes.js';

describe('telemetry attribute sanitizer', () => {
	test('keeps only the origin of outbound URLs and drops url.path', () => {
		expect(sanitizeAttributes({ 'url.full': 'https://user:PASS@host.test:8443/webhook/DO_NOT_EXPORT?canary=DO_NOT_EXPORT#fragment' })['url.full']).toBe('https://host.test:8443');
		// `url.path` は許可しないため、値ではなくキーの不在を確認する。
		const result = sanitizeAttributes({ 'http.route': '/webhook/:token', 'url.path': '/webhook/DO_NOT_EXPORT' });
		expect(result).toEqual({ 'http.route': '/webhook/:token' });
		expect(result).not.toHaveProperty('url.path');
	});

	test('keeps real Fastify route templates and never emits raw paths', () => {
		const route = (value: string) => sanitizeAttributes({ 'http.route': value })['http.route'];
		for (const value of ['/api/notes/create', '/api/i', '/@:acct', '/@:user.atom', '/@:user/:sub?',
			'/emoji/:path(.*)', '/files/:key/*', '/.well-known/nodeinfo', '/url', '/*', '/']) {
			expect(route(value)).toBe(value);
		}
		// 想定外の source が生 path を渡した場合も形式を検証する。
		expect(route('/api/notes/create?i=DO_NOT_EXPORT')).toBe('[redacted]');
		expect(route('not-a-path')).toBe('[redacted]');
		expect(route('/a'.repeat(200))).toBe('[redacted]');
	});

	test('drops url.path unconditionally in both directions', () => {
		// @fastify/otel は受信 span の url.path にクエリ付きの生 URL を入れる。
		expect(sanitizeAttributes({ 'url.path': '/streaming?i=DO_NOT_EXPORT' })).not.toHaveProperty('url.path');
		// 受信側の credential を含む path。
		expect(sanitizeAttributes({ 'url.path': '/reset-password/DO_NOT_EXPORT' })).not.toHaveProperty('url.path');
		// route 由来の安全な値でも出さない (http.route が同じ情報を持つ)
		expect(sanitizeAttributes({ 'url.path': '/api/notes/create' })).not.toHaveProperty('url.path');
	});

	test('keeps the attributes Misskey and its instrumentations actually produce', () => {
		// HTTP client (http-client-instrumentation.ts)
		expect(sanitizeAttributes({
			'http.request.method': 'POST',
			'url.full': 'https://remote.example:8443/',
			'server.address': 'remote.example',
			'server.port': 8443,
			'http.response.status_code': 202,
			'network.protocol.version': '1.1',
			'error.type': 'ECONNREFUSED',
		})).toEqual({
			'http.request.method': 'POST',
			'url.full': 'https://remote.example:8443',
			'server.address': 'remote.example',
			'server.port': 8443,
			'http.response.status_code': 202,
			'network.protocol.version': '1.1',
			'error.type': 'ECONNREFUSED',
		});
		// Redis (redis-instrumentation.ts)
		expect(sanitizeAttributes({
			'db.system.name': 'redis',
			'db.operation.name': 'get',
			'db.namespace': '0',
			'server.address': '127.0.0.1',
			'server.port': 6379,
			'db.response.status_code': 'ERR',
		})).toEqual({
			'db.system.name': 'redis',
			'db.operation.name': 'get',
			'db.namespace': '0',
			'server.address': '127.0.0.1',
			'server.port': 6379,
			'db.response.status_code': 'ERR',
		});
	});

	test('does not mutate input and redacts sensitive nested values', () => {
		const input = { 'url.full': 'https://host.test/webhook/DO_NOT_EXPORT?secret=DO_NOT_EXPORT', nested: { token: 'DO_NOT_EXPORT' } };
		const result = sanitizeAttributes(input);
		expect(input['url.full']).toContain('DO_NOT_EXPORT');
		expect(JSON.stringify(result)).not.toContain('DO_NOT_EXPORT');
		expect(result).toEqual({ 'url.full': 'https://host.test' });
	});

	test('never throws for circular objects or getters that throw', () => {
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		Object.defineProperty(circular, 'throwing', { enumerable: true, get: () => { throw new Error('DO_NOT_EXPORT'); } });
		expect(() => sanitizeAttributes(circular)).not.toThrow();
		expect(JSON.stringify(sanitizeAttributes(circular))).not.toContain('DO_NOT_EXPORT');
	});

	test('drops attributes that are not on the allowlist, such as client addresses and pg pool settings', () => {
		expect(sanitizeAttributes({
			'network.peer.address': '203.0.113.9',
			'client.address': '203.0.113.9',
			'user_agent.original': 'DO_NOT_EXPORT',
			'fastify.root': '@fastify/otel',
			'db.postgresql.idle.timeout.millis': 10000,
		})).toEqual({});
	});

	describe('allowlist is fail-closed on value type, not only on key name', () => {
		test('keeps numbers only for the keys whose value is a number in semconv', () => {
			expect(sanitizeAttributes({ 'http.response.status_code': 404, 'server.port': 5432 }))
				.toEqual({ 'http.response.status_code': 404, 'server.port': 5432 });
			expect(sanitizeAttributes({ 'http.request.method': 1, 'server.port': '5432' })).toEqual({});
		});

		test('keeps db.response.status_code as either a number or a short token string', () => {
			expect(sanitizeAttributes({ 'db.response.status_code': 'ERR' })).toEqual({ 'db.response.status_code': 'ERR' });
			expect(sanitizeAttributes({ 'db.response.status_code': 0 })).toEqual({ 'db.response.status_code': 0 });
		});

		test('drops NaN and Infinity (JSON.stringify turns them into null, so the size check would measure something else)', () => {
			expect(sanitizeAttributes({ 'http.response.status_code': NaN, 'server.port': Infinity })).toEqual({});
		});

		test('drops non-string values for keys whose format is validated as a string', () => {
			// 数値や真偽値で文字列向けの形式検証を迂回できないことを確認する。
			expect(sanitizeAttributes({ 'http.route': 123 })).not.toHaveProperty('http.route');
			expect(sanitizeAttributes({ 'url.full': true })).not.toHaveProperty('url.full');
			expect(sanitizeAttributes({ 'server.address': 0 })).not.toHaveProperty('server.address');
			expect(sanitizeAttributes({ 'db.system.name': 1, 'error.type': true, 'http.request.method': 0 })).toEqual({});
		});

		test('redacts free-form strings on token keys', () => {
			expect(sanitizeAttributes({ 'error.type': 'free form DO_NOT_EXPORT' })).toEqual({ 'error.type': '[redacted]' });
			expect(sanitizeAttributes({ 'server.address': 'host.test/DO_NOT_EXPORT' })).toEqual({ 'server.address': '[redacted]' });
		});

		test('drops a numeric db.statement even when the postgresql gate is open', () => {
			expect(sanitizeAttributes({ 'db.statement': 1, 'db.system.name': 'postgresql' }, { allowDbStatement: true }))
				.not.toHaveProperty('db.statement');
		});
	});

	describe('db.statement / db.query.text opt-in (capturePgStatement)', () => {
		const sql = 'SELECT * FROM notes WHERE id = $1';

		test('drops db.statement and db.query.text by default even when present', () => {
			expect(sanitizeAttributes({ 'db.statement': sql, 'db.system.name': 'postgresql' })).not.toHaveProperty('db.statement');
			expect(sanitizeAttributes({ 'db.query.text': sql, 'db.system.name': 'postgresql' })).not.toHaveProperty('db.query.text');
		});

		test('passes db.statement and db.query.text only when allowDbStatement is explicitly true and db.system.name is postgresql', () => {
			expect(sanitizeAttributes({ 'db.statement': sql, 'db.system.name': 'postgresql' }, { allowDbStatement: true })['db.statement']).toBe(sql);
			expect(sanitizeAttributes({ 'db.query.text': sql, 'db.system.name': 'postgresql' }, { allowDbStatement: true })['db.query.text']).toBe(sql);
			expect(sanitizeAttributes({ 'db.statement': sql, 'db.system.name': 'postgresql' }, { allowDbStatement: false })).not.toHaveProperty('db.statement');
		});

		test('rejects db.statement/db.query.text when db.system.name is absent or not postgresql', () => {
			// Redis 計装も同じ `db.query.text` を使うため、PostgreSQL 以外では許可しない。
			expect(sanitizeAttributes({ 'db.statement': sql }, { allowDbStatement: true })).not.toHaveProperty('db.statement');
			expect(sanitizeAttributes({
				'db.query.text': 'setex webauthn:challenge:user123 90 CHALLENGE_NONCE',
				'db.system.name': 'redis',
			}, { allowDbStatement: true })).not.toHaveProperty('db.query.text');
		});

		test('strips NUL/CR/LF/ESC control characters even when allowed', () => {
			const withControlChars = 'SELECT 1\x00 -- comment\r\ncontinued\x1b[31m';
			const result = sanitizeAttributes({ 'db.statement': withControlChars, 'db.system.name': 'postgresql' }, { allowDbStatement: true })['db.statement'] as string;
			expect(result).not.toMatch(/[\x00\r\n\x1b]/);
			expect(result).toBe('SELECT 1 -- commentcontinued[31m');
		});

		test('truncates to an 8 KiB UTF-8 byte limit without splitting a multi-byte character', () => {
			// 'あ' はUTF-8で3バイト。3000文字 = 9000バイトで上限(8192バイト)を超える。
			const multiByteChar = 'あ';
			const oversized = multiByteChar.repeat(3000);
			const result = sanitizeAttributes({ 'db.statement': oversized, 'db.system.name': 'postgresql' }, { allowDbStatement: true })['db.statement'] as string;
			const byteLength = Buffer.byteLength(result, 'utf8');
			expect(byteLength).toBeLessThanOrEqual(8 * 1024);
			expect(result).toBe(multiByteChar.repeat(result.length));
			expect(byteLength).toBeGreaterThan(8 * 1024 - 3);
		});

		test('never allows db.postgresql.values / db.connection_string / db.user even with allowDbStatement (allowlist stays exact)', () => {
			expect(sanitizeAttributes({
				'db.postgresql.values': 'DO_NOT_EXPORT',
				'db.connection_string': 'postgres://user:DO_NOT_EXPORT@host/db',
				'db.user': 'DO_NOT_EXPORT',
				'db.system.name': 'postgresql',
			}, { allowDbStatement: true })).toEqual({ 'db.system.name': 'postgresql' });
		});
	});

	describe('Fastify hook attributes', () => {
		test('keeps the Fastify hook attributes @fastify/otel actually produces', () => {
			// 値の材料は登録時に確定する関数名とプラグイン名だけで、リクエスト由来の値を含まない。
			expect(sanitizeAttributes({
				'hook.name': 'fastify -> @fastify/otel - route -> onRequest',
				'fastify.type': 'route-hook',
				'hook.callback.name': 'routeGuard',
				'http.route': '/notes/:id',
			})).toEqual({
				'hook.name': 'fastify -> @fastify/otel - route -> onRequest',
				'fastify.type': 'route-hook',
				'hook.callback.name': 'routeGuard',
				'http.route': '/notes/:id',
			});
		});

		test('redacts hook attributes whose value is not an identifier chain', () => {
			expect(sanitizeAttributes({
				'hook.name': '/notes/1?i=DO_NOT_EXPORT',
				'fastify.type': 'not-a-known-type',
				'hook.callback.name': 'free form text',
			})).toEqual({
				'hook.name': '[redacted]',
				'fastify.type': '[redacted]',
				'hook.callback.name': '[redacted]',
			});
		});
	});
});
