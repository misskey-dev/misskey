/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { injectTraceContext } from './telemetry-registry.js';
import { injectQueueTraceContext } from './queue-trace-context.js';
import type * as Bull from 'bullmq';

/**
 * 全ての BullMQ enqueue 経路を一箇所で捕捉する。
 * QueueService 以外の直接 add/addBulk 呼び出しもあるため、各呼び出し元で注入すると漏れやすい。
 */
export function instrumentQueue<T extends object>(queue: Bull.Queue<T>): Bull.Queue<T> {
	const add = queue.add.bind(queue);
	queue.add = ((name, data, opts) => {
		injectQueueTraceContext(data, injectTraceContext);
		return add(name, data, opts);
	}) as typeof queue.add;

	const addBulk = queue.addBulk.bind(queue);
	queue.addBulk = ((jobs) => {
		for (const job of jobs) {
			injectQueueTraceContext(job.data, injectTraceContext);
		}
		return addBulk(jobs);
	}) as typeof queue.addBulk;

	return queue;
}
