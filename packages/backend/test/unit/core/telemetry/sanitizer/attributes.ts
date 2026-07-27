/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { sanitizeAttributes } from '@/core/telemetry/sanitizer/attributes.js';
import { marker } from '@/core/telemetry/sanitizer/validation.js';

describe('telemetry attribute sanitizer', () => {
	test('uses pathname for inbound URLs and origin for outbound URLs', () => {
		// URL の加工は公開 API である sanitizeAttributes 経由で確認する。
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
		// 受信側の credential を含む path。
		expect(sanitizeAttributes({ 'url.path': '/reset-password/DO_NOT_EXPORT' })).not.toHaveProperty('url.path');
		// 送信側の webhook secret。
		expect(sanitizeAttributes({ 'url.path': '/services/T0/B0/DO_NOT_EXPORT' })).not.toHaveProperty('url.path');
		// route 由来の安全な値でも出さない (http.route が同じ情報を持つ)
		expect(sanitizeAttributes({ 'url.path': '/api/notes/create' })).not.toHaveProperty('url.path');
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

	describe('legacy semconv attribute names are normalized onto the current names', () => {
		test('accepts the legacy names the installed SDKs actually set, and emits the current name', () => {
			// Sentry と PostgreSQL 計装の旧属性名を現行名へ正規化する。
			expect(sanitizeAttributes({ 'http.method': 'GET', 'http.flavor': '1.1', 'db.name': 'misskey' }))
				.toEqual({ 'http.request.method': 'GET', 'network.protocol.version': '1.1', 'db.namespace': 'misskey' });
		});

		test('prefers the current name and discards the legacy one when both are present', () => {
			expect(sanitizeAttributes({ 'http.method': 'POST', 'http.request.method': 'GET' }))
				.toEqual({ 'http.request.method': 'GET' });
			// 現行名の値が形式検証で落ちる場合も旧名で代替しない (fail-closed 側へ倒す)。
			expect(sanitizeAttributes({ 'http.method': 'GET', 'http.request.method': 'not a method!' }))
				.toEqual({ 'http.request.method': marker });
		});

		test('does not alias net.peer.* onto server.* (on a server span the peer is the requesting client, not us)', () => {
			// 旧semconvのnet.peer.*はclient spanでは接続先だがserver spanでは接続元を指すため、
			// 一律にserver.addressへ寄せるとinbound spanのserver.addressへ利用者のIPが入り、span名にも現れる。
			expect(sanitizeAttributes({ 'net.peer.name': '203.0.113.9', 'net.peer.port': 51234 })).toEqual({});
		});
	});

	describe('allowlist is fail-closed on value type, not only on key name', () => {
		test('keeps numbers only for the keys whose value is a number in semconv', () => {
			expect(sanitizeAttributes({ 'http.response.status_code': 404, 'server.port': 5432 }))
				.toEqual({ 'http.response.status_code': 404, 'server.port': 5432 });
		});

		test('keeps db.response.status_code as either a number or a short token string', () => {
			// semconv 1.43 の例は '08P01' / 'ORA-17002' で、Misskey自身のRedis計装
			// (redis-instrumentation.ts の getRedisErrorStatusCode) も 'ERR' 等の文字列を設定する。
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
			expect(sanitizeAttributes({ 'sentry.origin': 1, 'sentry.op': 1 })).toEqual({});
			expect(sanitizeAttributes({ 'db.system': 1, 'error.type': true, 'http.request.method': 0 })).toEqual({});
		});

		test('drops a numeric db.statement even when the postgresql gate is open', () => {
			expect(sanitizeAttributes({ 'db.statement': 1, 'db.system': 'postgresql' }, { allowDbStatement: true }))
				.not.toHaveProperty('db.statement');
		});
	});

	describe('db.statement / db.query.text opt-in (capturePgStatement)', () => {
		test('drops db.statement and db.query.text by default even when present', () => {
			// options未指定 (既定のOTLP経路と同じ) では、常に既定のallowlistで判定する。
			expect(sanitizeAttributes({ 'db.statement': 'SELECT * FROM notes WHERE id = $1' })).not.toHaveProperty('db.statement');
			expect(sanitizeAttributes({ 'db.query.text': 'SELECT * FROM notes WHERE id = $1' })).not.toHaveProperty('db.query.text');
		});

		test('passes db.statement and db.query.text only when allowDbStatement is explicitly true and the sibling db.system(.name) is postgresql', () => {
			const sql = 'SELECT * FROM notes WHERE id = $1';
			expect(sanitizeAttributes({ 'db.statement': sql, 'db.system': 'postgresql' }, { allowDbStatement: true })['db.statement']).toBe(sql);
			expect(sanitizeAttributes({ 'db.query.text': sql, 'db.system.name': 'postgresql' }, { allowDbStatement: true })['db.query.text']).toBe(sql);
			// falseを明示した場合や、allowDbStatement以外のoptionsだけを渡した場合も許可しない。
			expect(sanitizeAttributes({ 'db.statement': sql, 'db.system': 'postgresql' }, { allowDbStatement: false })).not.toHaveProperty('db.statement');
		});

		test('rejects db.statement/db.query.text when allowDbStatement is true but db.system(.name) is absent or not postgresql', () => {
			// Redis 計装も同じ `db.query.text` を使うため、PostgreSQL 以外では許可しない。
			const sql = 'SELECT * FROM notes WHERE id = $1';
			expect(sanitizeAttributes({ 'db.statement': sql }, { allowDbStatement: true })).not.toHaveProperty('db.statement');
			expect(sanitizeAttributes({
				'db.query.text': 'setex webauthn:challenge:user123 90 CHALLENGE_NONCE',
				'db.system.name': 'redis',
			}, { allowDbStatement: true })).not.toHaveProperty('db.query.text');
		});

		test('strips NUL/CR/LF/ESC control characters even when allowed', () => {
			const withControlChars = 'SELECT 1\x00 -- comment\r\ncontinued\x1b[31m';
			const result = sanitizeAttributes({ 'db.statement': withControlChars, 'db.system': 'postgresql' }, { allowDbStatement: true })['db.statement'] as string;
			expect(result).not.toMatch(/[\x00\r\n\x1b]/);
			expect(result).toBe('SELECT 1 -- commentcontinued[31m');
		});

		test('truncates to an 8 KiB UTF-8 byte limit without splitting a multi-byte character', () => {
			// 'あ' はUTF-8で3バイト。3000文字 = 9000バイトで上限(8192バイト)を超える。
			const multiByteChar = 'あ';
			const oversized = multiByteChar.repeat(3000);
			const result = sanitizeAttributes({ 'db.statement': oversized, 'db.system': 'postgresql' }, { allowDbStatement: true })['db.statement'] as string;
			const byteLength = Buffer.byteLength(result, 'utf8');
			expect(byteLength).toBeLessThanOrEqual(8 * 1024);
			// 末尾が壊れた(欠けた)文字にならず、完全な'あ'の繰り返しのままであることを確認する。
			expect(result).toBe(multiByteChar.repeat(result.length));
			expect(byteLength).toBeGreaterThan(8 * 1024 - 3);
		});

		test('never allows db.postgresql.values / db.connection_string / db.user even with allowDbStatement (allowlist stays exact)', () => {
			const result = sanitizeAttributes({
				'db.postgresql.values': 'DO_NOT_EXPORT',
				'db.connection_string': 'postgres://user:DO_NOT_EXPORT@host/db',
				'db.user': 'DO_NOT_EXPORT',
			}, { allowDbStatement: true });
			expect(result).toEqual({});
		});

		test('requires db.system and db.system.name to agree on postgresql; a forged mismatch does not pass db.statement', () => {
			// DB 種別が相反する属性集合では SQL 本文を許可しない。
			const sql = 'SELECT * FROM notes WHERE id = $1';
			expect(sanitizeAttributes({
				'db.statement': sql,
				'db.system': 'postgresql',
				'db.system.name': 'redis',
			}, { allowDbStatement: true })).not.toHaveProperty('db.statement');
			// 両方が一致していれば引き続き許可する。
			expect(sanitizeAttributes({
				'db.statement': sql,
				'db.system': 'postgresql',
				'db.system.name': 'postgresql',
			}, { allowDbStatement: true })['db.statement']).toBe(sql);
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

		test('redacts hook attributes whose value is not an identifier chain, and drops fastify.root', () => {
			expect(sanitizeAttributes({
				'hook.name': '/notes/1?i=DO_NOT_EXPORT',
				'fastify.type': 'not-a-known-type',
				'hook.callback.name': 'free form text',
				// マーカー用の属性は許可一覧に無いため落とす。
				'fastify.root': '@fastify/otel',
			})).toEqual({
				'hook.name': '[redacted]',
				'fastify.type': '[redacted]',
				'hook.callback.name': '[redacted]',
			});
		});
	});
});
