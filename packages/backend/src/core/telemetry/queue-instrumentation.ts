/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { injectTraceContext } from './telemetry-registry.js';
import { injectQueueTraceContext } from './queue-trace-context.js';
import type * as Bull from 'bullmq';

/**
 * Queue の add/addBulk をラップし、全ての BullMQ enqueue 経路を一箇所で捕捉する。
 * QueueService を通さず直接 add/addBulk する呼び出し元もあるため、それぞれで注入すると漏れやすい。
 */
export function instrumentQueue<T extends object>(queue: Bull.Queue<T>): Bull.Queue<T> {
	// BullMQ のメソッドは Queue インスタンスを this として使うため、差し替え前に bind して保持する。
	const add = queue.add.bind(queue);
	queue.add = ((name, data, opts) => {
		// BullMQ が data を Redis 用にシリアライズする前に、enqueue 元の context を内部フィールドへ追加する。
		injectQueueTraceContext(data, injectTraceContext);
		return add(name, data, opts);
	}) as typeof queue.add;

	// addBulk は複数ジョブを一度にシリアライズするので、各 data へ同じ context を注入する。
	const addBulk = queue.addBulk.bind(queue);
	queue.addBulk = ((jobs) => {
		for (const job of jobs) {
			injectQueueTraceContext(job.data, injectTraceContext);
		}
		return addBulk(jobs);
	}) as typeof queue.addBulk;

	return queue;
}
