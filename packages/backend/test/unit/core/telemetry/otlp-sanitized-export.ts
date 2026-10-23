/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createServer } from 'node:http';
import { once } from 'node:events';
import { describe, expect, test } from 'vitest';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SanitizingSpanProcessor } from '@/core/telemetry/SanitizingSpanProcessor.js';

describe('OTLP sanitized export boundary', () => {
	test('serializes only sanitized spans through the installed OTLP exporter', async () => {
		let body = Buffer.alloc(0);
		const server = createServer((request, response) => {
			const chunks: Buffer[] = [];
			request.on('data', chunk => chunks.push(Buffer.from(chunk)));
			request.on('end', () => { body = Buffer.concat(chunks); response.writeHead(200).end(); });
		});
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		const address = server.address();
		if (address == null || typeof address === 'string') {
			throw new Error('loopback server did not bind');
		}

		// 実際の provider から span を作り、sanitizer を経由して実際の exporter で直列化する。
		const exporter = new OTLPTraceExporter({ url: `http://127.0.0.1:${address.port}/v1/traces` });
		const provider = new NodeTracerProvider({
			resource: resourceFromAttributes({ 'service.name': 'misskey-backend' }),
			spanProcessors: [new SanitizingSpanProcessor(new SimpleSpanProcessor(exporter))],
		});
		try {
			const tracer = provider.getTracer('misskey-backend');
			const span = tracer.startSpan('GET /notes/:id', {
				attributes: {
					'http.request.method': 'GET',
					'http.route': '/notes/:id',
					'url.path': '/notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT',
					'user_agent.original': 'DO_NOT_EXPORT',
				},
			});
			span.addEvent('DO_NOT_EXPORT');
			span.recordException(new TypeError('boom in foo.ts'));
			span.setStatus({ code: 2, message: 'DO_NOT_EXPORT' });
			span.end();
			await provider.forceFlush();

			const wire = body.toString('latin1');
			expect(body.length).toBeGreaterThan(0);
			expect(wire).toContain('GET /notes/:id');
			expect(wire).toContain('/notes/:id');
			expect(wire).toContain('misskey-backend');
			expect(wire).toContain('TypeError');
			expect(wire).toContain('boom in foo.ts');
			expect(wire).not.toContain('DO_NOT_EXPORT');
		} finally {
			await provider.shutdown();
			server.close();
			await once(server, 'close');
		}
	}, 10000);
});
