/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { loadConfig } from '@/config.js';
import { SearchIndexMaintenanceQueue } from '@/queue/SearchIndexMaintenanceQueue.js';

describe('SearchIndexMaintenanceQueue', () => {
	let maintenance: SearchIndexMaintenanceQueue;

	beforeEach(() => {
		const base = loadConfig();
		maintenance = new SearchIndexMaintenanceQueue({
			...base,
			fulltextSearch: { provider: 'meilisearch' },
			meilisearch: { host: '127.0.0.1', port: '57712', index: 'test', apiKey: '', scope: 'local', ssl: false },
			redisForJobQueue: { ...base.redisForJobQueue, prefix: `test-maintenance-${randomUUID()}` },
		});
	});

	afterEach(async () => {
		await maintenance.queue.obliterate({ force: true });
		const client = await maintenance.queue.getBackend().client;
		await client.del(maintenance.queue.toKey('pending-mutation'));
		await maintenance.queue.close();
	});

	test('keeps a pending write fenced after BullMQ loses the original worker and job', async () => {
		const { jobId } = await maintenance.enqueue({ operation: 'reset' }, null);
		const job = (await maintenance.queue.getJob(jobId))!;
		const client = await maintenance.queue.getBackend().client;
		await client.set(maintenance.queue.toKey(`${jobId}:lock`), 'original-token');
		job.token = 'original-token';
		const mutation = await maintenance.beginMutation(job);
		await client.del(maintenance.queue.toKey(`${jobId}:lock`));
		await job.remove();

		await expect(maintenance.enqueue({ operation: 'reindex' }, null)).rejects.toMatchObject({ code: 'SEARCH_INDEX_RECOVERY_REQUIRED', jobId });
		await expect(maintenance.beginMutation(job)).rejects.toThrow(/lost.*lock/i);
		await maintenance.recordTask(mutation, 0);
		expect(await maintenance.getPendingMutation()).toMatchObject({ ...mutation, taskUid: 0 });
		await maintenance.releaseMutation(mutation);
		await expect(maintenance.enqueue({ operation: 'reindex' }, null)).resolves.toHaveProperty('jobId');
	});
});
