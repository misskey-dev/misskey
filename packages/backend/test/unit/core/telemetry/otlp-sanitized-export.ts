/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createServer } from 'node:http';
import { once } from 'node:events';
import { describe, expect, test } from 'vitest';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { createSanitizedReadableSpan } from '@/core/telemetry/SanitizingSpanProcessor.js';

describe('OTLP sanitized export boundary', () => {
	test('serializes only the facade through the installed OTLP exporter', async () => {
		let body = Buffer.alloc(0);
		const server = createServer((request, response) => {
			const chunks: Buffer[] = [];
			request.on('data', chunk => chunks.push(Buffer.from(chunk)));
			request.on('end', () => { body = Buffer.concat(chunks); response.writeHead(200).end(); });
		});
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		try {
			const address = server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('loopback server did not bind');
			}
			const raw = {
				name: 'API: DO_NOT_EXPORT?secret=DO_NOT_EXPORT', attributes: { 'http.route': '/safe/:id', 'http.request.method': 'GET', private: 'DO_NOT_EXPORT' },
				events: [
					{ name: 'DO_NOT_EXPORT' },
					// 例外情報は制御文字と長さを制限したうえで OTLP に残す。
					{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom in foo.ts', 'exception.stacktrace': 'TypeError: boom\n    at foo (foo.ts:1:1)' } },
				],
				// link は jobTraceContextMode: 'link' の下で別 trace を指すのが正常なので、自 span とは異なる trace/span id を使う。
				links: [{ context: { traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', spanId: 'bbbbbbbbbbbbbbbb', traceFlags: 1, isRemote: true }, attributes: { private: 'DO_NOT_EXPORT' }, traceState: { private: 'DO_NOT_EXPORT' } }],
				status: { code: 0 }, resource: { attributes: { 'service.name': 'misskey-backend', private: 'DO_NOT_EXPORT' } },
				instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], duration: [0, 1],
				parentSpanContext: { traceId: '0123456789abcdef0123456789abcdef', spanId: 'fedcba9876543210', traceFlags: 1, isRemote: true, traceState: { private: 'DO_NOT_EXPORT' } },
				spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false, traceState: { private: 'DO_NOT_EXPORT' } }),
				_private: 'DO_NOT_EXPORT',
			};
			const facade = createSanitizedReadableSpan(raw as any)!;
			expect(facade.parentSpanContext).toEqual({
				traceId: '0123456789abcdef0123456789abcdef',
				spanId: 'fedcba9876543210',
				traceFlags: 1,
				isRemote: true,
			});
			expect(facade.parentSpanContext).not.toHaveProperty('traceState');
			// stacktrace の改行は制御文字除去の対象になる。
			expect(facade.events).toEqual([{ name: 'exception', time: [1, 0], droppedAttributesCount: 0, attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom in foo.ts', 'exception.stacktrace': 'TypeError: boom    at foo (foo.ts:1:1)' } }]);
			expect(facade.links).toEqual([{ context: { traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', spanId: 'bbbbbbbbbbbbbbbb', traceFlags: 1, isRemote: true } }]);
			const exporter = new OTLPTraceExporter({ url: `http://127.0.0.1:${address.port}/v1/traces` });
			await new Promise<void>((resolve, reject) => exporter.export([facade], result => result.code === 0 ? resolve() : reject(result.error)));
			await exporter.shutdown();
			const wire = body.toString('latin1');
			expect(body.length).toBeGreaterThan(0);
			expect(body.includes(Buffer.from('fedcba9876543210', 'hex'))).toBe(true);
			// link の span_id (別trace) が protobuf 上に実際に乗ることを確認する。
			expect(body.includes(Buffer.from('bbbbbbbbbbbbbbbb', 'hex'))).toBe(true);
			expect(wire).toContain('TypeError');
			expect(wire).toContain('boom in foo.ts');
			expect(wire).toContain('at foo (foo.ts:1:1)');
			expect(wire).not.toContain('DO_NOT_EXPORT');
			expect(wire).toContain('/safe/:id');
		} finally {
			server.close();
			await once(server, 'close');
		}
	}, 10000);
});
