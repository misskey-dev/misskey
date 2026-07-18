/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { Queue, Worker } from 'bullmq';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { loadConfig } from '@/config.js';
import { installRedisInstrumentation } from '@/core/telemetry/redis-instrumentation.js';

const config = loadConfig();

describe('Redis telemetry instrumentation', () => {
	test('records Redis spans below HTTP and BullMQ worker spans without Redis arguments', async () => {
		const exporter = new InMemorySpanExporter();
		const provider = new NodeTracerProvider({
			spanProcessors: [new SimpleSpanProcessor(exporter)],
		});
		provider.register();

		const tracer = provider.getTracer('telemetry-redis-instrumentation-test');
		const uninstall = installRedisInstrumentation(tracer, SpanKind.CLIENT, SpanStatusCode.ERROR, {
			captureCommandSpans: true,
		});
		const queueName = `telemetry-${randomUUID()}`;
		const prefix = `telemetry-${randomUUID()}`;
		const connection = {
			host: config.redis.host,
			port: config.redis.port,
			...(config.redis.password != null ? { password: config.redis.password } : {}),
		};
		const queue = new Queue(queueName, { connection, prefix });
		let worker: Worker | undefined;
		let httpSpanId: string | undefined;
		let jobSpanId: string | undefined;
		const secret = `secret-${randomUUID()}`;

		try {
			const processed = new Promise<void>((resolve, reject) => {
				worker = new Worker(queueName, async job => {
					return await tracer.startActiveSpan('Queue: telemetry test', async jobSpan => {
						jobSpanId = jobSpan.spanContext().spanId;
						try {
							// updateData uses BullMQ's worker-side ioredis client.
							await job.updateData({ secret });
							return 'ok';
						} finally {
							jobSpan.end();
						}
					});
				}, { connection, prefix });
				worker.once('completed', () => resolve());
				worker.once('failed', (_job, error) => reject(error));
			});

			await tracer.startActiveSpan('HTTP POST /telemetry-test', async httpSpan => {
				httpSpanId = httpSpan.spanContext().spanId;
				try {
					// Queue#add uses BullMQ's producer-side ioredis client.
					await queue.add('probe', { secret });
				} finally {
					httpSpan.end();
				}
			});
			await processed;
			await provider.forceFlush();

			const redisSpans = exporter.getFinishedSpans().filter(span => span.attributes['db.system.name'] === 'redis');
			expect(redisSpans.some(span => span.parentSpanContext?.spanId === httpSpanId)).toBe(true);
			expect(redisSpans.some(span => span.parentSpanContext?.spanId === jobSpanId)).toBe(true);
			for (const span of redisSpans) {
				expect(span.attributes).not.toHaveProperty('db.statement');
				expect(span.attributes).not.toHaveProperty('db.query.text');
				expect(Object.values(span.attributes)).not.toContain(secret);
			}
		} finally {
			await worker?.close();
			await queue.obliterate({ force: true });
			await queue.close();
			uninstall();
			await provider.shutdown();
		}
	}, 30000);
});
